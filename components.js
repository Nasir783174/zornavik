/* ============================================================
   components.js — Shared header, footer & nav logic
   Include this script on every page.
   ============================================================ */

(function () {
  /* ---- NAV TOGGLE (hamburger) ---- */
  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.querySelector('.nav-toggle');
    const nav    = document.querySelector('.site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
      });
      // Close on outside click
      document.addEventListener('click', function (e) {
        if (!toggle.contains(e.target) && !nav.contains(e.target)) {
          nav.classList.remove('open');
        }
      });
    }

    /* ---- ACTIVE NAV LINK ---- */
    const links = document.querySelectorAll('.site-nav a');
    const path  = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(function (a) {
      const href = a.getAttribute('href').split('/').pop();
      if (href === path) a.classList.add('active');
    });
  });
})();
