/* =============================================
   zornavik.me — Main JS
   Hamburger menu only. No heavy logic.
   ============================================= */

(function () {
  "use strict";

  /* Hamburger */
  const btn = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');
  if (btn && mobileNav) {
    btn.addEventListener('click', function () {
      const open = mobileNav.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  }

  /* Mark active nav link */
  const path = window.location.pathname;
  document.querySelectorAll('.main-nav a, .mobile-nav a, .nav-dropdown-menu a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href && href !== '/' && path.startsWith(href)) {
      a.classList.add('active');
    } else if (href === '/' && (path === '/' || path === '/index.html')) {
      a.classList.add('active');
    }
  });
  /* If a category inside the dropdown is active, highlight the toggle too */
  document.querySelectorAll('.nav-dropdown').forEach(function (dd) {
    if (dd.querySelector('.nav-dropdown-menu a.active')) {
      const toggle = dd.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.classList.add('active');
    }
  });

  /* FAQ accordion */
  document.querySelectorAll('.faq-question').forEach(function (q) {
    q.addEventListener('click', function () {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });
})();
