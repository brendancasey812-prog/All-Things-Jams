/* recipe-book.js — batch cards, hamburger filter/add-recipe panel */

const UNIT_OPTIONS = ['cup', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l', 'jars', 'pinch', 'whole', 'other'];
const BATCH_QTY_UNITS = ['jars', 'lbs', 'pints'];

let pasteRows = [];
let manualRows = [{ name: '', quantity: '', unit: 'cup' }];

/* ---------------------------- batch rendering ---------------------------- */

function unitSelectHTML(selected) {
  return UNIT_OPTIONS.map((u) => `<option value="${u}" ${u === selected ? 'selected' : ''}>${u}</option>`).join('');
}

function ingredientsTableHTML(batch) {
  if (!batch.ingredients.length) {
    return '<p class="ingredients-empty">No ingredients logged yet — add some from the menu in the top right.</p>';
  }
  const rows = batch.ingredients.map((ing, index) => `
    <tr>
      <td>${escapeHTML(ing.name)}</td>
      <td>${escapeHTML(String(ing.quantity ?? ''))}</td>
      <td>${escapeHTML(ing.unit ?? '')}</td>
      <td><button class="btn btn--danger" data-remove-ingredient data-batch-id="${batch.id}" data-index="${index}">Remove</button></td>
    </tr>
  `).join('');
  return `
    <table class="ingredients-table">
      <thead><tr><th>Ingredient</th><th>Qty</th><th>Unit</th><th></th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function scansHTML(batch) {
  if (!batch.scans || !batch.scans.length) return '';
  const items = batch.scans.map((s) => `<li>📎 ${escapeHTML(s.filename)}</li>`).join('');
  return `<p class="help-text">Scanned recipes on file (text extraction coming soon):</p><ul style="margin:0 0 10px;padding-left:18px;">${items}</ul>`;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function batchCardHTML(batch) {
  return `
    <article class="batch-card" data-batch-id="${batch.id}"
      data-fruits="${escapeHTML(batch.fruitsUsed).toLowerCase()}"
      data-date="${escapeHTML(batch.date)}"
      data-quantity="${escapeHTML(String(batch.quantityProduced ?? ''))}">
      <div class="batch-card__header">
        <h2 class="batch-card__title">Batch <span class="badge">#${batch.id}</span></h2>
      </div>
      <div class="batch-card__fields">
        <div class="field">
          <label for="fruits-${batch.id}">Fruits used</label>
          <input type="text" id="fruits-${batch.id}" data-field="fruitsUsed" data-batch-id="${batch.id}" value="${escapeHTML(batch.fruitsUsed)}" placeholder="e.g. Strawberry, Rhubarb" />
        </div>
        <div class="field">
          <label for="date-${batch.id}">Date made</label>
          <input type="date" id="date-${batch.id}" data-field="date" data-batch-id="${batch.id}" value="${escapeHTML(batch.date)}" />
        </div>
        <div class="field">
          <label for="qty-${batch.id}">Quantity produced</label>
          <div class="quantity-field">
            <input type="number" min="0" id="qty-${batch.id}" data-field="quantityProduced" data-batch-id="${batch.id}" value="${escapeHTML(String(batch.quantityProduced ?? ''))}" placeholder="0" />
            <select data-field="quantityUnit" data-batch-id="${batch.id}">
              ${BATCH_QTY_UNITS.map((u) => `<option value="${u}" ${u === batch.quantityUnit ? 'selected' : ''}>${u}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
      ${scansHTML(batch)}
      ${ingredientsTableHTML(batch)}
    </article>
  `;
}

function renderBatches() {
  const container = document.getElementById('batches');
  const batches = Storage.getBatches();
  container.innerHTML = batches.map(batchCardHTML).join('');
  attachBatchListeners();
  populateBatchSelect(batches);
  applyFilters();
}

function attachBatchListeners() {
  document.querySelectorAll('#batches [data-field]').forEach((input) => {
    input.addEventListener('change', () => {
      const batchId = Number(input.dataset.batchId);
      const field = input.dataset.field;
      Storage.updateBatchHeader(batchId, { [field]: input.value });
      const card = input.closest('.batch-card');
      if (field === 'fruitsUsed') card.dataset.fruits = input.value.toLowerCase();
      if (field === 'date') card.dataset.date = input.value;
      if (field === 'quantityProduced') card.dataset.quantity = input.value;
      applyFilters();
    });
  });

  document.querySelectorAll('[data-remove-ingredient]').forEach((btn) => {
    btn.addEventListener('click', () => {
      Storage.removeIngredient(Number(btn.dataset.batchId), Number(btn.dataset.index));
      renderBatches();
    });
  });
}

/* ------------------------------ filtering -------------------------------- */

function applyFilters() {
  const batchNumber = document.getElementById('filterBatchNumber').value;
  const fruits = document.getElementById('filterFruits').value.trim().toLowerCase();
  const date = document.getElementById('filterDate').value;
  const quantity = document.getElementById('filterQuantity').value;

  document.querySelectorAll('.batch-card').forEach((card) => {
    let visible = true;
    if (batchNumber && card.dataset.batchId !== batchNumber) visible = false;
    if (fruits && !card.dataset.fruits.includes(fruits)) visible = false;
    if (date && card.dataset.date !== date) visible = false;
    if (quantity && card.dataset.quantity !== quantity) visible = false;
    card.hidden = !visible;
  });
}

function resetFilters() {
  document.getElementById('filterBatchNumber').value = '';
  document.getElementById('filterFruits').value = '';
  document.getElementById('filterDate').value = '';
  document.getElementById('filterQuantity').value = '';
  applyFilters();
}

/* --------------------------- hamburger side panel ------------------------- */

function initPanel() {
  const hamburger = document.getElementById('hamburgerBtn');
  const overlay = document.getElementById('panelOverlay');
  const panel = document.getElementById('sidePanel');
  const closeBtn = document.getElementById('panelCloseBtn');

  const open = () => {
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  hamburger.addEventListener('click', () => {
    panel.classList.contains('is-open') ? close() : open();
  });
  overlay.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  ['filterBatchNumber', 'filterFruits', 'filterDate', 'filterQuantity'].forEach((id) => {
    document.getElementById(id).addEventListener('input', applyFilters);
  });
  document.getElementById('filterResetBtn').addEventListener('click', resetFilters);
}

function populateBatchSelect(batches) {
  const select = document.getElementById('targetBatchSelect');
  if (!select) return;
  const current = select.value;
  select.innerHTML = batches.map((b) => `<option value="${b.id}">Batch ${b.id}</option>`).join('');
  if (current) select.value = current;
}

/* --------------------------------- tabs ----------------------------------- */

function initTabs() {
  const buttons = document.querySelectorAll('.tabs button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('is-active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      document.getElementById(btn.dataset.tab).classList.add('is-active');
    });
  });
}

/* ----------------------------- scan recipe tab ----------------------------- */

function initScanTab() {
  const dropzone = document.getElementById('scanDropzone');
  const input = dropzone.querySelector('input[type="file"]');
  const filenameEl = dropzone.querySelector('.dropzone__filename');
  const saveBtn = document.getElementById('scanSaveBtn');
  const status = document.getElementById('scanStatus');

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (file) {
      dropzone.classList.add('has-file');
      filenameEl.textContent = `Selected: ${file.name}`;
    }
  });

  saveBtn.addEventListener('click', () => {
    const file = input.files && input.files[0];
    const batchId = Number(document.getElementById('targetBatchSelect').value);
    if (!file) {
      status.textContent = 'Choose a file first.';
      return;
    }
    Storage.addScanReference(batchId, file.name);
    status.textContent = `Saved "${file.name}" to Batch ${batchId}. We'll extract ingredients from it automatically in a future update.`;
    input.value = '';
    dropzone.classList.remove('has-file');
    filenameEl.textContent = '';
    renderBatches();
  });
}

