// ═══════════════════════════════════════════════════
//  props.js  —  properties panel for each block type
// ═══════════════════════════════════════════════════

// ── Field builder helpers ────────────────────────────────
const _f = (key, label, val, type='text', extra='') =>
  `<div class="prop-group">
     <label class="prop-label">${label}</label>
     <input class="prop-input" type="${type}" data-key="${key}" value="${_hv(val)}" ${extra}>
   </div>`;

const _ta = (key, label, val, rows=3) =>
  `<div class="prop-group">
     <label class="prop-label">${label}</label>
     <textarea class="prop-textarea" data-key="${key}" rows="${rows}">${_hv(val)}</textarea>
   </div>`;

const _sel = (key, label, val, opts) =>
  `<div class="prop-group">
     <label class="prop-label">${label}</label>
     <select class="prop-select" data-key="${key}">
       ${opts.map(o=>`<option value="${o.v}"${String(val)===String(o.v)?' selected':''}>${o.l}</option>`).join('')}
     </select>
   </div>`;

const _rng = (key, label, val, min, max, step=0.05) =>
  `<div class="prop-group">
     <label class="prop-label">${label}</label>
     <div class="prop-range">
       <input type="range" data-key="${key}" value="${val}" min="${min}" max="${max}" step="${step}">
       <span class="rv" id="rv-${key}">${Number(val).toFixed(2)}</span>
     </div>
   </div>`;

const _chk = (key, label, val) =>
  `<div class="prop-group">
     <label class="prop-toggle">
       <input type="checkbox" data-key="${key}" ${val?' checked':''}>
       <span>${label}</span>
     </label>
   </div>`;

const _color = (key, label, val) =>
  `<div class="prop-group">
     <label class="prop-label">${label}</label>
     <div class="prop-color-row">
       <input type="color" data-key="${key}" value="${val||'#ffffff'}">
       <input type="text" class="prop-input" data-key-text="${key}" value="${val||''}">
     </div>
   </div>`;

const _sep = () => `<hr class="prop-divider">`;

const _btn = (label, onclick, variant='') =>
  `<button type="button" class="prop-btn ${variant}" onclick="${onclick}">${label}</button>`;

const _note = (html) =>
  `<p class="prop-note">${html}</p>`;

const _sectionHead = (label) =>
  `<div class="prop-section-head">${label}</div>`;

const _hv = v => String(v||'').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const _driveNote = () => _note(`Paste a <strong>Google Drive share link</strong>. e.g.<br><code>https://drive.google.com/file/d/ID/view</code>`);

// ── Alignment buttons ────────────────────────────────────
const _align = (val) =>
  `<div class="prop-group">
     <label class="prop-label">Alignment</label>
     <div class="align-btns">
       ${['left','center','right'].map(a =>
         `<button type="button" class="align-btn${val===a?' on':''}" onclick="setProp('align','${a}')">${{left:'⬅ Left',center:'⬛ Center',right:'➡ Right'}[a]}</button>`
       ).join('')}
     </div>
   </div>`;

// ── Background override ──────────────────────────────────
const _bgOverride = (b) =>
  `${_sep()}
   ${_sectionHead('Background Override')}
   ${_chk('blockBgOverride','Override block background colour',b.blockBgOverride)}
   ${b.blockBgOverride ? _color('blockBg','Block Background Colour',b.blockBg||'#ffffff') : ''}
   ${_note('When enabled this colour replaces the theme colour for this block only.')}`;

// ═══════════════════════════════════════════════════
//  PER-BLOCK PROPS HTML
// ═══════════════════════════════════════════════════
function getPropsHTML(b) {
  const type = b.type;

  if (type === 'hero') return propsHero(b);
  if (type === 'text') return propsText(b);
  if (type === 'image') return propsImage(b);
  if (type === 'carousel') return propsCarousel(b);
  if (type === 'countdown') return propsCountdown(b);
  if (type === 'details') return propsDetails(b);
  if (type === 'rsvp') return propsRsvp(b);
  if (type === 'gallery') return propsGallery(b);
  if (type === 'divider') return propsDivider(b);
  if (type === 'quote') return propsQuote(b);
  return `<p class="prop-note">No properties for this block.</p>`;
}

