// ═══════════════════════════════════════════════════
//  editor.js  —  main editor state + Firebase logic
// ═══════════════════════════════════════════════════

// ── State ────────────────────────────────────────────────
let user       = null;
let weddingId  = null;
let blocks     = [];
let theme      = { ...DEFAULT_THEME };
let selectedId = null;
let canvasSortable = null;
let paletteSortable = null;

// ── Firebase init ────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
const db   = firebase.firestore();
const auth = firebase.auth();

auth.onAuthStateChanged(u => {
  user = u;
  if (u) {
    document.getElementById('user-avatar').src = u.photoURL || '';
    document.getElementById('user-name').textContent = u.displayName || u.email;
    document.getElementById('signout-btn').style.display = '';
    closeModal('signin-modal');
    loadUserWeddings();
  } else {
    openModal('signin-modal');
  }
  document.getElementById('app-loading').classList.add('out');
});

async function signInWithGoogle() {
  try {
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  } catch(e) { toast('Sign-in failed: ' + e.message, 'err'); }
}
function signOut() {
  auth.signOut();
  blocks = []; weddingId = null; selectedId = null;
  renderCanvas(); updateWeddingSelect([]);
  toast('Signed out', 'ok');
}

// ═══════════════════════════════════════════════════
//  WEDDING CRUD
// ═══════════════════════════════════════════════════
async function loadUserWeddings() {
  try {
    const snap = await db.collection('weddings').where('ownerId','==',user.uid).get();
    const list = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    updateWeddingSelect(list);
    if (list.length === 1) onWeddingSelect(list[0].id);
  } catch(e) { console.error(e); toast('Could not load weddings', 'err'); }
}

function updateWeddingSelect(list) {
  const sel = document.getElementById('wedding-select');
  sel.innerHTML = '<option value="">— Select a Wedding —</option>';
  list.forEach(w => {
    const o = document.createElement('option');
    o.value = w.id; o.textContent = w.coupleNames || w.id;
    sel.appendChild(o);
  });
  if (weddingId) sel.value = weddingId;
}

async function onWeddingSelect(id) {
  if (!id) return;
  weddingId = id;
  try {
    const snap = await db.collection('weddings').doc(id).get();
    if (!snap.exists) { toast('Wedding not found', 'err'); return; }
    const data = snap.data();
    blocks = (data.blocks||[]).map(b => ({ ...b, _id: b._id || nextUid() }));
    theme  = { ...DEFAULT_THEME, ...(data.theme||{}) };
    applyThemeCSS(theme);
    renderCanvas();
    toast('Loaded: ' + (data.coupleNames||id), 'ok');
  } catch(e) { toast('Error loading', 'err'); console.error(e); }
}

