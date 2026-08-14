/* home.js — hero + the Jam Kitchen batch sections for the home page */

const KITCHEN_BATCHES = [1, 2, 3];

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

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

function renderKitchenSections() {
  const container = document.getElementById('kitchenSections');
  if (!container) return;
  const captions = Storage.getGalleryCaptions();

  container.innerHTML = KITCHEN_BATCHES.map((batchNum, index) => {
    const reverse = index % 2 === 1;
    const captionKey = `batch-${batchNum}`;
    return `
      <div class="kitchen-section reveal ${reverse ? 'kitchen-section--reverse' : ''}" style="transition-delay: ${index * 120}ms">
        <div class="kitchen-section__media">
          <label class="dropzone dropzone--kitchen" for="batch-${batchNum}-main-input">
            <span class="dropzone__icon" aria-hidden="true">🫙</span>
            <span class="dropzone__label">Add a Batch ${batchNum} photo</span>
            <span class="dropzone__hint">Photo or PDF</span>
            <span class="dropzone__filename"></span>
            <input type="file" id="batch-${batchNum}-main-input" accept="image/*,.pdf" />
          </label>
          <label class="dropzone dropzone--kitchen-detail" for="batch-${batchNum}-detail-input">
            <span class="dropzone__icon" aria-hidden="true">🍓</span>
            <span class="dropzone__hint">detail shot</span>
            <input type="file" id="batch-${batchNum}-detail-input" accept="image/*,.pdf" />
          </label>
        </div>
        <div class="kitchen-section__text">
          <span class="kitchen-section__eyebrow">Batch 0${batchNum}</span>
          <textarea
            class="kitchen-section__caption"
            placeholder="Say something about this batch..."
            data-card-id="${captionKey}"
          >${escapeHTML(captions[captionKey] || '')}</textarea>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.dropzone').forEach(initDropzone);

  container.querySelectorAll('.kitchen-section__caption').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      Storage.saveGalleryCaption(textarea.dataset.cardId, textarea.value);
    });
  });

  initScrollReveal('.reveal');
}

document.addEventListener('DOMContentLoaded', () => {
  const heroDropzone = document.getElementById('heroDropzone');
  if (heroDropzone) initDropzone(heroDropzone);
  renderKitchenSections();
});
