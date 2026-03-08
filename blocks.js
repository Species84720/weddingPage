// ═══════════════════════════════════════════════════
//  blocks.js  —  block defaults + canvas preview HTML
// ═══════════════════════════════════════════════════

let _blockUid = 0;
function nextUid() { return `b${++_blockUid}`; }

// ── Block type metadata ──────────────────────────────────
const BLOCK_META = {
  hero:      { label:'Hero',         icon:'🖼️', cat:'Layout',      desc:'Full-screen header' },
  divider:   { label:'Divider',      icon:'➖', cat:'Layout',      desc:'Section separator' },
  text:      { label:'Text',         icon:'📝', cat:'Content',     desc:'Heading & paragraph' },
  quote:     { label:'Quote',        icon:'💬', cat:'Content',     desc:'Styled quotation' },
  details:   { label:'Details',      icon:'📋', cat:'Content',     desc:'Info cards' },
  image:     { label:'Image',        icon:'🎨', cat:'Media',       desc:'Single photo' },
  carousel:  { label:'Carousel',     icon:'🎠', cat:'Media',       desc:'Image slideshow' },
  gallery:   { label:'Gallery',      icon:'🖼', cat:'Media',       desc:'Photo grid' },
  countdown: { label:'Countdown',    icon:'⏱️', cat:'Interactive', desc:'Days until the day' },
  rsvp:      { label:'RSVP',         icon:'📬', cat:'Interactive', desc:'Response form / link' },
};

// ── Detail card templates ────────────────────────────────
const DETAIL_TEMPLATES = [
  { icon:'📅', title:'Date',         content:'Saturday, 14th June 2025' },
  { icon:'⏰', title:'Time',         content:'3:00 PM' },
  { icon:'⛪', title:'Ceremony',     content:'St. Mary\'s Church\n123 Church Lane' },
  { icon:'🏛️', title:'Reception',   content:'The Grand Ballroom\n456 Rose Avenue' },
  { icon:'📍', title:'Venue',        content:'The Grand Ballroom\n456 Rose Avenue' },
  { icon:'👗', title:'Dress Code',   content:'Black Tie' },
  { icon:'🏨', title:'Accommodation',content:'Hampton Inn\nUse code WEDDING for 20% off' },
  { icon:'🅿️', title:'Parking',     content:'Free parking available\non site' },
  { icon:'✈️', title:'Travel',       content:'Nearest airport:\nHeathrow (30 min)' },
  { icon:'🎁', title:'Gift Registry',content:'We\'re registered at\nJohn Lewis & Selfridges' },
  { icon:'💳', title:'Wishing Well', content:'If you wish to gift money,\na card will be available' },
  { icon:'🐾', title:'Pets',         content:'Our venue is pet-friendly!\nDogs welcome' },
  { icon:'🍽️', title:'Catering',    content:'3-course dinner\nDietary options available' },
  { icon:'🎵', title:'Music',        content:'Live band from 7 PM\nDisco until midnight' },
];

// ── Create a block with defaults ─────────────────────────
function createBlock(type) {
  const base = { type, _id: nextUid(), blockBg: '', blockBgOverride: false };

  const defs = {
    hero: {
      title:'Sarah & James', subtitle:'Together Forever',
      date:'', venue:'', bgImage:'', overlayOpacity:0.45,
    },
    text: {
      heading:'Our Story',
      content:'Write your story here…\n\nAdd more paragraphs as needed.',
      align:'center', size:'medium',
    },
    image:     { src:'', caption:'', width:'full' },
    carousel:  { images:[], autoplay:true, interval:4000, height:520 },
    countdown: { targetDate:'', label:'Until the Big Day' },
    details:   {
      heading:'Wedding Details',
      listStyle: false,
      items:[
        { icon:'📅', title:'Date',     content:'Saturday, 14th June 2025' },
        { icon:'⛪', title:'Ceremony', content:'St. Mary\'s Church\n123 Church Lane' },
        { icon:'🏛️', title:'Reception',content:'The Grand Ballroom\n456 Rose Avenue' },
      ]
    },
    rsvp: {
      title:'RSVP',
      subtitle:'Please reply by 1st May 2025',
      mode:'form',   // 'form' | 'link'
      linkText:'RSVP Now',
      linkUrl:'',
    },
    gallery:   { images:[], columns:3 },
    divider:   { style:'floral', color:'#c9a96e' },
    quote:     { text:'To love and be loved is to feel the sun from both sides.', author:'David Viscott' },
  };

  return { ...base, ...(defs[type] || {}) };
}

