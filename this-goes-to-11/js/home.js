/* home.js — hero, why/about photo slots, and the postcard wall */

/* Two wide frames on the first row, three on the second. */
const POSTCARDS = [
  { slot: 'postcard-1', label: 'The one that started it', icon: '🌊', size: 'wide' },
  { slot: 'postcard-2', label: 'Somewhere above the tree line', icon: '⛰️', size: 'wide' },
  { slot: 'postcard-3', label: 'Dinner, eventually', icon: '🍜', size: 'third' },
  { slot: 'postcard-4', label: 'The long way round', icon: '🚂', size: 'third' },
  { slot: 'postcard-5', label: 'Last light', icon: '🌅', size: 'third' },
];

function renderHeroSlots() {
  const hero = document.getElementById('heroSlot');
  if (hero) {
    hero.innerHTML = Photos.markup({
      slotId: 'home-hero',
      label: 'Drop the headline photo here',
      hint: 'JPG, PNG, WEBP, HEIC, GIF or PDF — or click to browse',
      icon: '🖼️',
      classes: 'dropzone--tall',
    });
  }

  const why = document.getElementById('whySlot');
  if (why) {
    why.innerHTML = Photos.markup({
      slotId: 'home-why',
      label: 'A photo that explains the why',
      icon: '🧭',
      classes: 'dropzone--wide',
    });
  }

  const about = document.getElementById('aboutSlot');
  if (about) {
    about.innerHTML = Photos.markup({
      slotId: 'home-about',
      label: 'Drop a photo of yourself here',
      icon: '👋',
      classes: 'dropzone--wide',
    });
  }
}

function renderPostcards() {
  const grid = document.getElementById('postcardGrid');
  if (!grid) return;
  const captions = Storage.getCaptions();

  grid.innerHTML = POSTCARDS.map((card, index) => `
    <figure class="postcard postcard--${card.size}" style="transition-delay: ${index * 80}ms">
      ${Photos.markup({
        slotId: card.slot,
        label: card.label,
        icon: card.icon,
        hint: 'Drop a photo in',
        classes: card.size === 'wide' ? 'dropzone--wide' : 'dropzone--square',
      })}
      <textarea
        class="postcard__caption"
        data-slot="${card.slot}"
        placeholder="Where was this?"
        aria-label="Caption for ${escapeHTML(card.label)}"
      >${escapeHTML(captions[card.slot] || '')}</textarea>
    </figure>
  `).join('');

  grid.querySelectorAll('.postcard__caption').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      Storage.saveCaption(textarea.dataset.slot, textarea.value);
    });
  });
}

function renderStats() {
  const trips = document.getElementById('statTrips');
  const recs = document.getElementById('statRecs');
  if (trips) trips.textContent = Storage.getTrips().length;
  if (recs) recs.textContent = Storage.getRecommendations().length;
}

function initAboutField() {
  const field = document.getElementById('aboutExtra');
  if (!field) return;
  const about = Storage.getAbout();
  field.value = about[field.dataset.aboutKey] || '';
  field.addEventListener('input', () => {
    Storage.saveAboutField(field.dataset.aboutKey, field.value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeroSlots();
  renderPostcards();
  renderStats();
  initAboutField();
  Photos.attachAll();
  initAutoGrow();
  initScrollReveal('.reveal');
});
