// ═══════════════════════════════════════════════════
//  viewer.js  —  wedding page viewer rendering
// ═══════════════════════════════════════════════════

// ── Init Firebase ────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();

// ── Parse weddingId from URL ─────────────────────────────
const _params    = new URLSearchParams(window.location.search);
const _weddingId = _params.get('weddingId');

if (!_weddingId) showError('No wedding ID in URL. Add <code>?weddingId=Name+Name</code>');
else _loadWedding(_weddingId);

async function _loadWedding(id) {
  try {
    const snap = await db.collection('weddings').doc(id).get();
    if (!snap.exists) { showError('Wedding page not found.'); return; }
    const data = snap.data();
    document.title = data.coupleNames ? `${data.coupleNames} — Our Wedding` : 'Our Wedding';
    _applyTheme(data.theme || DEFAULT_THEME);
    _renderPage(data);
  } catch(e) {
    console.error(e);
    showError('Could not load wedding data.');
  }
}

function _applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--primary',   t.primary    || DEFAULT_THEME.primary);
  r.setProperty('--secondary', t.secondary  || DEFAULT_THEME.secondary);
  r.setProperty('--bg',        t.background || DEFAULT_THEME.background);
  r.setProperty('--text',      t.text       || DEFAULT_THEME.text);
  r.setProperty('--accent',    t.accent     || DEFAULT_THEME.accent);
  r.setProperty('--fh', `'${t.fontHeading||DEFAULT_THEME.fontHeading}',serif`);
  r.setProperty('--fb', `'${t.fontBody   ||DEFAULT_THEME.fontBody}',sans-serif`);
}

function _renderPage(data) {
  const pg = document.getElementById('page');
  pg.innerHTML = (data.blocks||[]).map(_renderBlock).join('');
  pg.querySelectorAll('.b-carousel').forEach(_initCarousel);
  pg.querySelectorAll('[data-countdown]').forEach(el => _initCountdown(el, el.dataset.countdown));
  pg.querySelectorAll('.gallery-grid img').forEach((img, i, all) => {
    const imgs = [...all].map(el => ({ src: el.src, caption: el.alt || '' }));
    img.onclick = () => _openCarouselLightbox(imgs, i, null);
  });
  document.getElementById('loading').classList.add('out');
  pg.classList.add('in');
}

// ═══════════════════════════════════════════════════
//  BLOCK RENDERERS
// ═══════════════════════════════════════════════════
function _renderBlock(b) {
  const bgS = b.blockBgOverride && b.blockBg ? `background:${b.blockBg}!important;` : '';
  const wrap = (html) => b.blockBgOverride && b.blockBg
    ? `<div style="${bgS}">${html}</div>` : html;
  const map  = { hero,text,image,carousel,countdown,details,rsvp,gallery,divider,quote };
  const fn   = map[b.type];
  return fn ? wrap(fn(b)) : '';
}

function hero(b) {
  const opa = b.overlayOpacity ?? 0.45;
  const bg  = b.bgImage ? `background-image:url('${driveUrl(b.bgImage)}')` : '';
  return `
<section class="b-hero"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  ${b.bgImage?`<div class="b-hero__bg" style="${bg}"></div>`:''}
  <div class="b-hero__overlay" style="background:rgba(0,0,0,${opa})"></div>
  <div class="b-hero__content">
    <div class="b-hero__ornament">✦ ✦ ✦</div>
    <h1>${esc(b.title||'')}</h1>
    ${b.subtitle?`<p class="b-hero__sub">${esc(b.subtitle)}</p>`:''}
    ${b.date?`<p class="b-hero__date">${esc(b.date)}</p>`:''}
    ${b.venue?`<p class="b-hero__venue">${esc(b.venue)}</p>`:''}
  </div>
  <div class="b-hero__scroll"><span></span></div>
</section>`;
}

