/* ============================================================
   ZORNAVIK.ME — Shared Components (Header & Footer)
   ============================================================ */

'use strict';

const ZornavikComponents = {

  /* ─── SVG Icons ─────────────────────────────────────────── */
  icons: {
    chevronDown: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
    arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
    facebook: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>`,
    instagram: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
    twitter: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
    quora: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12c1.536 0 2.997-.29 4.338-.813-.396-.783-.647-1.833-.647-3.099 0-.53.051-1.044.143-1.54.308 1.066 1.247 1.839 2.376 1.839 1.379 0 2.496-1.117 2.496-2.496 0-1.065-.67-1.977-1.621-2.333.485-.884.768-1.901.768-2.985C19.853 7.597 16.362 4 12 4 7.638 4 4.147 7.597 4.147 12.573c0 3.305 1.733 6.203 4.33 7.853-.028-.198-.043-.4-.043-.604 0-2.31 1.744-4.189 3.982-4.408C11.57 15.2 11.017 14.6 11.017 13.862c0-.786.647-1.424 1.444-1.424.799 0 1.444.638 1.444 1.424 0 .578-.341 1.078-.837 1.324.37-.195.793-.306 1.24-.306 1.529 0 2.771 1.242 2.771 2.771 0 .516-.143 1-.39 1.413C17.926 18.254 19.853 15.5 19.853 12.573 19.853 7.597 16.362 4 12 4z"/></svg>`,
    vacuum: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`,
    user: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
    email: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`,
    whatsapp: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>`,
  },

  /* ─── Logo SVG ──────────────────────────────────────────── */
  logoMark() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>`;
  },

  /* ─── Header ────────────────────────────────────────────── */
  header(rootPath = '') {
    return `
<a href="#main-content" class="skip-link">Skip to main content</a>
<header class="site-header" role="banner">
  <div class="container">
    <div class="header-inner">

      <!-- Logo -->
      <a href="${rootPath}index.html" class="site-logo" aria-label="Zornavik home">
        <div class="logo-mark">${this.logoMark()}</div>
        <span class="logo-text">Zorna<span>vik</span></span>
      </a>

      <!-- Primary Navigation -->
      <nav class="primary-nav" aria-label="Primary navigation">

        <div class="nav-item">
          <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false">
            Vacuums for Floors ${this.icons.chevronDown}
          </a>
          <div class="dropdown" role="menu">
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best for Hardwood Floors</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best for Carpet</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best for Tile Floors</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best for Mixed Flooring</a>
          </div>
        </div>

        <div class="nav-item">
          <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false">
            Cleaning Needs ${this.icons.chevronDown}
          </a>
          <div class="dropdown" role="menu">
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best for Pet Hair</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best Cordless Vacuums</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best Robot Vacuums</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best Handheld Vacuums</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">Best Upright Vacuums</a>
          </div>
        </div>

        <div class="nav-item">
          <a href="#" class="nav-link" aria-haspopup="true" aria-expanded="false">
            By Home Type ${this.icons.chevronDown}
          </a>
          <div class="dropdown" role="menu">
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">For Apartments</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">For Large Homes</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">For Pet Owners</a>
            <a href="${rootPath}index.html" class="dropdown-link" role="menuitem">For Allergy Sufferers</a>
          </div>
        </div>

        <div class="nav-item">
          <a href="${rootPath}index.html" class="nav-link">Blog</a>
        </div>

      </nav>

      <!-- Mobile Toggle -->
      <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>

    </div>
  </div>
</header>

<!-- Mobile Navigation -->
<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
  <div class="mobile-nav-group">
    <div class="mobile-nav-label">Vacuums for Floors</div>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best for Hardwood Floors</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best for Carpet</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best for Tile Floors</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best for Mixed Flooring</a>
  </div>
  <div class="mobile-nav-group">
    <div class="mobile-nav-label">Cleaning Needs</div>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best for Pet Hair</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best Cordless Vacuums</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best Robot Vacuums</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best Handheld Vacuums</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">Best Upright Vacuums</a>
  </div>
  <div class="mobile-nav-group">
    <div class="mobile-nav-label">By Home Type</div>
    <a href="${rootPath}index.html" class="mobile-nav-link">For Apartments</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">For Large Homes</a>
    <a href="${rootPath}index.html" class="mobile-nav-link">For Pet Owners</a>
  </div>
  <div class="mobile-nav-group">
    <div class="mobile-nav-label">Site Pages</div>
    <a href="${rootPath}index.html" class="mobile-nav-link">Blog</a>
    <a href="${rootPath}pages/about.html" class="mobile-nav-link">About Me</a>
    <a href="${rootPath}pages/contact.html" class="mobile-nav-link">Contact</a>
    <a href="${rootPath}pages/privacy.html" class="mobile-nav-link">Privacy Policy</a>
  </div>
</nav>
    `;
  },

  /* ─── Footer ────────────────────────────────────────────── */
  footer(rootPath = '') {
    return `
<footer class="site-footer" role="contentinfo">
  <div class="container">
    <div class="footer-grid">

      <!-- Brand & About -->
      <div class="footer-brand">
        <a href="${rootPath}index.html" class="site-logo" aria-label="Zornavik home">
          <div class="logo-mark">${this.logoMark()}</div>
          <span class="logo-text">Zorna<span>vik</span></span>
        </a>
        <p class="footer-about-text">
          Zornavik.me is your trusted source for honest, experience-backed vacuum cleaner reviews and buying guides. 12+ years of industry expertise distilled into simple, actionable advice — so you buy right the first time.
        </p>
        <div class="footer-social" aria-label="Social media links">
          <a href="https://facebook.com/zornavik.me" class="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">${this.icons.facebook}</a>
          <a href="https://instagram.com/zornavik.me" class="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">${this.icons.instagram}</a>
          <a href="https://twitter.com/zornavikme" class="social-icon" aria-label="Twitter / X" target="_blank" rel="noopener noreferrer">${this.icons.twitter}</a>
          <a href="https://quora.com/profile/zornavik" class="social-icon" aria-label="Quora" target="_blank" rel="noopener noreferrer">${this.icons.quora}</a>
        </div>
      </div>

      <!-- Quick Links -->
      <div class="footer-col">
        <h5>Quick Links</h5>
        <ul class="footer-links">
          <li><a href="${rootPath}index.html" class="footer-link">Home</a></li>
          <li><a href="${rootPath}pages/about.html" class="footer-link">About Me</a></li>
          <li><a href="${rootPath}pages/contact.html" class="footer-link">Contact Me</a></li>
          <li><a href="${rootPath}pages/privacy.html" class="footer-link">Privacy Policy</a></li>
          <li><a href="${rootPath}pages/disclaimer.html" class="footer-link">Disclaimer</a></li>
          <li><a href="${rootPath}pages/terms.html" class="footer-link">Terms &amp; Conditions</a></li>
        </ul>
      </div>

      <!-- Top Reviews -->
      <div class="footer-col">
        <h5>Top Reviews</h5>
        <ul class="footer-links">
          <li><a href="${rootPath}index.html" class="footer-link">Best Cordless Vacuums 2026</a></li>
          <li><a href="${rootPath}index.html" class="footer-link">Best for Pet Hair 2026</a></li>
          <li><a href="${rootPath}index.html" class="footer-link">Best Robot Vacuums 2026</a></li>
          <li><a href="${rootPath}index.html" class="footer-link">Best Dyson Cordless</a></li>
          <li><a href="${rootPath}index.html" class="footer-link">Best for Hardwood Floors</a></li>
          <li><a href="${rootPath}index.html" class="footer-link">Best Upright Vacuums</a></li>
        </ul>
      </div>

    </div>

    <!-- Bottom Bar -->
    <div class="footer-bottom">
      <p class="footer-copyright">
        &copy; ${new Date().getFullYear()} Zornavik.me &mdash; All rights reserved. Some links are affiliate links.
      </p>
      <p class="footer-tagline">Honest reviews. Real homes. Better decisions.</p>
    </div>
  </div>
</footer>
    `;
  },

  /* ─── Post Card ─────────────────────────────────────────── */
  postCard({ title, excerpt, category, date, readTime, slug }) {
    return `
<article class="post-card" itemscope itemtype="https://schema.org/BlogPosting">
  <a href="${slug}" class="post-card__image" aria-label="${title} — read more">
    <div class="post-card__image-placeholder">
      ${this.icons.vacuum}
      <span>Image coming soon</span>
    </div>
    <!-- Uncomment when image is ready: -->
    <!-- <img src="../images/${slug.replace('.html','')}.jpg" alt="${title}" loading="lazy" itemprop="image"> -->
  </a>
  <div class="post-card__body">
    <div class="post-card__meta">
      <span class="post-card__category">${category}</span>
      <time class="post-card__date" datetime="${date}" itemprop="datePublished">${new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</time>
    </div>
    <h2 class="post-card__title" itemprop="headline">
      <a href="${slug}">${title}</a>
    </h2>
    <p class="post-card__excerpt" itemprop="description">${excerpt}</p>
    <div class="post-card__footer">
      <div class="post-card__author">
        <div class="post-card__avatar" aria-hidden="true">LA</div>
        <span class="post-card__author-name" itemprop="author">Liam A. Foster</span>
      </div>
      <span class="post-card__read-time">${readTime} min read</span>
    </div>
  </div>
</article>
    `;
  },

  /* ─── Inject Into Page ──────────────────────────────────── */
  init(rootPath = '') {
    // Header
    const headerEl = document.getElementById('site-header');
    if (headerEl) headerEl.innerHTML = this.header(rootPath);

    // Footer
    const footerEl = document.getElementById('site-footer');
    if (footerEl) footerEl.innerHTML = this.footer(rootPath);
  }

};