/* ------------------------- editable ingredient rows ------------------------ */

function renderEditableRows(containerEl, rows, options = {}) {
  containerEl.innerHTML = `
    <table class="parse-results-table">
      <thead><tr><th>Ingredient</th><th>Qty</th><th>Unit</th><th></th></tr></thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr data-row-index="${i}">
            <td><input type="text" data-row-field="name" value="${escapeHTML(row.name)}" placeholder="Ingredient" /></td>
            <td><input type="text" data-row-field="quantity" value="${escapeHTML(String(row.quantity ?? ''))}" placeholder="qty" style="width:64px;" /></td>
            <td>
              <select data-row-field="unit">${unitSelectHTML(row.unit)}</select>
            </td>
            <td><button class="btn btn--danger" data-remove-row="${i}">✕</button></td>
          </tr>
          ${row.note ? `<tr><td colspan="4" class="help-text" style="margin:0;padding:0 4px 6px;">${escapeHTML(row.note)}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>
  `;

  containerEl.querySelectorAll('[data-row-field]').forEach((field) => {
    field.addEventListener('input', () => {
      const tr = field.closest('tr');
      const idx = Number(tr.dataset.rowIndex);
      rows[idx][field.dataset.rowField] = field.value;
    });
  });

  containerEl.querySelectorAll('[data-remove-row]').forEach((btn) => {
    btn.addEventListener('click', () => {
      rows.splice(Number(btn.dataset.removeRow), 1);
      renderEditableRows(containerEl, rows, options);
    });
  });
}

/* ------------------------------- paste tab --------------------------------- */

function initPasteTab() {
  const textarea = document.getElementById('pasteTextarea');
  const parseBtn = document.getElementById('parseBtn');
  const resultsEl = document.getElementById('pasteResults');
  const addRowBtn = document.getElementById('pasteAddRowBtn');
  const saveBtn = document.getElementById('pasteSaveBtn');
  const status = document.getElementById('pasteStatus');

  parseBtn.addEventListener('click', () => {
    if (!textarea.value.trim()) return;
    pasteRows = parseRecipeText(textarea.value);
    renderEditableRows(resultsEl, pasteRows);
    document.getElementById('pasteResultsWrap').hidden = false;
  });

  addRowBtn.addEventListener('click', () => {
    pasteRows.push({ name: '', quantity: '', unit: 'cup' });
    renderEditableRows(resultsEl, pasteRows);
  });

  saveBtn.addEventListener('click', () => {
    const batchId = Number(document.getElementById('targetBatchSelect').value);
    const clean = pasteRows.filter((r) => r.name.trim());
    if (!clean.length) {
      status.textContent = 'Nothing to save yet.';
      return;
    }
    Storage.addIngredients(batchId, clean.map(({ name, quantity, unit }) => ({ name, quantity, unit })));
    status.textContent = `Saved ${clean.length} ingredient(s) to Batch ${batchId}.`;
    pasteRows = [];
    textarea.value = '';
    document.getElementById('pasteResultsWrap').hidden = true;
    renderBatches();
  });
}

/* ------------------------------- manual tab -------------------------------- */

function initManualTab() {
  const container = document.getElementById('manualRows');
  const addRowBtn = document.getElementById('manualAddRowBtn');
  const saveBtn = document.getElementById('manualSaveBtn');
  const status = document.getElementById('manualStatus');

  renderEditableRows(container, manualRows);

  addRowBtn.addEventListener('click', () => {
    manualRows.push({ name: '', quantity: '', unit: 'cup' });
    renderEditableRows(container, manualRows);
  });

  saveBtn.addEventListener('click', () => {
    const batchId = Number(document.getElementById('targetBatchSelect').value);
    const clean = manualRows.filter((r) => r.name.trim());
    if (!clean.length) {
      status.textContent = 'Add at least one ingredient name first.';
      return;
    }
    Storage.addIngredients(batchId, clean.map(({ name, quantity, unit }) => ({ name, quantity, unit })));
    status.textContent = `Saved ${clean.length} ingredient(s) to Batch ${batchId}.`;
    manualRows = [{ name: '', quantity: '', unit: 'cup' }];
    renderEditableRows(container, manualRows);
    renderBatches();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderBatches();
  initPanel();
  initTabs();
  initScanTab();
  initPasteTab();
  initManualTab();
});