function text(b) {
  const sz = {small:'.95rem',medium:'1.05rem',large:'1.2rem'}[b.size]||'1.05rem';
  return `<div class="b-text" style="text-align:${b.align||'left'}${b.blockBgOverride&&b.blockBg?';background:'+b.blockBg:''}">
  ${b.heading?`<h2>${esc(b.heading)}</h2>`:''}
  <p style="font-size:${sz}">${esc(b.content||'').replace(/\n/g,'<br>')}</p>
</div>`;
}

function image(b) {
  if (!b.src) return '';
  const w = b.width||'full';
  return `<div class="b-image ${w}"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <figure>
    <img src="${driveUrl(b.src)}" alt="${esc(b.caption||'')}" loading="lazy">
    ${b.caption?`<figcaption>${esc(b.caption)}</figcaption>`:''}
  </figure>
</div>`;
}

function carousel(b) {
  const imgs = b.images||[];
  if (!imgs.length) return '';
  const h = b.height||520;
  return `
<section class="b-carousel" data-auto="${b.autoplay?b.interval||4000:0}" data-h="${h}"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <div class="carousel-track">
    ${imgs.map(img=>`
    <div class="carousel-slide">
      <img src="${driveUrl(imgSrc(img))}" alt="${esc(img.caption||'')}" loading="lazy" style="cursor:pointer" title="Click to enlarge">
      ${img.caption?`<figcaption>${esc(img.caption)}</figcaption>`:''}
    </div>`).join('')}
  </div>
  <button class="c-btn prev" aria-label="Previous">&#8249;</button>
  <button class="c-btn next" aria-label="Next">&#8250;</button>
  <div class="c-dots">
    ${imgs.map((_,i)=>`<div class="c-dot${i===0?' on':''}" data-i="${i}"></div>`).join('')}
  </div>
</section>`;
}

function countdown(b) {
  if (!b.targetDate) return '';
  return `
<section class="b-countdown"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <p class="b-countdown__label">${esc(b.label||'Until the Big Day')}</p>
  <div class="cd-units" data-countdown="${b.targetDate}">
    <div class="cd-unit"><span class="n" id="cd-d">--</span><span class="l">Days</span></div>
    <div class="cd-unit"><span class="n" id="cd-h">--</span><span class="l">Hours</span></div>
    <div class="cd-unit"><span class="n" id="cd-m">--</span><span class="l">Minutes</span></div>
    <div class="cd-unit"><span class="n" id="cd-s">--</span><span class="l">Seconds</span></div>
  </div>
</section>`;
}

function details(b) {
  const items = b.items||[];
  const isList = b.listStyle === true;
  const bgAttr = b.blockBgOverride&&b.blockBg ? ` style="background:${b.blockBg}"` : '';
  if (isList) {
    return `
<section class="b-details dl-style"${bgAttr}>
  ${b.heading?`<h2 class="b-details__title">${esc(b.heading)}</h2>`:''}
  <div class="dl-list">
    ${items.map(it=>`
    <div class="dl-row">
      <div class="dl-row-icon">${it.icon||'📅'}</div>
      <div class="dl-row-body">
        <span class="dl-row-title">${esc(it.title||'')}</span>
        <span class="dl-row-text">${esc(it.content||'').replace(/\n/g,'<br>')}</span>
      </div>
    </div>`).join('')}
  </div>
</section>`;
  }
  return `
<section class="b-details"${bgAttr}>
  ${b.heading?`<h2 class="b-details__title">${esc(b.heading)}</h2>`:''}
  <div class="detail-grid">
    ${items.map(it=>`
    <div class="detail-card">
      <div class="ico">${it.icon||'📅'}</div>
      <h4>${esc(it.title||'')}</h4>
      <p>${esc(it.content||'').replace(/\n/g,'<br>')}</p>
    </div>`).join('')}
  </div>
</section>`;
}

