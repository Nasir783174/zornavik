/**
 * ZORNAVIK — Main JS
 * Handles:
 *  - Sticky header shadow on scroll
 *  - Mobile menu toggle
 *  - Blog grid rendering (homepage + category pages) from BLOG_REGISTRY
 *  - Pagination (9 posts per page)
 */

(function () {
  const PER_PAGE = 9;

  /* ══════════════════════════════════════════
     CATEGORY CONFIG
  ══════════════════════════════════════════ */
  const CATEGORIES = {
    'robot-vacuums': {
      label:       'Robot Vacuums',
      heading:     'Robot Vacuum Reviews & Guides',
      description: 'Hands-on reviews of the best robot vacuums. We test suction, navigation, battery life, and app performance so you can buy with confidence.',
    },
    'vacuums': {
      label:       'Vacuums',
      heading:     'Vacuum Cleaner Reviews & Buying Guides',
      description: 'From uprights to canisters, we test every type of vacuum so you find the right one for your floors, budget, and lifestyle.',
    },
    'cordless-stick-vacuums': {
      label:       'Cordless Stick Vacuums',
      heading:     'Cordless Stick Vacuum Reviews',
      description: 'Lightweight, cable-free cleaning tested in real homes. Find the cordless stick vacuum that lasts long enough and picks up enough to replace your corded machine.',
    },
  };

  /* ══════════════════════════════════════════
     STICKY HEADER
  ══════════════════════════════════════════ */
  function initStickyHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ══════════════════════════════════════════
     MOBILE MENU
  ══════════════════════════════════════════ */
  function initMobileMenu() {
    const toggle = document.getElementById('mobileToggle');
    const nav    = document.getElementById('mobileNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove('open');
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ══════════════════════════════════════════
     FORMAT DATE
  ══════════════════════════════════════════ */
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ══════════════════════════════════════════
     BLOG CARD HTML
  ══════════════════════════════════════════ */
  function cardHTML(post, base) {
    const cat      = CATEGORIES[post.category];
    const catLabel = cat ? cat.label : post.category;
    const slug     = base ? base + post.slug : post.slug;

    const imgHTML = post.image
      ? `<img src="${base ? base : ''}${post.image}" alt="${post.title}" loading="lazy">`
      : `<div class="card-thumb-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="2" y="2" width="20" height="20" rx="3"/>
             <path d="M2 15l6-6 4 4 3-3 7 7"/>
           </svg>
         </div>`;

    return `
      <article class="blog-card">
        <a href="${slug}" class="card-thumb">
          ${imgHTML}
          <span class="card-cat">${catLabel}</span>
        </a>
        <div class="card-body">
          <div class="card-meta">
            <span>${fmtDate(post.date)}</span>
            <span class="card-meta-dot"></span>
            <span>${post.readTime} min read</span>
          </div>
          <h2 class="card-title">
            <a href="${slug}">${post.title}</a>
          </h2>
          <p class="card-excerpt">${post.excerpt}</p>
          <div class="card-footer">
            <a class="card-read-more" href="${slug}">Read more →</a>
            <span class="card-read-time">${post.readTime} min</span>
          </div>
        </div>
      </article>
    `;
  }

  /* ══════════════════════════════════════════
     PAGINATION HTML
  ══════════════════════════════════════════ */
  function paginationHTML(current, total) {
    if (total <= 1) return '';
    let html = '';
    html += `<button class="page-btn nav-arrow" onclick="window.zornavik.goPage(${current - 1})" ${current === 1 ? 'disabled' : ''}>←</button>`;
    for (let i = 1; i <= total; i++) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="window.zornavik.goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn nav-arrow" onclick="window.zornavik.goPage(${current + 1})" ${current === total ? 'disabled' : ''}>→</button>`;
    return html;
  }

  /* ══════════════════════════════════════════
     RENDER GRID
  ══════════════════════════════════════════ */
  function renderGrid(cat, page, base) {
    const grid  = document.getElementById('blogGrid');
    const pager = document.getElementById('pagination');
    if (!grid) return;

    const allPosts = (typeof BLOG_REGISTRY !== 'undefined' ? BLOG_REGISTRY : [])
      .filter(p => !cat || p.category === cat)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPages = Math.max(1, Math.ceil(allPosts.length / PER_PAGE));
    const safePage   = Math.min(Math.max(1, page), totalPages);
    const slice      = allPosts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    if (slice.length === 0) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>No posts found in this category yet. Check back soon!</p>
        </div>`;
    } else {
      grid.innerHTML = slice.map(p => cardHTML(p, base)).join('');
    }

    if (pager) {
      pager.innerHTML = paginationHTML(safePage, totalPages);
    }
  }

  /* ══════════════════════════════════════════
     DETECT PAGE TYPE & INIT
  ══════════════════════════════════════════ */
  function init() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    // Determine if this is a category page
    const pageCat  = document.body.dataset.category || '';   // set by category pages
    const pageBase = document.body.dataset.base || '';        // set by category pages (e.g. "../")

    const params = new URLSearchParams(window.location.search);
    const page   = parseInt(params.get('page') || '1', 10);

    // Update hero content for category pages
    if (pageCat) {
      const catData = CATEGORIES[pageCat];
      if (catData) {
        const h1    = document.getElementById('heroHeading');
        const desc  = document.getElementById('heroDesc');
        const badge = document.getElementById('heroBadge');
        if (h1)    h1.textContent   = catData.heading;
        if (desc)  desc.textContent = catData.description;
        if (badge) badge.textContent = catData.label;
      }
    }

    renderGrid(pageCat, page, pageBase);

    // Global pagination handler
    window.zornavik = {
      goPage(p) {
        const params = new URLSearchParams(window.location.search);
        if (p > 1) params.set('page', String(p));
        else       params.delete('page');
        history.pushState({}, '', params.toString() ? '?' + params.toString() : window.location.pathname);
        renderGrid(pageCat, p, pageBase);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
  }

  /* ── Boot ── */
  function boot() {
    setTimeout(() => {
      initStickyHeader();
      initMobileMenu();
      init();
    }, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