// ── Canvas preview HTML ──────────────────────────────────
// All colours read from CSS variables so theme changes reflect live.
function getBlockPreviewHTML(b) {
  const trunc = (s, n) => (s||'').length > n ? s.slice(0,n)+'…' : (s||'');
  const bgStyle = b.blockBgOverride && b.blockBg
    ? `background:${b.blockBg};`
    : '';

  if (b.type === 'hero') {
    const opa = b.overlayOpacity ?? 0.45;
    return `<div class="prev-hero" style="${b.bgImage?`background-image:url('${driveUrl(b.bgImage)}');background-size:cover;background-position:center`:''}${bgStyle?';'+bgStyle:''}">
      <div class="prev-hero-ov" style="background:rgba(0,0,0,${opa})"></div>
      <div class="prev-hero-ct">
        <div class="prev-ornament">✦ ✦ ✦</div>
        <h1 class="prev-hero-h1">${trunc(b.title||'Couple Names',36)}</h1>
        ${b.subtitle?`<p class="prev-hero-sub">${trunc(b.subtitle,40)}</p>`:''}
        ${b.date?`<p class="prev-hero-date">${esc(b.date)}</p>`:''}
        ${b.venue?`<p class="prev-hero-venue">${trunc(b.venue,36)}</p>`:''}
      </div>
    </div>`;
  }

  if (b.type === 'text') {
    return `<div class="prev-text" style="text-align:${b.align||'left'};${bgStyle}">
      ${b.heading?`<h2 class="prev-text-h2">${trunc(b.heading,50)}</h2>`:''}
      <p class="prev-text-p">${trunc(b.content||'',220).replace(/\n/g,'<br>')}</p>
    </div>`;
  }

  if (b.type === 'image') {
    return `<div class="prev-image" style="${bgStyle}">
      ${b.src ? `<img src="${driveUrl(b.src)}" alt="" style="width:100%;max-height:200px;object-fit:cover;display:block">`
              : `<div class="prev-placeholder">🖼 Paste a Google Drive image URL</div>`}
      ${b.caption?`<p style="text-align:center;font-size:.75rem;color:#aaa;padding:6px;font-style:italic">${trunc(b.caption,60)}</p>`:''}
    </div>`;
  }

  if (b.type === 'carousel') {
    const imgs = b.images||[];
    return `<div class="prev-carousel" style="${bgStyle}">
      ${imgs.length
        ? imgs.slice(0,3).map(img=>`<img src="${driveUrl(imgSrc(img))}" alt="">`).join('')
        : `<span class="prev-car-ph">🎠 ${imgs.length} slides — add images in properties</span>`}
    </div>`;
  }

  if (b.type === 'countdown') {
    return `<div class="prev-countdown" style="${bgStyle?bgStyle:'background:var(--secondary);'}color:#fff;padding:24px;text-align:center">
      <div style="font-size:.68rem;letter-spacing:4px;text-transform:uppercase;opacity:.5;margin-bottom:14px">${trunc(b.label||'Until the Big Day',30)}</div>
      <div style="display:flex;justify-content:center;gap:20px">
        ${['DD','HH','MM','SS'].map((u,i)=>`<div><span style="font-family:var(--fh);font-size:1.6rem;color:var(--primary);display:block;line-height:1">${u}</span><span style="font-size:.6rem;letter-spacing:2px;opacity:.4;text-transform:uppercase">${['Days','Hours','Mins','Secs'][i]}</span></div>`).join('')}
      </div>
    </div>`;
  }

  if (b.type === 'details') {
    const items = (b.items||[]).slice(0,3);
    const isList = b.listStyle === true;
    const bg = b.blockBgOverride&&b.blockBg ? b.blockBg : (isList ? 'transparent' : 'var(--accent)');
    if (isList) {
      return `<div style="background:${bg};padding:16px 20px">
        ${b.heading?`<div style="font-family:var(--fh);font-size:.85rem;color:var(--secondary);margin-bottom:10px;text-align:center">${trunc(b.heading,40)}</div>`:''}
        ${items.map(it=>`<div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(0,0,0,.07)">
          <span style="font-size:1.2rem;flex:0 0 28px;text-align:center">${it.icon||'📅'}</span>
          <div>
            <div style="font-size:.72rem;font-weight:700;color:var(--secondary)">${trunc(it.title||'',20)}</div>
            <div style="font-size:.68rem;color:#888;margin-top:1px">${trunc(it.content||'',34)}</div>
          </div>
        </div>`).join('')}
        ${!items.length?'<div style="text-align:center;color:#ccc;font-size:.8rem;padding:10px">No cards yet</div>':''}
      </div>`;
    }
    return `<div style="background:${bg};padding:20px 16px">
      ${b.heading?`<div style="text-align:center;font-family:var(--fh);font-size:.95rem;color:var(--secondary);margin-bottom:12px;font-weight:400">${trunc(b.heading,40)}</div>`:''}
      <div style="display:flex;gap:8px">
        ${items.map(it=>`<div style="background:#fff;padding:12px 8px;flex:1;text-align:center;min-width:0">
          <div style="font-size:1.3rem;margin-bottom:4px">${it.icon||'📅'}</div>
          <div style="font-size:.7rem;font-weight:600;color:var(--secondary)">${trunc(it.title||'',16)}</div>
          <div style="font-size:.68rem;color:#888;margin-top:2px">${trunc(it.content||'',24)}</div>
        </div>`).join('')}
        ${!items.length?'<div style="flex:1;text-align:center;color:#ccc;font-size:.8rem;padding:16px">No cards yet</div>':''}
      </div>
    </div>`;
  }

  if (b.type === 'rsvp') {
    const isLink = b.mode === 'link';
    return `<div class="prev-rsvp" style="${bgStyle}">
      <h3 style="font-family:var(--fh);font-size:1.1rem;color:var(--secondary);font-weight:400;margin-bottom:12px;text-align:center">${trunc(b.title||'RSVP',24)}</h3>
      ${isLink
        ? `<div style="text-align:center;margin-top:8px">
             <div style="display:inline-block;padding:10px 24px;background:var(--secondary);color:#fff;font-size:.8rem;letter-spacing:2px">${trunc(b.linkText||'RSVP Now',30)}</div>
             <div style="font-size:.7rem;color:#bbb;margin-top:6px">${trunc(b.linkUrl||'(no URL set)',60)}</div>
           </div>`
        : `${['Full Name','Email Address','Attending'].map(p=>`<div style="height:26px;background:#f5f5f8;border:1px solid #eee;margin-bottom:5px;padding:0 10px;display:flex;align-items:center;font-size:.72rem;color:#bbb">${p}</div>`).join('')}`}
    </div>`;
  }

  if (b.type === 'gallery') {
    const imgs = b.images||[];
    const cols = Math.min(b.columns||3, 4);
    return `<div style="padding:14px;${bgStyle}">
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:3px">
        ${imgs.length
          ? imgs.slice(0,8).map(img=>`<div style="aspect-ratio:1;overflow:hidden;background:#e0e0e8"><img src="${driveUrl(imgSrc(img))}" alt="" style="width:100%;height:100%;object-fit:cover"></div>`).join('')
          : `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#ccc;font-size:.8rem">No images yet</div>`}
      </div>
    </div>`;
  }

  if (b.type === 'divider') {
    const s = b.style||'floral';
    const c = b.color||'var(--primary)';
    const center = s==='line' ? '' : s==='floral' ? `<span style="padding:0 14px;color:${c};opacity:.7">✿ ✾ ✿</span>` : s==='dots' ? `<span style="padding:0 14px;color:${c};opacity:.7;letter-spacing:6px">···</span>` : `<span style="padding:0 14px;color:${c};opacity:.7">〰</span>`;
    return `<div style="display:flex;align-items:center;padding:14px 32px;${bgStyle}">
      <div style="flex:1;height:1px;background:${c};opacity:.35"></div>${center}<div style="flex:1;height:1px;background:${c};opacity:.35"></div>
    </div>`;
  }

  if (b.type === 'quote') {
    return `<div style="padding:24px 40px;text-align:center;${bgStyle}">
      <p style="font-family:var(--fh);font-style:italic;font-size:.95rem;color:var(--secondary);line-height:1.6">"${trunc(b.text||'',140)}"</p>
      ${b.author?`<cite style="font-style:normal;font-size:.7rem;color:#aaa;margin-top:8px;display:block">— ${trunc(b.author,40)}</cite>`:''}
    </div>`;
  }

  return `<div style="padding:20px;color:#aaa;text-align:center;font-size:.8rem">Unknown block: ${b.type}</div>`;
}