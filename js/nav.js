/**
 * nav.js
 * Fixed bottom navigation bar with progress dots.
 * Reads page number from <meta name="page" content="N">
 */

(function() {
  'use strict';

  const TOTAL_PAGES = 10;
  const VISITED_KEY = 'pythonLoops_visited';

  function getPageNum() {
    const meta = document.querySelector('meta[name="page"]');
    return meta ? parseInt(meta.getAttribute('content'), 10) : 0;
  }

  function getVisited() {
    try {
      const v = sessionStorage.getItem(VISITED_KEY);
      return v ? JSON.parse(v) : [];
    } catch(e) { return []; }
  }

  function markVisited(n) {
    const v = getVisited();
    if (!v.includes(n)) {
      v.push(n);
      try { sessionStorage.setItem(VISITED_KEY, JSON.stringify(v)); } catch(e) {}
    }
  }

  function pageUrl(n) {
    if (n < 1) return 'index.html';
    if (n > TOTAL_PAGES) return 'index.html';
    return `page-${String(n).padStart(2, '0')}.html`;
  }

  function buildNav() {
    const current = getPageNum();
    if (current === 0) return; // index page — no nav

    markVisited(current);
    const visited = getVisited();

    const nav = document.createElement('nav');
    nav.id = 'bottom-nav';
    nav.setAttribute('aria-label', 'Page navigation');

    // Previous button
    const prevBtn = document.createElement('a');
    prevBtn.className = 'nav-btn' + (current <= 1 ? ' hidden' : '');
    prevBtn.href = pageUrl(current - 1);
    prevBtn.setAttribute('aria-label', 'Previous page');
    prevBtn.innerHTML = '&#8592; Previous';

    // Dots
    const dots = document.createElement('div');
    dots.className = 'nav-dots';
    dots.setAttribute('role', 'list');
    for (let i = 1; i <= TOTAL_PAGES; i++) {
      const dot = document.createElement('button');
      dot.className = 'nav-dot';
      dot.setAttribute('role', 'listitem');
      dot.setAttribute('aria-label', `Page ${i}`);
      dot.setAttribute('tabindex', '0');
      if (i === current) {
        dot.classList.add('current');
        dot.setAttribute('aria-current', 'page');
      } else if (visited.includes(i)) {
        dot.classList.add('visited');
      }
      dot.addEventListener('click', () => { window.location.href = pageUrl(i); });
      dot.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = pageUrl(i);
        }
      });
      dots.appendChild(dot);
    }

    // Next button
    const nextBtn = document.createElement('a');
    const isLast = current >= TOTAL_PAGES;
    nextBtn.className = 'nav-btn primary';
    nextBtn.href = isLast ? 'index.html' : pageUrl(current + 1);
    nextBtn.setAttribute('aria-label', isLast ? 'Finish' : 'Next page');
    if (current === 1) {
      nextBtn.textContent = 'Start →';
    } else if (isLast) {
      nextBtn.textContent = 'Finish ✓';
    } else {
      nextBtn.innerHTML = 'Next &#8594;';
    }

    nav.appendChild(prevBtn);
    nav.appendChild(dots);
    nav.appendChild(nextBtn);
    document.body.appendChild(nav);

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      // Don't navigate if user is typing in an input
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowLeft' && current > 1) {
        window.location.href = pageUrl(current - 1);
      }
      if (e.key === 'ArrowRight') {
        window.location.href = isLast ? 'index.html' : pageUrl(current + 1);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildNav);
  } else {
    buildNav();
  }

})();