function rsvp(b) {
  const isLink = b.mode === 'link';
  return `
<section class="b-rsvp"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <h2>${esc(b.title||'RSVP')}</h2>
  ${b.subtitle?`<p class="b-rsvp__sub">${esc(b.subtitle)}</p>`:''}
  ${isLink
    ? `<div class="rsvp-link-wrap">
         <a class="rsvp-link-btn" href="${esc(b.linkUrl||'#')}" target="_blank" rel="noopener">${esc(b.linkText||'RSVP Now')}</a>
       </div>`
    : `<form class="rsvp-form" data-wid="${_weddingId}" onsubmit="submitRSVP(event,this)">
         <input name="name" type="text" placeholder="Full Name" required>
         <select name="attending">
           <option value="yes">Joyfully Accepts ♥</option>
           <option value="no">Regretfully Declines</option>
         </select>
         ${b.allowPartner !== false ? `<label class="rsvp-partner-label">
           <input name="partner" type="checkbox" value="yes" class="rsvp-partner-chk">
           <span>I will be bringing a partner</span>
         </label>` : ''}
         <button type="submit">Send RSVP</button>
       </form>
       <p class="rsvp-ok">Thank you! We can't wait to celebrate with you. ♥</p>`}
</section>`;
}

function gallery(b) {
  const imgs = b.images||[];
  if (!imgs.length) return '';
  const c = b.columns||3;
  return `
<div class="b-gallery"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <div class="gallery-grid c${c}">
    ${imgs.map(img=>`<img src="${driveUrl(imgSrc(img))}" alt="" loading="lazy">`).join('')}
  </div>
</div>`;
}

function divider(b) {
  const s = b.style||'floral';
  const c = b.color||'var(--primary)';
  const center = s==='line' ? ''
    : s==='floral' ? `<div class="div-center" style="color:${c}">✿ ✾ ✿</div>`
    : s==='dots'   ? `<div class="div-center" style="color:${c}">···</div>`
    : `<div class="div-center" style="color:${c}">〰〰〰</div>`;
  return `<div class="b-divider"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <div class="div-line" style="background:${c}"></div>${center}<div class="div-line" style="background:${c}"></div>
</div>`;
}

function quote(b) {
  return `
<section class="b-quote"${b.blockBgOverride&&b.blockBg?` style="background:${b.blockBg}"`:''}>
  <blockquote>${esc(b.text||'')}</blockquote>
  ${b.author?`<cite>— ${esc(b.author)}</cite>`:''}
</section>`;
}

// ═══════════════════════════════════════════════════
//  INTERACTIVE WIDGETS
// ═══════════════════════════════════════════════════

// Global lightbox carousel state (shared across all carousels)
let _lbImages = [];   // [{src, caption}]
let _lbIndex  = 0;
let _lbPauseCarousel = null; // fn to call to pause the active carousel

function _initCarousel(el) {
  const track  = el.querySelector('.carousel-track');
  const slides = [...el.querySelectorAll('.carousel-slide')];
  const dots   = el.querySelectorAll('.c-dot');
  const h      = parseInt(el.dataset.h) || 520;
  const auto   = parseInt(el.dataset.auto) || 0;
  let cur = 0, timer, paused = false;

  // Set track height so absolute-positioned slides fill it
  track.style.height = h + 'px';

  // Show/hide slides with crossfade
  const show = (i, anim=true) => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      s.style.transition = anim ? 'opacity .6s ease' : 'none';
      s.style.opacity    = j === cur ? '1' : '0';
      s.style.zIndex     = j === cur ? '1' : '0';
    });
    dots.forEach((d, j) => d.classList.toggle('on', j === cur));
  };

  // Init — show first slide immediately, hide rest
  slides.forEach((s, j) => {
    s.style.position = 'absolute';
    s.style.inset = '0';
    s.style.opacity = j === 0 ? '1' : '0';
    s.style.zIndex  = j === 0 ? '1' : '0';
  });

  const startTimer = () => {
    if (auto && !paused) timer = setInterval(() => show(cur + 1), auto);
  };
  const stopTimer = () => clearInterval(timer);

  const nav = (delta) => { stopTimer(); show(cur + delta); startTimer(); };

  el.querySelector('.prev').onclick = () => nav(-1);
  el.querySelector('.next').onclick = () => nav(1);
  dots.forEach((d, i) => d.onclick = () => { stopTimer(); show(i); startTimer(); });

  // Touch swipe
  let tx = 0;
  el.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) nav(dx < 0 ? 1 : -1);
  });

  // Collect images for lightbox
  const imgs = slides.map(s => ({
    src:     s.querySelector('img').src,
    caption: s.querySelector('figcaption')?.textContent || ''
  }));

  // Click image → open lightbox
  slides.forEach((s, i) => {
    s.querySelector('img').addEventListener('click', () => {
      paused = true;
      stopTimer();
      _lbPauseCarousel = () => {};
      _openCarouselLightbox(imgs, i, () => {
        paused = false;
        startTimer();
      });
    });
  });

  startTimer();
}

function _initCountdown(el, targetDate) {
  const target = new Date(targetDate);
  const tick = () => {
    const diff = target - Date.now();
    if (diff <= 0) {
      el.innerHTML = `<div style="font-size:2rem;color:var(--primary);font-family:var(--fh);font-style:italic">Today is the Day! ♥</div>`;
      return;
    }
    const set = (id,v) => { const e=el.querySelector(id); if(e) e.textContent=String(Math.floor(v)).padStart(2,'0'); };
    set('#cd-d', diff/86400000);
    set('#cd-h', (diff%86400000)/3600000);
    set('#cd-m', (diff%3600000)/60000);
    set('#cd-s', (diff%60000)/1000);
  };
  tick(); setInterval(tick,1000);
}

// ── RSVP Form submit ─────────────────────────────────────
async function submitRSVP(e, form) {
  e.preventDefault();
  const btn = form.querySelector('button');
  btn.textContent='Sending…'; btn.disabled=true;
  const data = Object.fromEntries(new FormData(form));
  try {
    await db.collection('weddings').doc(form.dataset.wid).collection('rsvps').add({
      ...data, submittedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    form.style.display = 'none';
    form.nextElementSibling.style.display = 'block';
  } catch(err) {
    alert('Sorry, something went wrong. Please try again.');
    btn.textContent='Send RSVP'; btn.disabled=false;
  }
}

// ── Lightbox ─────────────────────────────────────────────
let _lbOnClose = null;

function _openCarouselLightbox(images, startIndex, onClose) {
  _lbImages  = images;
  _lbIndex   = startIndex;
  _lbOnClose = onClose || null;
  _lbRender();
  document.getElementById('lightbox').classList.add('on');
  document.addEventListener('keydown', _lbKeyHandler);
}

function _openLightbox(src, caption) {
  // For non-carousel images (gallery etc.)
  _openCarouselLightbox([{ src, caption: caption||'' }], 0, null);
}

function _lbRender() {
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  const item = _lbImages[_lbIndex] || {};
  img.style.opacity = '0';
  img.src = item.src || '';
  img.onload = () => { img.style.opacity = '1'; };
  if (cap) cap.textContent = item.caption || '';
  // Show/hide arrows
  const showArrows = _lbImages.length > 1;
  ['lightbox-prev','lightbox-next'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.visibility = showArrows ? '' : 'hidden';
  });
}

function lightboxNav(delta) {
  _lbIndex = (_lbIndex + delta + _lbImages.length) % _lbImages.length;
  _lbRender();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('on');
  document.removeEventListener('keydown', _lbKeyHandler);
  if (_lbOnClose) { _lbOnClose(); _lbOnClose = null; }
}

function _lbKeyHandler(e) {
  if (e.key === 'ArrowRight') lightboxNav(1);
  else if (e.key === 'ArrowLeft') lightboxNav(-1);
  else if (e.key === 'Escape') closeLightbox();
}

document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (lb) lb.addEventListener('click', e => {
    if (e.target === lb || e.target.id === 'lightbox-img-wrap') closeLightbox();
  });
});

// ── Error state ──────────────────────────────────────────
function showError(msg) {
  document.getElementById('loading').classList.add('out');
  const es = document.getElementById('error-state');
  es.querySelector('p').innerHTML = msg;
  es.classList.add('show');
}