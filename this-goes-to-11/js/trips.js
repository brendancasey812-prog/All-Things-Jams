/* trips.js — alternating photo/text blocks, one per trip, all fields editable */

function tripMarkup(trip, index) {
  const reverse = index % 2 === 1;
  const number = String(index + 1).padStart(2, '0');
  const tags = (trip.tags || []).map((tag) => `<span class="chip">${escapeHTML(tag)}</span>`).join('');

  return `
    <article class="trip ${reverse ? 'trip--reverse' : ''} reveal" data-trip-id="${trip.id}">
      <div class="trip__media">
        ${Photos.markup({
          slotId: `${trip.id}-main`,
          label: 'Drop the main photo here',
          hint: 'JPG, PNG, WEBP, HEIC, GIF or PDF',
          icon: '🖼️',
          classes: 'dropzone--tall',
        })}
        ${Photos.markup({
          slotId: `${trip.id}-detail-a`,
          label: 'Detail shot',
          hint: 'Drop a photo in',
          icon: '📷',
          classes: 'dropzone--short',
        })}
        ${Photos.markup({
          slotId: `${trip.id}-detail-b`,
          label: 'One more',
          hint: 'Drop a photo in',
          icon: '📷',
          classes: 'dropzone--short',
        })}
      </div>

      <div class="trip__body">
        <div class="trip__meta">
          <span class="chip chip--sand">Trip ${number}</span>
          ${tags}
        </div>
        <input
          class="field-title"
          type="text"
          value="${escapeHTML(trip.title)}"
          data-field="title"
          placeholder="Where did you go?"
          aria-label="Trip title"
        />
        <input
          class="field-line muted"
          type="text"
          value="${escapeHTML(trip.when)}"
          data-field="when"
          placeholder="When was it?"
          aria-label="Trip dates"
        />
        <textarea
          class="field-notes"
          data-field="notes"
          placeholder="What made this one an eleven?"
          aria-label="Trip notes"
        >${escapeHTML(trip.notes)}</textarea>
        <button class="link-btn" type="button" data-action="remove">Remove this trip</button>
      </div>
    </article>
  `;
}

function renderTrips() {
  const list = document.getElementById('tripList');
  if (!list) return;
  const trips = Storage.getTrips();

  const count = document.getElementById('tripCount');
  if (count) count.textContent = trips.length;

  if (trips.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No trips yet. Add the first one and start dropping photos in.</p>
      </div>`;
    return;
  }

  list.innerHTML = trips.map(tripMarkup).join('');

  list.querySelectorAll('.trip').forEach((article) => {
    const id = article.dataset.tripId;

    article.querySelectorAll('[data-field]').forEach((field) => {
      field.addEventListener('input', () => {
        Storage.updateTrip(id, { [field.dataset.field]: field.value });
      });
    });

    const removeBtn = article.querySelector('[data-action="remove"]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        const trip = Storage.getTrips().find((t) => t.id === id);
        const name = (trip && trip.title) || 'this trip';
        if (!window.confirm(`Remove ${name}? The photos in its frames go too.`)) return;
        ['main', 'detail-a', 'detail-b'].forEach((suffix) => Storage.removePhoto(`${id}-${suffix}`));
        Storage.removeTrip(id);
        renderTrips();
      });
    }
  });

  Photos.attachAll(list);
  initAutoGrow(list);
  initScrollReveal('.reveal');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTrips();

  const addBtn = document.getElementById('addTripBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const trip = Storage.addTrip();
      renderTrips();
      const el = document.querySelector(`[data-trip-id="${trip.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const title = el.querySelector('.field-title');
        if (title) title.focus();
      }
    });
  }
});
