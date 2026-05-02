/**
 * ZORNAVIK — Shared Components
 * Injects the site header and footer into every page.
 * Uses a path-aware helper so links work from any folder depth.
 */

(function () {
  /* ── Detect base path (root vs /pages/ vs /posts/ vs /categories/) ── */
  const path = window.location.pathname;
  let base = './';
  if (path.includes('/pages/') || path.includes('/posts/') || path.includes('/categories/')) {
    base = '../';
  }

  /* ── Header HTML ── */
  function buildHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;

    // Highlight active nav link
    const currentPath = window.location.pathname;
    // Extract just the filename from currentPath for exact comparison
    const currentFile = currentPath.split('/').pop() || 'index.html';
    function isActive(href) {
      const hrefFile = href.split('/').pop();
      return currentFile === hrefFile ? 'active' : '';
    }

    el.innerHTML = `
      <div class="container">
        <div class="header-inner">

          <!-- Logo -->
          <a class="site-logo" href="${base}index.html" aria-label="Zornavik home">
            <div class="logo-mark">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18v2H3V6zm2 5h14v2H5v-2zm3 5h8v2H8v-2z"/>
              </svg>
            </div>
            <span class="logo-text">Zorna<span>vik</span></span>
          </a>

          <!-- Desktop Nav -->
          <nav class="site-nav" aria-label="Main navigation">
            <a class="nav-link ${isActive('robot-vacuums.html')}" href="${base}categories/robot-vacuums.html">Robot Vacuums</a>
            <a class="nav-link ${isActive('vacuums.html')}" href="${base}categories/vacuums.html">Vacuums</a>
            <a class="nav-link ${isActive('cordless-stick-vacuums.html')}" href="${base}categories/cordless-stick-vacuums.html">Cordless Stick Vacuums</a>
          </nav>

          <!-- Mobile Toggle -->
          <button class="menu-toggle" id="mobileToggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>

        </div>
      </div>

      <!-- Mobile Nav -->
      <nav class="mobile-nav" id="mobileNav" aria-label="Mobile navigation">
        <div class="mobile-nav-section">
          <a href="${base}categories/robot-vacuums.html">Robot Vacuums</a>
          <a href="${base}categories/vacuums.html">Vacuums</a>
          <a href="${base}categories/cordless-stick-vacuums.html">Cordless Stick Vacuums</a>
        </div>
        <div class="mobile-nav-section">
          <a href="${base}pages/about.html">About</a>
          <a href="${base}pages/contact.html">Contact</a>
        </div>
      </nav>
    `;
  }

  /* ── Footer HTML ── */
  function buildFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;

    const year = new Date().getFullYear();

    el.innerHTML = `
      <div class="container">
        <div class="footer-inner">

          <!-- Brand -->
          <div class="footer-brand">
            <div class="footer-logo">
              <div class="footer-logo-mark">
                <svg viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm2 5h14v2H5v-2zm3 5h8v2H8v-2z"/></svg>
              </div>
              <span class="footer-logo-text">Zornavik</span>
            </div>
            <p class="footer-desc">
              Honest, experience-based vacuum cleaner reviews and guides.
              Helping you choose the right vacuum without confusion or wasted money.
            </p>
            <div class="social-links">
              <a class="social-link" href="https://facebook.com/zornavik.me" target="_blank" rel="noopener" aria-label="Facebook">
                <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a class="social-link" href="https://instagram.com/zornavik.me" target="_blank" rel="noopener" aria-label="Instagram">
                <svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" fill="none" stroke="white" stroke-width="2"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>
              </a>
              <a class="social-link" href="https://twitter.com/zornavikme" target="_blank" rel="noopener" aria-label="Twitter / X">
                <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          <!-- Pages -->
          <div>
            <p class="footer-col-title">Pages</p>
            <ul class="footer-links">
              <li><a href="${base}pages/about.html">About Me</a></li>
              <li><a href="${base}pages/contact.html">Contact</a></li>
              <li><a href="${base}pages/privacy.html">Privacy Policy</a></li>
              <li><a href="${base}pages/disclaimer.html">Disclaimer</a></li>
              <li><a href="${base}pages/terms.html">Terms &amp; Conditions</a></li>
            </ul>
          </div>

          <!-- Categories -->
          <div>
            <p class="footer-col-title">Categories</p>
            <ul class="footer-links">
              <li><a href="${base}categories/robot-vacuums.html">Robot Vacuums</a></li>
              <li><a href="${base}categories/vacuums.html">Vacuums</a></li>
              <li><a href="${base}categories/cordless-stick-vacuums.html">Cordless Stick Vacuums</a></li>
            </ul>
          </div>

        </div>

        <div class="footer-bottom">
          <span>&copy; ${year} Zornavik.me &mdash; All rights reserved.</span>
          <span>
            <a href="${base}pages/privacy.html">Privacy</a> &middot;
            <a href="${base}pages/terms.html">Terms</a> &middot;
            <a href="${base}pages/disclaimer.html">Disclaimer</a>
          </span>
        </div>
      </div>
    `;
  }

  /* ── Breadcrumb ── */
  function buildBreadcrumb() {
    const el = document.getElementById('site-breadcrumb');
    if (!el) return;

    const cat      = document.body.dataset.category || '';
    const postTitle = document.body.dataset.postTitle || '';
    const postCat   = document.body.dataset.postCategory || '';

    const CATEGORY_LABELS = {
      'robot-vacuums':          'Robot Vacuums',
      'vacuums':                'Vacuums',
      'cordless-stick-vacuums': 'Cordless Stick Vacuums',
    };

    let crumbs = [];

    if (cat) {
      /* Category page */
      crumbs = [
        { label: 'Home', href: base + 'index.html' },
        { label: CATEGORY_LABELS[cat] || cat, href: '' },
      ];
    } else if (postTitle) {
      /* Blog post page */
      const catLabel = CATEGORY_LABELS[postCat] || postCat;
      const catHref  = postCat ? base + 'categories/' + postCat + '.html' : '';
      crumbs = [
        { label: 'Home', href: base + 'index.html' },
        ...(postCat ? [{ label: catLabel, href: catHref }] : []),
        { label: postTitle, href: '' },
      ];
    } else {
      /* Generic page (about, contact, etc.) */
      const pageLabel = document.title.split('—')[0].trim();
      crumbs = [
        { label: 'Home', href: base + 'index.html' },
        { label: pageLabel, href: '' },
      ];
    }

    /* Build HTML */
    const items = crumbs.map((c, i) => {
      const isLast = i === crumbs.length - 1;
      const text   = isLast
        ? `<span aria-current="page" class="bc-current">${c.label}</span>`
        : `<a href="${c.href}" class="bc-link">${c.label}</a>`;
      const sep    = isLast ? '' : `<span class="bc-sep" aria-hidden="true">›</span>`;
      return `<li>${text}${sep}</li>`;
    }).join('');

    el.innerHTML = `
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <ol>${items}</ol>
        </nav>
      </div>`;

    /* JSON-LD structured data for Google rich results */
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.label,
        ...(c.href ? { item: 'https://zornavik.me/' + c.href.replace(/^(\.\.\/|\.\/)/g, '') } : {}),
      })),
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }

  /* ── Init ── */
  function init() {
    buildHeader();
    buildFooter();
    buildBreadcrumb();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