async function createWedding() {
  const rawId = document.getElementById('new-id').value.trim();
  const id    = rawId.replace(/\s+/g,'+');
  const title = document.getElementById('new-title').value.trim();
  const date  = document.getElementById('new-date').value;
  if (!id) { toast('Enter couple names', 'err'); return; }
  if (!user) { toast('Sign in first', 'err'); return; }
  try {
    const initBlock = createBlock('hero');
    initBlock.title = title || id; initBlock.date = date;
    await db.collection('weddings').doc(id).set({
      ownerId:     user.uid,
      coupleNames: title || id,
      date, theme: DEFAULT_THEME,
      blocks: [initBlock],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    closeModal('new-wedding-modal');
    toast('Wedding page created!', 'ok');
    await loadUserWeddings();
    onWeddingSelect(id);
  } catch(e) { toast('Create failed: ' + e.message, 'err'); }
}

async function saveWedding() {
  if (!weddingId) { toast('Select or create a wedding first', 'err'); return; }
  if (!user)      { toast('Sign in first', 'err'); return; }
  const btn = document.getElementById('save-btn');
  btn.textContent = '⏳ Saving…'; btn.disabled = true;
  try {
    await db.collection('weddings').doc(weddingId).set(
      { blocks, theme, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    toast('Saved!', 'ok');
    const ind = document.getElementById('save-indicator');
    ind.classList.add('show');
    setTimeout(() => ind.classList.remove('show'), 3000);
  } catch(e) { toast('Save failed: ' + e.message, 'err'); }
  btn.textContent = '💾 Save'; btn.disabled = false;
}

function previewPage() {
  if (!weddingId) { toast('Save first, then preview', 'err'); return; }
  window.open(`index.html?weddingId=${encodeURIComponent(weddingId)}`, '_blank');
}
function viewRsvps() {
  if (!weddingId) { toast('Select a wedding first', 'err'); return; }
  window.open(`rsvps.html?weddingId=${encodeURIComponent(weddingId)}`, '_blank');
}

// ═══════════════════════════════════════════════════
//  BLOCK CRUD
// ═══════════════════════════════════════════════════
function addBlock(type) {
  if (!weddingId) { toast('Select or create a wedding first', 'err'); return null; }
  const b = createBlock(type);
  blocks.push(b);
  renderCanvas();
  selectBlock(b._id);
  return b;
}

// _syncBlocksFromDOM: reads canvas DOM order and reorders blocks[] to match.
// This is the only reliable way to sync after Sortable operations.
function _syncBlocksFromDOM() {
  const els = [...document.querySelectorAll('#canvas-inner .canvas-block')];
  const idOrder = els.map(el => el.dataset.id);
  const map = {};
  blocks.forEach(b => { map[b._id] = b; });
  const reordered = idOrder.map(id => map[id]).filter(Boolean);
  // Also keep any blocks not yet in the DOM (shouldn't happen, but safety net)
  blocks.length = 0;
  reordered.forEach(b => blocks.push(b));
}

function removeBlock(id) {
  // Sync from DOM first so our array reflects current drag state
  _syncBlocksFromDOM();
  blocks = blocks.filter(b => b._id !== id);
  if (selectedId === id) { selectedId = null; }
  renderCanvas();
  renderProperties();
}

function duplicateBlock(id) {
  const idx = blocks.findIndex(b => b._id === id);
  if (idx < 0) return;
  const copy = JSON.parse(JSON.stringify(blocks[idx]));
  copy._id = nextUid();
  blocks.splice(idx+1, 0, copy);
  renderCanvas(); selectBlock(copy._id);
}

// Update a top-level key on the selected block
function updateBlock(id, key, val) {
  const b = blocks.find(b => b._id === id);
  if (!b) return;
  b[key] = val;
  refreshBlockPreview(id);
}

function setProp(key, val) {
  if (!selectedId) return;
  updateBlock(selectedId, key, val);
  renderProperties();     // re-render panel to reflect new state
}

// ── Carousel helpers ─────────────────────────────────────
function addCarouselSlide() {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || b.type !== 'carousel') return;
  if (!b.images) b.images = [];
  b.images.push({ src:'', caption:'' });
  refreshBlockPreview(selectedId);
  renderProperties();
}
function removeCarouselSlide(i) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b) return;
  b.images.splice(i,1);
  refreshBlockPreview(selectedId); renderProperties();
}
function setCarouselSlide(i, key, val) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || !b.images[i]) return;
  if (typeof b.images[i] === 'string') b.images[i] = { src: b.images[i] };
  b.images[i][key] = val;
  refreshBlockPreview(selectedId);
}

// ── Gallery helpers ──────────────────────────────────────
function addGalleryImage() {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || b.type !== 'gallery') return;
  if (!b.images) b.images = [];
  b.images.push({ src:'' });
  refreshBlockPreview(selectedId); renderProperties();
}
function removeGalleryImage(i) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b) return;
  b.images.splice(i,1);
  refreshBlockPreview(selectedId); renderProperties();
}
function setGalleryImage(i, key, val) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || !b.images[i]) return;
  if (typeof b.images[i] === 'string') b.images[i] = { src: b.images[i] };
  b.images[i][key] = val;
  refreshBlockPreview(selectedId);
}

// ── Details helpers ──────────────────────────────────────
function addDetailCard() {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || b.type !== 'details') return;
  if (!b.items) b.items = [];
  b.items.push({ icon:'📅', title:'', content:'' });
  refreshBlockPreview(selectedId); renderProperties();
}
function addDetailFromTemplate(tplIdx) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b) return;
  if (!b.items) b.items = [];
  b.items.push({ ...DETAIL_TEMPLATES[tplIdx] });
  refreshBlockPreview(selectedId); renderProperties();
}
function removeDetailCard(i) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b) return;
  b.items.splice(i,1);
  refreshBlockPreview(selectedId); renderProperties();
}
function setDetailCard(i, key, val) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || !b.items[i]) return;
  b.items[i][key] = val;
  refreshBlockPreview(selectedId);
}

