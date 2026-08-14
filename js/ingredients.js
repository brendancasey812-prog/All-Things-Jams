/* ingredients.js — aggregated shopping checklist across all batches */

function keyFor(item) {
  return `${item.name.toLowerCase()}|${item.unit.toLowerCase()}`;
}

function renderChecklist() {
  const list = document.getElementById('checklist');
  const emptyState = document.getElementById('emptyState');
  const items = Storage.aggregateIngredients();
  const checkedState = Storage.getChecklistState();

  if (!items.length) {
    list.hidden = true;
    emptyState.hidden = false;
    return;
  }
  list.hidden = false;
  emptyState.hidden = true;

  list.innerHTML = items.map((item) => {
    const key = keyFor(item);
    const checked = !!checkedState[key];
    const qtyLabel = item.hasQty
      ? `${Math.round(item.quantity * 100) / 100} ${item.unit}`.trim()
      : (item.unit || '—');
    return `
      <li class="${checked ? 'is-checked' : ''}" data-key="${key}">
        <input type="checkbox" ${checked ? 'checked' : ''} aria-label="Mark ${item.name} as gathered" />
        <span class="checklist__name">${item.name}</span>
        <span class="checklist__qty">${qtyLabel}</span>
      </li>
    `;
  }).join('');

  list.querySelectorAll('li').forEach((li) => {
    const checkbox = li.querySelector('input');
    checkbox.addEventListener('change', () => {
      Storage.setChecklistItem(li.dataset.key, checkbox.checked);
      li.classList.toggle('is-checked', checkbox.checked);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderChecklist();
  document.getElementById('refreshBtn').addEventListener('click', renderChecklist);
});
