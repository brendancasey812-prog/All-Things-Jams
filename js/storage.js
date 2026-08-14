/* storage.js — shared localStorage data layer for All Things Jams */

const STORAGE_KEYS = {
  batches: 'atj:v1:batches',
  galleryCaptions: 'atj:v1:galleryCaptions',
  checklistState: 'atj:v1:checklistState',
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not read ${key} from localStorage`, err);
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Could not write ${key} to localStorage`, err);
  }
}

/** Parses "3", "1/2", "3 1/4", or "3.5" into a number. Returns NaN if unparseable. */
function parseMixedNumber(str) {
  if (str === null || str === undefined) return NaN;
  const s = String(str).trim();
  const match = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)/);
  if (!match) return NaN;
  const raw = match[1];
  if (raw.includes(' ')) {
    const [whole, frac] = raw.split(/\s+/);
    const [n, d] = frac.split('/').map(Number);
    return Number(whole) + n / d;
  }
  if (raw.includes('/')) {
    const [n, d] = raw.split('/').map(Number);
    return n / d;
  }
  return parseFloat(raw);
}

function defaultBatches() {
  return [1, 2, 3].map((n) => ({
    id: n,
    fruitsUsed: '',
    date: '',
    quantityProduced: '',
    quantityUnit: 'jars',
    ingredients: [],
    scans: [],
  }));
}

const Storage = {
  getBatches() {
    const batches = readJSON(STORAGE_KEYS.batches, null);
    if (!batches || !Array.isArray(batches) || batches.length === 0) {
      const seeded = defaultBatches();
      writeJSON(STORAGE_KEYS.batches, seeded);
      return seeded;
    }
    return batches;
  },

  saveBatches(batches) {
    writeJSON(STORAGE_KEYS.batches, batches);
  },

  getBatch(id) {
    return this.getBatches().find((b) => b.id === id) || null;
  },

  updateBatchHeader(id, fields) {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === id);
    if (!batch) return;
    Object.assign(batch, fields);
    this.saveBatches(batches);
  },

  addIngredients(batchId, ingredients) {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    batch.ingredients.push(...ingredients);
    this.saveBatches(batches);
  },

  removeIngredient(batchId, index) {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    batch.ingredients.splice(index, 1);
    this.saveBatches(batches);
  },

  addScanReference(batchId, filename) {
    const batches = this.getBatches();
    const batch = batches.find((b) => b.id === batchId);
    if (!batch) return;
    if (!batch.scans) batch.scans = [];
    batch.scans.push({ filename, addedAt: new Date().toISOString() });
    this.saveBatches(batches);
  },

  getGalleryCaptions() {
    return readJSON(STORAGE_KEYS.galleryCaptions, {});
  },

  saveGalleryCaption(cardId, text) {
    const captions = this.getGalleryCaptions();
    captions[cardId] = text;
    writeJSON(STORAGE_KEYS.galleryCaptions, captions);
  },

  getChecklistState() {
    return readJSON(STORAGE_KEYS.checklistState, {});
  },

  setChecklistItem(key, checked) {
    const state = this.getChecklistState();
    state[key] = checked;
    writeJSON(STORAGE_KEYS.checklistState, state);
  },

  aggregateIngredients() {
    const batches = this.getBatches();
    const totals = new Map();
    batches.forEach((batch) => {
      batch.ingredients.forEach((ing) => {
        const name = (ing.name || '').trim();
        if (!name) return;
        const unit = (ing.unit || '').trim();
        const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
        const qty = parseMixedNumber(ing.quantity);
        if (!totals.has(key)) {
          totals.set(key, { name, unit, quantity: 0, hasQty: false });
        }
        const entry = totals.get(key);
        if (!Number.isNaN(qty)) {
          entry.quantity += qty;
          entry.hasQty = true;
        }
      });
    });
    return Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name));
  },
};