// ── Icon picker ──────────────────────────────────────────
function toggleIconPicker(cardIndex) {
  const wrap = document.getElementById(`ipw-${cardIndex}`);
  if (wrap) wrap.style.display = wrap.style.display === 'none' ? '' : 'none';
}
// Called when icon button clicked inside picker
function selectDetailIcon(cardIndex, emoji, btnEl) {
  const b = blocks.find(b => b._id === selectedId);
  if (!b || !b.items[cardIndex]) return;
  b.items[cardIndex].icon = emoji;
  // Update preview icon
  const prev = document.getElementById(`icon-preview-${cardIndex}`);
  if (prev) prev.textContent = emoji;
  // Update selected state in picker
  btnEl.closest('.icon-picker').querySelectorAll('.ip-btn')
    .forEach(btn => btn.classList.toggle('selected', btn === btnEl));
  // Hide picker
  const wrap = document.getElementById(`ipw-${cardIndex}`);
  if (wrap) wrap.style.display = 'none';
  refreshBlockPreview(selectedId);
}

// Fix: renderIconPicker generates buttons with correct onclick
function renderIconPicker(selectedEmoji, _unused) {
  let html = `<div class="icon-picker">`;
  for (const [cat, icons] of Object.entries(WEDDING_ICONS)) {
    html += `<div class="ip-category">${cat}</div><div class="ip-grid">`;
    html += icons.map(ic =>
      `<button type="button" class="ip-btn${ic.emoji===selectedEmoji?' selected':''}"
        title="${ic.label}"
        data-emoji="${ic.emoji}">${ic.emoji}</button>`
    ).join('');
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}

// Delegated click handler for icon buttons (set in editor.html init)
function _handleIconPickerClick(e) {
  const btn = e.target.closest('.ip-btn');
  if (!btn) return;
  const wrap = btn.closest('.icon-picker-wrap');
  if (!wrap) return;
  const cardIndex = parseInt(wrap.id.replace('ipw-',''));
  selectDetailIcon(cardIndex, btn.dataset.emoji, btn);
}

// ═══════════════════════════════════════════════════
//  CANVAS RENDERING
// ═══════════════════════════════════════════════════
function renderCanvas() {
  if (canvasSortable) { canvasSortable.destroy(); canvasSortable = null; }

  const inner = document.getElementById('canvas-inner');
  const empty = document.getElementById('canvas-empty');

  if (!blocks.length) {
    empty.style.display = '';
    inner.innerHTML = '';
    initSortables();
    return;
  }
  empty.style.display = 'none';
  inner.innerHTML = '';
  blocks.forEach(b => inner.appendChild(makeBlockEl(b)));
  initSortables();
  // Attach icon picker delegation
  document.getElementById('canvas-inner').removeEventListener('click', _handleIconPickerClick);
}

function makeBlockEl(b) {
  const div = document.createElement('div');
  div.className = `canvas-block${b._id === selectedId ? ' selected' : ''}`;
  div.dataset.id   = b._id;
  div.dataset.type = b.type;

  const label = (BLOCK_META[b.type]||{}).label || b.type;
  div.innerHTML = `
    <div class="block-toolbar">
      <span class="block-drag" title="Drag to reorder">⠿</span>
      <span class="bt-name">${label}</span>
      <div class="bt-actions">
        <button type="button" class="bt-btn" onclick="duplicateBlock('${b._id}')" title="Duplicate">⧉</button>
        <button type="button" class="bt-btn del" onclick="removeBlock('${b._id}')" title="Delete">✕</button>
      </div>
    </div>
    <div class="block-preview-wrap" onclick="selectBlock('${b._id}')" style="cursor:pointer">
      ${getBlockPreviewHTML(b)}
    </div>`;
  return div;
}

function refreshBlockPreview(id) {
  const wrap = document.querySelector(`.canvas-block[data-id="${id}"] .block-preview-wrap`);
  if (!wrap) return;
  const b = blocks.find(b => b._id === id);
  if (b) wrap.innerHTML = getBlockPreviewHTML(b);
}

function selectBlock(id) {
  selectedId = id;
  document.querySelectorAll('.canvas-block').forEach(el =>
    el.classList.toggle('selected', el.dataset.id === id)
  );
  renderProperties();
  const el = document.querySelector(`.canvas-block[data-id="${id}"]`);
  if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
}

// ═══════════════════════════════════════════════════
//  PROPERTIES PANEL
// ═══════════════════════════════════════════════════
function renderProperties() {
  const body   = document.getElementById('sr-body');
  const typeEl = document.getElementById('sr-block-type');

  if (!selectedId) {
    typeEl.textContent = 'No block selected';
    body.innerHTML = `<div class="sr-empty"><div class="se-icon">✦</div><p>Click any block on the canvas to edit its properties here.</p></div>`;
    return;
  }
  const b = blocks.find(b => b._id === selectedId);
  if (!b) return;
  typeEl.textContent = (BLOCK_META[b.type]||{}).label || b.type;
  body.innerHTML = getPropsHTML(b);
  bindPropInputs(b);
  // Attach icon picker delegation after render
  document.getElementById('sr-body').addEventListener('click', _handleIconPickerClick);
}

function bindPropInputs(b) {
  document.getElementById('sr-body').querySelectorAll('[data-key]').forEach(el => {
    const key = el.dataset.key;
    const ev  = el.type === 'checkbox' ? 'change'
              : (el.tagName === 'TEXTAREA' || el.type === 'range') ? 'input'
              : 'change';

    el.addEventListener(ev, () => {
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'number') v = Number(el.value);
      else v = el.value;

      updateBlock(b._id, key, v);

      // Update range display
      if (el.type === 'range') {
        const rv = document.getElementById(`rv-${key}`);
        if (rv) rv.textContent = Number(el.value).toFixed(2);
      }
      // If toggling blockBgOverride — re-render props so color picker appears/disappears
      if (key === 'blockBgOverride' || key === 'mode') {
        renderProperties();
      }
    });
  });

  // Sync colour text input <-> colour picker
  document.getElementById('sr-body').querySelectorAll('[data-key-text]').forEach(textEl => {
    const key    = textEl.dataset.keyText;
    const picker = document.querySelector(`#sr-body [data-key="${key}"][type=color]`);
    if (!picker) return;
    textEl.addEventListener('input', () => { picker.value = textEl.value; updateBlock(b._id, key, textEl.value); });
    picker.addEventListener('input', () => { textEl.value = picker.value; updateBlock(b._id, key, picker.value); });
  });
}

