/* theme.js — applies the saved theme. Loaded in <head> on every page so the
   correct colors are set before first paint (no flash of the wrong theme). */

const THEME_KEY = 'atj:v1:theme';
const THEME_VALUES = ['system', 'light', 'dark'];

const Theme = {
  get() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return THEME_VALUES.includes(saved) ? saved : 'system';
    } catch (err) {
      return 'system';
    }
  },

  set(value) {
    if (!THEME_VALUES.includes(value)) return;
    try {
      localStorage.setItem(THEME_KEY, value);
    } catch (err) {
      /* storage unavailable — still apply for this page view */
    }
    this.apply(value);
  },

  /* 'system' removes the attribute so the prefers-color-scheme rule decides. */
  apply(value) {
    const theme = value || this.get();
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  },

  /* What the viewer actually sees right now, after resolving 'system'. */
  resolved() {
    const theme = this.get();
    if (theme !== 'system') return theme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  },
};

Theme.apply();