// ── Hero ─────────────────────────────────────────────────
function propsHero(b) {
  return `
    ${_sectionHead('Content')}
    ${_f('title','Couple Names',b.title)}
    ${_f('subtitle','Subtitle (optional)',b.subtitle)}
    ${_f('date','Wedding Date',b.date)}
    ${_f('venue','Venue tagline (optional)',b.venue)}
    ${_sep()}
    ${_sectionHead('Background Image')}
    ${_f('bgImage','Google Drive Image URL',b.bgImage)}
    ${_driveNote()}
    ${_rng('overlayOpacity','Dark overlay strength',b.overlayOpacity??0.45,0,0.95)}
    ${_bgOverride(b)}`;
}

// ── Text ─────────────────────────────────────────────────
function propsText(b) {
  return `
    ${_sectionHead('Content')}
    ${_f('heading','Heading (optional)',b.heading)}
    ${_ta('content','Paragraph text',b.content,5)}
    ${_align(b.align)}
    ${_sel('size','Text Size',b.size,[
      {v:'small',l:'Small'},{v:'medium',l:'Medium'},{v:'large',l:'Large'}
    ])}
    ${_bgOverride(b)}`;
}

// ── Image ────────────────────────────────────────────────
function propsImage(b) {
  return `
    ${_sectionHead('Image')}
    ${_f('src','Google Drive Image URL',b.src)}
    ${_driveNote()}
    ${_f('caption','Caption (optional)',b.caption)}
    ${_sel('width','Width',b.width,[
      {v:'full',l:'Full width'},{v:'medium',l:'Medium'},{v:'small',l:'Small / centred'}
    ])}
    ${_bgOverride(b)}`;
}

// ── Carousel ─────────────────────────────────────────────
function propsCarousel(b) {
  const imgs = b.images || [];
  return `
    ${_sectionHead('Settings')}
    ${_f('height','Slide height (px)',b.height,'number')}
    ${_chk('autoplay','Auto-play',b.autoplay)}
    ${_f('interval','Auto-play interval (ms)',b.interval,'number')}
    ${_sep()}
    ${_sectionHead(`Slides (${imgs.length})`)}
    <div id="carousel-slides">
    ${imgs.map((img,i) => _carouselSlide(img,i)).join('')}
    </div>
    ${_btn('＋ Add Slide','addCarouselSlide()','full')}
    ${_bgOverride(b)}`;
}

function _carouselSlide(img, i) {
  const src = img.src || img || '';
  const cap = img.caption || '';
  return `<div class="array-item" id="cs-${i}">
    <div class="array-item-header">
      <span class="array-item-num">Slide ${i+1}</span>
      <button type="button" class="array-item-del" onclick="removeCarouselSlide(${i})">✕</button>
    </div>
    <input class="prop-input" type="text" placeholder="Google Drive URL" value="${_hv(src)}"
      onchange="setCarouselSlide(${i},'src',this.value)" style="margin-bottom:5px">
    <input class="prop-input" type="text" placeholder="Caption (optional)" value="${_hv(cap)}"
      onchange="setCarouselSlide(${i},'caption',this.value)">
  </div>`;
}

// ── Countdown ────────────────────────────────────────────
function propsCountdown(b) {
  return `
    ${_sectionHead('Countdown')}
    ${_f('label','Label above timer',b.label)}
    ${_f('targetDate','Target Date & Time',b.targetDate,'datetime-local')}
    ${_bgOverride(b)}`;
}

// ── Details ──────────────────────────────────────────────
function propsDetails(b) {
  const items = b.items || [];
  return `
    ${_sectionHead('Section')}
    ${_f('heading','Section Heading',b.heading)}
    ${_sep()}
    ${_sectionHead('Layout Style')}
    <div class="mode-toggle">
      <button type="button" class="mode-btn${!b.listStyle?' on':''}" onclick="setProp('listStyle',false)">⊞ Card Grid</button>
      <button type="button" class="mode-btn${b.listStyle?' on':''}" onclick="setProp('listStyle',true)">☰ List</button>
    </div>
    ${_note('Card Grid: icon + title + text boxes. List: compact rows like a programme.')}
    ${_sep()}
    ${_sectionHead('Add preset card')}
    <div class="template-chips">
      ${DETAIL_TEMPLATES.map((t,i)=>
        `<button type="button" class="template-chip" onclick="addDetailFromTemplate(${i})">${t.icon} ${t.title}</button>`
      ).join('')}
    </div>
    ${_sep()}
    ${_sectionHead(`Cards (${items.length})`)}
    <div id="detail-cards">
      ${items.map((it,i) => _detailCard(it,i)).join('')}
    </div>
    ${_btn('＋ Add Blank Card','addDetailCard()','full')}
    ${_bgOverride(b)}`;
}

