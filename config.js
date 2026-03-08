// ═══════════════════════════════════════════════════════════
//  WEDDING CREATOR — config.js
//  Fill in your credentials. See README.md for setup steps.
// ═══════════════════════════════════════════════════════════

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCOx04t7all869qK1t3RqBvHe9WI_1mjlo",
    authDomain: "weddingpages-a38e6.firebaseapp.com",
    projectId: "weddingpages-a38e6",
    storageBucket: "weddingpages-a38e6.firebasestorage.app",
    messagingSenderId: "698178644387",
    appId: "1:698178644387:web:e2a7938af8cb8a65029216",
    measurementId: "G-078TG0HY6J"
};

const DEFAULT_THEME = {
  primary:    '#c9a96e',
  secondary:  '#2d4a3e',
  background: '#fffdf8',
  text:       '#2c2c2c',
  accent:     '#f0e6d3',
  fontHeading:'Playfair Display',
  fontBody:   'Lato',
};

const FONT_OPTIONS = [
  'Playfair Display','Cormorant Garamond','EB Garamond',
  'Libre Baskerville','Crimson Text','Josefin Sans',
  'Raleway','Montserrat','Lato','Nunito','Cinzel',
  'Great Vibes','Alex Brush','Sacramento',
];

const THEME_PRESETS = [
  { name:'Gold',   primary:'#c9a96e', secondary:'#2d4a3e', background:'#fffdf8', text:'#2c2c2c', accent:'#f0e6d3' },
  { name:'Blush',  primary:'#e8a0b0', secondary:'#5a3040', background:'#fff8f9', text:'#3a2a30', accent:'#fce0e8' },
  { name:'Garden', primary:'#8fba7a', secondary:'#2e5e3e', background:'#f5fbf2', text:'#2a2a2a', accent:'#d4e8c8' },
  { name:'Navy',   primary:'#c0a870', secondary:'#1a2a4a', background:'#f8f9fc', text:'#1a2030', accent:'#dde4f0' },
  { name:'Rust',   primary:'#d4846a', secondary:'#4a2820', background:'#fffaf8', text:'#3a2820', accent:'#f5ddd0' },
  { name:'Slate',  primary:'#8aabb8', secondary:'#2a3e4a', background:'#f5f8fc', text:'#2a3038', accent:'#d0e0e8' },
  { name:'Ivory',  primary:'#b8a070', secondary:'#3a3020', background:'#fdfbf5', text:'#2a2818', accent:'#ece8d8' },
  { name:'Lilac',  primary:'#a090c8', secondary:'#3a2858', background:'#f8f5fc', text:'#2a2038', accent:'#e8e0f8' },
];

// ── Google Drive URL helper ───────────────────────────────
// Always coerce to string first — image arrays sometimes contain objects
function driveUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const s = url.trim();
  if (!s) return '';
  if (s.includes('lh3.googleusercontent.com') || s.includes('uc?export=view')) return s;
  const match = s.match(/(?:\/file\/d\/|id=|open\?id=)([a-zA-Z0-9_-]{25,})/);
  if (match) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  return s;
}

// ── Safe image src extractor (handles string or {src,caption} objects) ──
function imgSrc(item) {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'object' && item.src) return item.src;
  return '';
}

// ── Escape HTML ───────────────────────────────────────────
function esc(s) {
  return String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}