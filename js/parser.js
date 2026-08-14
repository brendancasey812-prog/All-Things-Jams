/* parser.js — rule-based paste-recipe parser
   Turns pasted recipe text into structured ingredient rows, converting
   recognized quantities into standard US units for common jam ingredients. */

const ML_PER_UNIT = {
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  floz: 29.5735,
  l: 1000,
  ml: 1,
};

const G_PER_UNIT = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

// token -> canonical unit + kind (weight | volume)
const UNIT_ALIASES = {
  g: ['g', 'gram', 'grams'],
  kg: ['kg', 'kilogram', 'kilograms'],
  oz: ['oz', 'ounce', 'ounces'],
  lb: ['lb', 'lbs', 'pound', 'pounds'],
  ml: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
  l: ['l', 'liter', 'liters', 'litre', 'litres'],
  tsp: ['tsp', 'teaspoon', 'teaspoons'],
  tbsp: ['tbsp', 'tablespoon', 'tablespoons'],
  cup: ['cup', 'cups'],
  floz: ['floz', 'fl oz', 'fluid ounce', 'fluid ounces'],
};

const WEIGHT_UNITS = new Set(['g', 'kg', 'oz', 'lb']);
const VOLUME_UNITS = new Set(['ml', 'l', 'tsp', 'tbsp', 'cup', 'floz']);

function buildUnitLookup() {
  const lookup = {};
  Object.entries(UNIT_ALIASES).forEach(([canonical, aliases]) => {
    aliases.forEach((alias) => {
      lookup[alias.toLowerCase()] = canonical;
    });
  });
  return lookup;
}
const UNIT_LOOKUP = buildUnitLookup();

// keyword -> { category, density (g/mL) }
// Densities are approximate, good enough for kitchen-scale conversions.
const INGREDIENT_TABLE = [
  { keyword: 'strawberr', category: 'fruit', density: 0.6 },
  { keyword: 'blueberr', category: 'fruit', density: 0.65 },
  { keyword: 'raspberr', category: 'fruit', density: 0.55 },
  { keyword: 'blackberr', category: 'fruit', density: 0.6 },
  { keyword: 'peach', category: 'fruit', density: 0.6 },
  { keyword: 'apple', category: 'fruit', density: 0.6 },
  { keyword: 'plum', category: 'fruit', density: 0.6 },
  { keyword: 'cherry', category: 'fruit', density: 0.6 },
  { keyword: 'cherries', category: 'fruit', density: 0.6 },
  { keyword: 'fig', category: 'fruit', density: 0.6 },
  { keyword: 'apricot', category: 'fruit', density: 0.6 },
  { keyword: 'sugar', category: 'sugar', density: 0.85 },
  { keyword: 'lemon juice', category: 'liquid', density: 1.03 },
  { keyword: 'lime juice', category: 'liquid', density: 1.03 },
  { keyword: 'water', category: 'liquid', density: 1.0 },
  { keyword: 'pectin', category: 'other', density: 0.7 },
  { keyword: 'salt', category: 'other', density: 1.2 },
  { keyword: 'cinnamon', category: 'other', density: 0.5 },
  { keyword: 'vanilla', category: 'other', density: 0.9 },
];

function findIngredientMeta(name) {
  const lower = name.toLowerCase();
  return INGREDIENT_TABLE.find((entry) => lower.includes(entry.keyword)) || null;
}

/** Parses a leading numeric quantity (supports "1", "1.5", "1/2", "1 1/2"). */
function parseLeadingQuantity(text) {
  const match = text.match(/^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.\d+|\d+)\s*/);
  if (!match) return { quantity: null, rest: text.trim() };

  const raw = match[1].trim();
  let value;
  if (raw.includes(' ')) {
    const [whole, frac] = raw.split(/\s+/);
    const [n, d] = frac.split('/').map(Number);
    value = Number(whole) + n / d;
  } else if (raw.includes('/')) {
    const [n, d] = raw.split('/').map(Number);
    value = n / d;
  } else {
    value = parseFloat(raw);
  }

  return { quantity: value, rest: text.slice(match[0].length).trim() };
}

/** Parses a leading unit token (e.g. "cups", "g", "tbsp") off the given text. */
function parseLeadingUnit(text) {
  const match = text.match(/^([a-zA-Z]+\.?)\s+/);
  if (!match) return { unit: null, rest: text };
  const token = match[1].toLowerCase().replace(/\.$/, '');
  const canonical = UNIT_LOOKUP[token];
  if (!canonical) return { unit: null, rest: text };
  let rest = text.slice(match[0].length).trim();
  rest = rest.replace(/^of\s+/i, '');
  return { unit: canonical, rest };
}

function toGrams(quantity, unit, density) {
  if (WEIGHT_UNITS.has(unit)) return quantity * G_PER_UNIT[unit];
  if (VOLUME_UNITS.has(unit)) return quantity * ML_PER_UNIT[unit] * density;
  return null;
}

/** Rounds a decimal quantity to the nearest 1/8 and formats as a mixed number string. */
function formatFriendly(value) {
  if (!Number.isFinite(value)) return '';
  const eighths = Math.round(value * 8);
  const whole = Math.floor(eighths / 8);
  const remainder = eighths % 8;
  if (remainder === 0) return String(whole || 0);
  const fractionMap = { 1: '1/8', 2: '1/4', 3: '3/8', 4: '1/2', 5: '5/8', 6: '3/4', 7: '7/8' };
  const fraction = fractionMap[remainder];
  return whole > 0 ? `${whole} ${fraction}` : fraction;
}

function convertForCategory(grams, category, density) {
  if (category === 'liquid') {
    const ml = grams / density;
    if (ml < 60) return { quantity: formatFriendly(ml / ML_PER_UNIT.tbsp), unit: 'tbsp' };
    return { quantity: formatFriendly(ml / ML_PER_UNIT.cup), unit: 'cup' };
  }
  if (category === 'other') {
    const ml = grams / density;
    return { quantity: formatFriendly(ml / ML_PER_UNIT.tbsp), unit: 'tbsp' };
  }
  // fruit / sugar
  const ml = grams / density;
  return { quantity: formatFriendly(ml / ML_PER_UNIT.cup), unit: 'cup' };
}

/**
 * Parses multi-line pasted recipe text into ingredient rows.
 * Returns [{ name, quantity, unit, note }]
 */
function parseRecipeText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line) => {
    const cleanedLine = line.replace(/^[-*•]\s*/, '');
    const { quantity, rest: afterQty } = parseLeadingQuantity(cleanedLine);

    if (quantity === null) {
      return { name: cleanedLine, quantity: '', unit: '', note: 'no quantity detected' };
    }

    const { unit, rest: name } = parseLeadingUnit(afterQty);
    const finalName = name || afterQty;

    if (!finalName) {
      return { name: cleanedLine, quantity: '', unit: '', note: 'could not identify ingredient' };
    }

    const meta = findIngredientMeta(finalName);

    if (!meta || !unit) {
      return {
        name: finalName,
        quantity: formatFriendly(quantity),
        unit: unit || '',
        note: meta ? 'unit not recognized, left as-is' : 'ingredient not in conversion table',
      };
    }

    const grams = toGrams(quantity, unit, meta.density);
    if (grams === null) {
      return { name: finalName, quantity: formatFriendly(quantity), unit, note: 'unit not convertible' };
    }

    const converted = convertForCategory(grams, meta.category, meta.density);
    return { name: finalName, quantity: converted.quantity, unit: converted.unit, note: '' };
  });
}
