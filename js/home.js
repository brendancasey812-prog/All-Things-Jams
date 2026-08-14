/* home.js — hero + scroll-reveal gallery for the home page */

const GALLERY_CARDS = [
  { id: 'card-1', hint: 'Photo or PDF' },
  { id: 'card-2', hint: 'Photo or PDF' },
  { id: 'card-3', hint: 'Photo or PDF' },
  { id: 'card-4', hint: 'Photo or PDF' },
  { id: 'card-5', hint: 'Photo or PDF' },
  { id: 'card-6', hint: 'Photo or PDF' },
];

function initDropzone(dropzoneEl) {
  const input = dropzoneEl.querySelector('input[type="file"]');
  const filenameEl = dropzoneEl.querySelector('.dropzone__filename');
  if (!input) return;
  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) {
      dropzoneEl.classList.add('has-file');
      if (filenameEl) filenameEl.textContent = `Selected: ${file.name}`;
    } else {
      dropzoneEl.classList.remove('has-file');
      if (filenameEl) filenameEl.textContent = '';
    }
  });
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  const captions = Storage.getGalleryCaptions();

  grid.innerHTML = GALLERY_CARDS.map((card, index) => `
    <div class="gallery-card reveal" style="transition-delay: ${index * 90}ms">
      <label class="dropzone dropzone--compact" for="${card.id}-input">
        <span class="dropzone__icon" aria-hidden="true">🍓</span>
        <span class="dropzone__label">Add a jam photo</span>
        <span class="dropzone__hint">${card.hint}</span>
        <span class="dropzone__filename"></span>
        <input type="file" id="${card.id}-input" accept="image/*,.pdf" />
      </label>
      <input
        type="text"
        class="gallery-card__caption"
        placeholder="Say something about this batch..."
        value="${(captions[card.id] || '').replace(/"/g, '&quot;')}"
        data-card-id="${card.id}"
      />
    </div>
  `).join('');

  grid.querySelectorAll('.dropzone').forEach(initDropzone);

  grid.querySelectorAll('.gallery-card__caption').forEach((input) => {
    input.addEventListener('input', () => {
      Storage.saveGalleryCaption(input.dataset.cardId, input.value);
    });
  });

  initScrollReveal('.reveal');
}

document.addEventListener('DOMContentLoaded', () => {
  const heroDropzone = document.getElementById('heroDropzone');
  if (heroDropzone) initDropzone(heroDropzone);
  renderGallery();
});
