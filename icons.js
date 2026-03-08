// ═══════════════════════════════════════════════════
//  icons.js  —  Wedding icon sets for Details cards
// ═══════════════════════════════════════════════════

const WEDDING_ICONS = {
  'Ceremony': [
    { emoji:'⛪', label:'Church' },
    { emoji:'🕌', label:'Mosque' },
    { emoji:'🛕', label:'Temple' },
    { emoji:'🕍', label:'Synagogue' },
    { emoji:'🏛️', label:'Hall' },
    { emoji:'💒', label:'Chapel' },
    { emoji:'🌿', label:'Garden' },
    { emoji:'🏖️', label:'Beach' },
    { emoji:'🏔️', label:'Mountain' },
    { emoji:'🌲', label:'Forest' },
  ],
  'Celebration': [
    { emoji:'💍', label:'Rings' },
    { emoji:'💐', label:'Bouquet' },
    { emoji:'🌹', label:'Rose' },
    { emoji:'🌸', label:'Blossom' },
    { emoji:'🎊', label:'Confetti' },
    { emoji:'🥂', label:'Champagne' },
    { emoji:'🍰', label:'Cake' },
    { emoji:'🎂', label:'Wedding Cake' },
    { emoji:'🎵', label:'Music' },
    { emoji:'🎶', label:'Band' },
    { emoji:'💃', label:'Dance' },
    { emoji:'🕺', label:'Dancing' },
  ],
  'Date & Time': [
    { emoji:'📅', label:'Date' },
    { emoji:'📆', label:'Calendar' },
    { emoji:'⏰', label:'Time' },
    { emoji:'🕐', label:'Clock' },
    { emoji:'🌅', label:'Morning' },
    { emoji:'🌇', label:'Evening' },
    { emoji:'🌙', label:'Night' },
    { emoji:'☀️', label:'Afternoon' },
  ],
  'Venue & Travel': [
    { emoji:'📍', label:'Location' },
    { emoji:'🗺️', label:'Map' },
    { emoji:'🏩', label:'Love Hotel' },
    { emoji:'🏨', label:'Hotel' },
    { emoji:'✈️', label:'Flight' },
    { emoji:'🚗', label:'Car' },
    { emoji:'🚌', label:'Bus' },
    { emoji:'🚂', label:'Train' },
    { emoji:'🅿️', label:'Parking' },
    { emoji:'🏠', label:'Accommodation' },
  ],
  'Dress & Style': [
    { emoji:'👗', label:'Dress' },
    { emoji:'🤵', label:'Suit' },
    { emoji:'👠', label:'Heels' },
    { emoji:'💄', label:'Makeup' },
    { emoji:'💎', label:'Diamond' },
    { emoji:'👑', label:'Crown' },
    { emoji:'🎩', label:'Top Hat' },
    { emoji:'🧣', label:'Formal' },
  ],
  'Gifts & RSVP': [
    { emoji:'🎁', label:'Gift' },
    { emoji:'🎀', label:'Present' },
    { emoji:'💌', label:'RSVP' },
    { emoji:'📬', label:'Invite' },
    { emoji:'✉️', label:'Letter' },
    { emoji:'🛍️', label:'Registry' },
    { emoji:'💳', label:'Wishing Well' },
  ],
  'Love & Hearts': [
    { emoji:'❤️', label:'Heart' },
    { emoji:'💕', label:'Hearts' },
    { emoji:'💞', label:'Revolving' },
    { emoji:'💖', label:'Sparkling' },
    { emoji:'💗', label:'Growing' },
    { emoji:'🩷', label:'Pink Heart' },
    { emoji:'🤍', label:'White Heart' },
    { emoji:'✨', label:'Sparkles' },
    { emoji:'⭐', label:'Star' },
    { emoji:'🌟', label:'Glowing Star' },
  ],
  'Food & Drink': [
    { emoji:'🍽️', label:'Dinner' },
    { emoji:'🥗', label:'Salad' },
    { emoji:'🍷', label:'Wine' },
    { emoji:'🍹', label:'Cocktail' },
    { emoji:'☕', label:'Coffee' },
    { emoji:'🧁', label:'Cupcake' },
    { emoji:'🍓', label:'Strawberry' },
    { emoji:'🫐', label:'Berries' },
  ],
  'People': [
    { emoji:'👰', label:'Bride' },
    { emoji:'🤵', label:'Groom' },
    { emoji:'👨‍👩‍👧‍👦', label:'Family' },
    { emoji:'👫', label:'Couple' },
    { emoji:'🧑‍🤝‍🧑', label:'Partners' },
    { emoji:'👼', label:'Cherub' },
    { emoji:'🧒', label:'Child' },
    { emoji:'🐾', label:'Pets' },
  ],
};

// Render icon picker UI HTML
function renderIconPicker(selectedEmoji, callbackFn) {
  const id = 'icon-picker-' + Date.now();
  let html = `<div class="icon-picker" id="${id}">`;
  for (const [cat, icons] of Object.entries(WEDDING_ICONS)) {
    html += `<div class="ip-category">${cat}</div><div class="ip-grid">`;
    html += icons.map(ic =>
      `<button type="button" class="ip-btn${ic.emoji===selectedEmoji?' selected':''}"
        title="${ic.label}" onclick="${callbackFn}('${ic.emoji}',this)">${ic.emoji}</button>`
    ).join('');
    html += `</div>`;
  }
  html += `</div>`;
  return html;
}