function _detailCard(it, i) {
  return `<div class="array-item" id="dc-${i}">
    <div class="array-item-header">
      <span class="array-item-num">Card ${i+1}</span>
      <button type="button" class="array-item-del" onclick="removeDetailCard(${i})">✕</button>
    </div>
    <label class="prop-label" style="margin-bottom:4px">Icon</label>
    <div class="icon-selected-row" id="icon-row-${i}">
      <span class="icon-preview" id="icon-preview-${i}">${it.icon||'📅'}</span>
      <button type="button" class="prop-btn secondary small" onclick="toggleIconPicker(${i})">Change Icon</button>
    </div>
    <div class="icon-picker-wrap" id="ipw-${i}" style="display:none">
      ${renderIconPicker(it.icon||'📅', `selectDetailIcon.bind(null,${i},'dummy')`)}
    </div>
    <input class="prop-input" type="text" placeholder="Title" value="${_hv(it.title||'')}"
      onchange="setDetailCard(${i},'title',this.value)" style="margin-top:6px;margin-bottom:5px">
    <textarea class="prop-textarea" placeholder="Content" rows="2"
      onchange="setDetailCard(${i},'content',this.value)">${_hv(it.content||'')}</textarea>
  </div>`;
}

// ── RSVP ─────────────────────────────────────────────────
function propsRsvp(b) {
  const isLink = b.mode === 'link';
  return `
    ${_sectionHead('Mode')}
    <div class="mode-toggle">
      <button type="button" class="mode-btn${!isLink?' on':''}" onclick="setProp('mode','form')">📋 Form</button>
      <button type="button" class="mode-btn${isLink?' on':''}" onclick="setProp('mode','link')">🔗 External Link</button>
    </div>
    ${_note(isLink
      ? 'Shows a button that opens an external RSVP URL (e.g. Google Forms, Typeform, etc.).'
      : 'Built-in form — responses are saved to Firestore. View them via the Responses page.')}
    ${_sep()}
    ${_sectionHead('Content')}
    ${_f('title','Title',b.title)}
    ${_f('subtitle','Subtitle / deadline note',b.subtitle)}
    ${isLink ? `
      ${_sep()}
      ${_sectionHead('Button')}
      ${_f('linkText','Button label',b.linkText)}
      ${_f('linkUrl','Target URL',b.linkUrl)}
      ${_note('Opens in a new tab.')}
    ` : `
      ${_sep()}
      ${_sectionHead('Form Options')}
      ${_chk('allowPartner','Allow "bringing a partner?" tick box',b.allowPartner!==false)}
      ${_note('Guests will see a tick box to indicate if they are bringing a partner.')}
    `}
    ${_bgOverride(b)}`;
}

// ── Gallery ──────────────────────────────────────────────
function propsGallery(b) {
  const imgs = b.images || [];
  return `
    ${_sectionHead('Layout')}
    ${_sel('columns','Columns',b.columns,[
      {v:2,l:'2 Columns'},{v:3,l:'3 Columns'},{v:4,l:'4 Columns'}
    ])}
    ${_sep()}
    ${_sectionHead(`Images (${imgs.length})`)}
    <div id="gallery-images">
      ${imgs.map((img,i) => _galleryImage(img,i)).join('')}
    </div>
    ${_btn('＋ Add Image','addGalleryImage()','full')}
    ${_bgOverride(b)}`;
}

function _galleryImage(img, i) {
  const src = img.src || img || '';
  return `<div class="array-item" id="gi-${i}">
    <div class="array-item-header">
      <span class="array-item-num">Image ${i+1}</span>
      <button type="button" class="array-item-del" onclick="removeGalleryImage(${i})">✕</button>
    </div>
    <input class="prop-input" type="text" placeholder="Google Drive URL" value="${_hv(src)}"
      onchange="setGalleryImage(${i},'src',this.value)">
  </div>`;
}

// ── Divider ──────────────────────────────────────────────
function propsDivider(b) {
  return `
    ${_sectionHead('Style')}
    ${_sel('style','Divider Style',b.style,[
      {v:'floral',l:'Floral ✿ ✾ ✿'},
      {v:'line',  l:'Simple Line ———'},
      {v:'dots',  l:'Dots ···'},
      {v:'wave',  l:'Wave 〰'},
    ])}
    ${_color('color','Colour',b.color||'#c9a96e')}
    ${_bgOverride(b)}`;
}

// ── Quote ────────────────────────────────────────────────
function propsQuote(b) {
  return `
    ${_sectionHead('Quote')}
    ${_ta('text','Quote text',b.text,4)}
    ${_f('author','Attribution (optional)',b.author)}
    ${_bgOverride(b)}`;
}