// ═══════════════════════════════════════════════════
//  SORTABLE DRAG & DROP
// ═══════════════════════════════════════════════════
function initSortables() {
  const palette = document.getElementById('palette');
  const inner   = document.getElementById('canvas-inner');

  if (!paletteSortable) {
    paletteSortable = Sortable.create(palette, {
      group: { name:'blocks', pull:'clone', put:false },
      sort: false, animation:150,
      ghostClass: 'sortable-ghost',
    });
  }

  canvasSortable = Sortable.create(inner, {
    group: { name:'blocks', pull:true, put:true },
    animation: 220,
    handle: '.block-drag',
    ghostClass: 'sortable-ghost',
    dragClass:  'sortable-drag',
    // When a palette item is dropped onto the canvas
    onAdd(evt) {
      const type = evt.item.dataset.type;
      const idx  = evt.newIndex;
      evt.item.remove(); // remove the cloned palette node; we'll re-render
      if (!weddingId) { toast('Select or create a wedding first','err'); return; }
      const b = createBlock(type);
      // Insert at the position the user dropped it
      blocks.splice(Math.min(idx, blocks.length), 0, b);
      // Defer so Sortable finishes its own DOM cleanup first
      setTimeout(() => { renderCanvas(); selectBlock(b._id); }, 0);
    },
    // When blocks are reordered within the canvas — sync by reading DOM order
    // (index arithmetic is unreliable because ghost elements affect indices)
    onEnd(evt) {
      if (evt.from !== evt.to) return; // cross-list handled by onAdd
      // Rebuild blocks array in the order the DOM now shows
      _syncBlocksFromDOM();
    }
  });
}

