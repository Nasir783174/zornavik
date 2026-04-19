/* ============================================================
   ZORNAVIK — Shared HTML partials (header + footer)

   ▶ CATEGORIES — how to add/edit nav links:
     Edit the NAV_CATEGORIES array below.
     Each item: { name: "Display Name", slug: "url-slug" }
     Example: { name: "Best", slug: "best" }
   ============================================================ */

const NAV_CATEGORIES = [
  { name: "Best",    slug: "best"    },
  // { name: "Reviews", slug: "reviews" },
  // { name: "Guides",  slug: "guides"  },
  // Add more categories here ↑
];

// ── Build nav links HTML from the array above ─────────────────
function buildCategoryLinks() {
  return NAV_CATEGORIES.map(c =>
    `<a href="/category/${c.slug}">${c.name}</a>`
  ).join('');
}

const HEADER_HTML = `
<header id="site-header">
  <div class="container">
    <div class="header-inner">
      <div class="site-logo">
        <a href="/">Zorna<span>vik</span></a>
      </div>
      <nav class="site-nav" aria-label="Main navigation">
        <a href="/" class="nav-home">Home</a>
        ${buildCategoryLinks()}
      </nav>
      <button class="hamburger" id="hamburger-btn" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
  <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
    <a href="/">Home</a>
    ${buildCategoryLinks()}
  </nav>
</header>`;

const FOOTER_HTML = `
<footer id="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <div class="brand-name">Zorna<span>vik</span></div>
        <p>Honest, no-nonsense vacuum cleaner reviews and buying guides. We cut through the marketing noise so you find the right vacuum for your home.</p>
        <div class="footer-socials">
          <a href="https://facebook.com/zornavik.me" aria-label="Facebook" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
          </a>
          <a href="https://instagram.com/zornavik.me" aria-label="Instagram" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          </a>
          <a href="https://twitter.com/zornavikme" aria-label="Twitter / X" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
        </div>
      </div>
      <div class="footer-links">
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/pages/about.html">About Me</a></li>
          <li><a href="/pages/contact.html">Contact Us</a></li>
          <li><a href="/pages/privacy.html">Privacy Policy</a></li>
          <li><a href="/pages/disclaimer.html">Disclaimer</a></li>
          <li><a href="/pages/terms.html">Terms &amp; Conditions</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; <span id="year"></span> Zornavik.me &mdash; All rights reserved. Built with &hearts; by Liam Adrian Foster</p>
    </div>
  </div>
</footer>`;

function injectLayout() {
  const headerEl = document.getElementById('header-placeholder');
  if (headerEl) headerEl.outerHTML = HEADER_HTML;

  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) footerEl.outerHTML = FOOTER_HTML;

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Highlight active nav link
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href === '/' && currentPath === '/') {
      a.classList.add('active');
    } else if (href !== '/' && (currentPath + currentSearch).startsWith(href)) {
      a.classList.add('active');
    }
  });
}

// Hamburger
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;
  btn.addEventListener('click', () => {
    const isOpen = btn.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    btn.setAttribute('aria-expanded', isOpen);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { injectLayout(); initHamburger(); });
} else {
  injectLayout();
  initHamburger();
}
