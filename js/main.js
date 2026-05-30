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
  document.querySelectorAll('.main-nav a, .mobile-nav a').forEach(function (a) {
    const href = a.getAttribute('href');
    if (href && href !== '/' && path.startsWith(href)) {
      a.classList.add('active');
    } else if (href === '/' && (path === '/' || path === '/index.html')) {
      a.classList.add('active');
    }
  });
})();
