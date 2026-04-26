/**
 * ZORNAVIK — Main JS
 * Handles:
 *  - Sticky header shadow on scroll
 *  - Mobile menu toggle
 *  - Homepage blog grid rendering (from BLOG_REGISTRY)
 *  - Category filtering
 *  - Pagination (9 posts per page)
 */

(function () {
  const PER_PAGE = 9;

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
    // Elements are injected by components.js, so we wait for them
    const toggle = document.getElementById('mobileToggle');
    const nav    = document.getElementById('mobileNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on outside click
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
     CATEGORY LABEL MAP
  ══════════════════════════════════════════ */
  const CAT_LABELS = {
    'vacuum-for-floors': 'Vacuum for Floors',
    'cleaning-needs':    'Cleaning Needs',
    'by-home-type':      'By Home Type',
  };

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
  function cardHTML(post) {
    const catLabel = CAT_LABELS[post.category] || post.category;
    const imgHTML = post.image
      ? `<img src="${post.image}" alt="${post.title}" loading="lazy">`
      : `<div class="card-thumb-placeholder">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="2" y="2" width="20" height="20" rx="3"/>
             <path d="M2 15l6-6 4 4 3-3 7 7"/>
           </svg>
         </div>`;

    return `
      <article class="blog-card">
        <a href="${post.slug}" class="card-thumb">
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
            <a href="${post.slug}">${post.title}</a>
          </h2>
          <p class="card-excerpt">${post.excerpt}</p>
          <div class="card-footer">
            <a class="card-read-more" href="${post.slug}">Read more →</a>
            <span class="card-read-time">${post.readTime} min</span>
          </div>
        </div>
      </article>
    `;
  }

  /* ══════════════════════════════════════════
     PAGINATION HTML
  ══════════════════════════════════════════ */
  function paginationHTML(current, total, cat) {
    if (total <= 1) return '';
    const catParam = cat ? `&cat=${cat}` : '';
    let html = '';

    // Prev
    html += `<button class="page-btn nav-arrow" onclick="window.zornavik.goPage(${current - 1},'${cat}')" ${current === 1 ? 'disabled' : ''}>←</button>`;

    for (let i = 1; i <= total; i++) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="window.zornavik.goPage(${i},'${cat}')">${i}</button>`;
    }

    // Next
    html += `<button class="page-btn nav-arrow" onclick="window.zornavik.goPage(${current + 1},'${cat}')" ${current === total ? 'disabled' : ''}>→</button>`;

    return html;
  }

  /* ══════════════════════════════════════════
     RENDER GRID
  ══════════════════════════════════════════ */
  function renderGrid(cat, page) {
    const grid   = document.getElementById('blogGrid');
    const pager  = document.getElementById('pagination');
    const hero   = document.getElementById('heroSection');
    if (!grid) return;

    // Filter
    const posts = (typeof BLOG_REGISTRY !== 'undefined' ? BLOG_REGISTRY : [])
      .filter(p => !cat || p.category === cat)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update hero heading
    if (hero) {
      const catTitle = cat ? CAT_LABELS[cat] || cat : null;
      const h1 = hero.querySelector('h1');
      const badge = hero.querySelector('.hero-badge');
      if (catTitle) {
        if (h1)    h1.textContent = catTitle;
        if (badge) badge.textContent = 'Category';
      } else {
        if (h1)    h1.textContent = 'Honest Vacuum Reviews You Can Trust';
        if (badge) badge.textContent = 'Welcome';
      }
    }

    // Paginate
    const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
    const safePage   = Math.min(Math.max(1, page), totalPages);
    const slice      = posts.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    // Update cat tabs
    document.querySelectorAll('.cat-tab').forEach(t => {
      t.classList.toggle('active', (t.dataset.cat || '') === (cat || ''));
    });

    // Render
    if (slice.length === 0) {
      grid.innerHTML = `
        <div class="no-results" style="grid-column:1/-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>No posts found in this category yet. Check back soon!</p>
        </div>`;
    } else {
      grid.innerHTML = slice.map(cardHTML).join('');
    }

    if (pager) {
      pager.innerHTML = paginationHTML(safePage, totalPages, cat);
    }
  }

  /* ══════════════════════════════════════════
     HOMEPAGE INIT
  ══════════════════════════════════════════ */
  function initHomepage() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    const params = new URLSearchParams(window.location.search);
    const cat    = params.get('cat') || '';
    const page   = parseInt(params.get('page') || '1', 10);

    renderGrid(cat, page);

    // Cat tab clicks
    document.querySelectorAll('.cat-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.cat || '';
        const newParams = new URLSearchParams();
        if (c) newParams.set('cat', c);
        history.pushState({}, '', '?' + newParams.toString());
        renderGrid(c, 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  /* ══════════════════════════════════════════
     GLOBAL PAGE NAV (called from pagination buttons)
  ══════════════════════════════════════════ */
  window.zornavik = {
    goPage(page, cat) {
      const p = new URLSearchParams();
      if (cat) p.set('cat', cat);
      if (page > 1) p.set('page', String(page));
      history.pushState({}, '', '?' + p.toString());
      renderGrid(cat, page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ══════════════════════════════════════════
     BOOT — wait for components to inject DOM
  ══════════════════════════════════════════ */
  function boot() {
    // Small delay so components.js has injected header/footer
    setTimeout(() => {
      initStickyHeader();
      initMobileMenu();
      initHomepage();
    }, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
