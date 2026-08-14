/* scroll-reveal.js — fades/slides elements in as they enter the viewport */

function initScrollReveal(selector = '.reveal', options = {}) {
  const elements = document.querySelectorAll(selector);
  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px', ...options }
  );

  elements.forEach((el) => observer.observe(el));
}