// ═══════════════════════════════════════════════════
//  THEME
// ═══════════════════════════════════════════════════
function applyThemeCSS(t) {
  const r = document.documentElement.style;
  r.setProperty('--primary',   t.primary    || DEFAULT_THEME.primary);
  r.setProperty('--secondary', t.secondary  || DEFAULT_THEME.secondary);
  r.setProperty('--bg',        t.background || DEFAULT_THEME.background);
  r.setProperty('--text',      t.text       || DEFAULT_THEME.text);
  r.setProperty('--accent',    t.accent     || DEFAULT_THEME.accent);
  r.setProperty('--fh', `'${t.fontHeading || DEFAULT_THEME.fontHeading}', serif`);
  r.setProperty('--fb', `'${t.fontBody    || DEFAULT_THEME.fontBody}', sans-serif`);
  // Re-render all block previews so they pick up new CSS vars
  blocks.forEach(b => refreshBlockPreview(b._id));
}

function buildThemeModal() {
  const THEME_COLOR_FIELDS = [
    { key:'primary',    label:'Accent / Primary' },
    { key:'secondary',  label:'Dark / Secondary' },
    { key:'background', label:'Page Background' },
    { key:'text',       label:'Body Text' },
    { key:'accent',     label:'Light Accent fill' },
  ];

  // Color pickers
  document.getElementById('theme-colors').innerHTML = THEME_COLOR_FIELDS.map(f => `
    <div class="theme-swatch">
      <input type="color" id="tc-${f.key}" value="${theme[f.key]||'#000000'}" oninput="onThemeColor('${f.key}',this.value)">
      <div class="theme-swatch-info">
        <div class="ts-label">${f.label}</div>
        <div class="ts-val" id="tv-${f.key}">${theme[f.key]||''}</div>
      </div>
    </div>`).join('');

  // Font selects
  const makeFontOpts = (sel) => FONT_OPTIONS.map(f => `<option${f===sel?' selected':''}>${f}</option>`).join('');
  document.getElementById('theme-font-heading').innerHTML = makeFontOpts(theme.fontHeading);
  document.getElementById('theme-font-body').innerHTML    = makeFontOpts(theme.fontBody);

  // Preset swatches
  document.getElementById('theme-presets').innerHTML = THEME_PRESETS.map(p => `
    <div class="preset-swatch" onclick='applyPreset(${JSON.stringify(p)})' title="${p.name}">
      <div style="height:32px;background:${p.secondary}"></div>
      <div style="height:10px;background:${p.primary}"></div>
      <div class="ps-name">${p.name}</div>
    </div>`).join('');
}

function onThemeColor(key, val) {
  theme[key] = val;
  const tv = document.getElementById(`tv-${key}`);
  if (tv) tv.textContent = val;
  applyThemeCSS(theme);
}
function onThemeFont(key, val) {
  theme[key] = val;
  applyThemeCSS(theme);
}
function applyPreset(p) {
  Object.assign(theme, p);
  applyThemeCSS(theme);
  buildThemeModal();
  toast(`"${p.name}" palette applied`, 'ok');
}
function resetTheme() {
  theme = { ...DEFAULT_THEME };
  applyThemeCSS(theme);
  buildThemeModal();
}

// ═══════════════════════════════════════════════════
//  MODALS
// ═══════════════════════════════════════════════════
function openModal(id) {
  if (id === 'theme-modal') buildThemeModal();
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}
function updateNewIdPreview() {
  const v = document.getElementById('new-id').value.trim().replace(/\s+/g,'+');
  document.getElementById('new-id-preview').textContent = `?weddingId=${v}`;
}

// ═══════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════
let _toastTimer;
function toast(msg, type='ok') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ═══════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key==='s') { e.preventDefault(); saveWedding(); return; }
  if (e.key==='Escape') { selectedId=null; renderProperties(); return; }
  const tag = document.activeElement.tagName;
  if (e.key==='Delete' && selectedId && !['INPUT','TEXTAREA','SELECT'].includes(tag)) {
    removeBlock(selectedId);
  }
});

// Close modal on overlay click (except sign-in)
document.querySelectorAll('.modal-overlay').forEach(ov => {
  ov.addEventListener('click', e => {
    if (e.target===ov && ov.id!=='signin-modal') closeModal(ov.id);
  });
});

// ═══════════════════════════════════════════════════
//  BOOT
// ═══════════════════════════════════════════════════
(function boot() {
  applyThemeCSS(theme);
  renderCanvas();
  initSortables();
})();