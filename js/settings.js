/* settings.js — appearance and saved-data controls */

function initThemeControls() {
  const current = Theme.get();
  document.querySelectorAll('[data-theme-option]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.themeOption === current);
    btn.setAttribute('aria-pressed', String(btn.dataset.themeOption === current));
    btn.addEventListener('click', () => {
      Theme.set(btn.dataset.themeOption);
      document.querySelectorAll('[data-theme-option]').forEach((b) => {
        const active = b.dataset.themeOption === btn.dataset.themeOption;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      updateThemeStatus();
    });
  });
  updateThemeStatus();
}

function updateThemeStatus() {
  const status = document.getElementById('themeStatus');
  if (!status) return;
  const choice = Theme.get();
  status.textContent = choice === 'system'
    ? `Following your device setting — currently ${Theme.resolved()}.`
    : `Always ${choice}.`;
}

function initDataControls() {
  const summary = document.getElementById('dataSummary');
  const clearBtn = document.getElementById('clearDataBtn');
  const status = document.getElementById('dataStatus');

  function refreshSummary() {
    const batches = Storage.getBatches();
    const ingredientCount = batches.reduce((total, b) => total + b.ingredients.length, 0);
    const captionCount = Object.values(Storage.getGalleryCaptions()).filter((c) => c.trim()).length;
    summary.textContent = `${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'} across ${batches.length} batches, ${captionCount} photo caption${captionCount === 1 ? '' : 's'}.`;
  }

  refreshSummary();

  clearBtn.addEventListener('click', () => {
    if (clearBtn.dataset.confirming !== 'true') {
      clearBtn.dataset.confirming = 'true';
      clearBtn.textContent = 'Tap again to confirm — this cannot be undone';
      status.textContent = '';
      return;
    }
    ['atj:v1:batches', 'atj:v1:galleryCaptions', 'atj:v1:checklistState'].forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        /* ignore */
      }
    });
    clearBtn.dataset.confirming = 'false';
    clearBtn.textContent = 'Clear all saved data';
    status.textContent = 'All recipes, captions, and checklist marks have been cleared.';
    refreshSummary();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeControls();
  initDataControls();
});
