/* ============================================================
   ZORNAVIK.ME — Main JavaScript
   ============================================================ */

'use strict';

/* ─── Sticky Header Shadow ──────────────────────────────── */
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ─── Mobile Menu ───────────────────────────────────────── */
(function () {
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  // Close on nav link click
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
})();

/* ─── Active Nav Link ───────────────────────────────────── */
(function () {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dropdown-link, .mobile-nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || href.endsWith('/' + currentPath))) {
      link.classList.add('active');
    }
  });
})();

/* ─── Blog Pagination ───────────────────────────────────── */
(function () {
  const grid = document.getElementById('blog-grid');
  const paginationContainer = document.getElementById('pagination');
  if (!grid || !paginationContainer) return;

  const allCards = Array.from(grid.querySelectorAll('.post-card'));
  const POSTS_PER_PAGE = 9;
  const totalPages = Math.ceil(allCards.length / POSTS_PER_PAGE);
  let currentPage = 1;

  function showPage(page) {
    currentPage = page;
    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;

    allCards.forEach((card, i) => {
      card.style.display = (i >= start && i < end) ? '' : 'none';
      // Restart animation
      if (i >= start && i < end) {
        card.style.animation = 'none';
        void card.offsetWidth;
        card.style.animation = '';
        card.style.animationDelay = ((i - start) * 0.05) + 's';
      }
    });

    renderPagination();
    window.scrollTo({ top: grid.offsetTop - 120, behavior: 'smooth' });
  }

  function renderPagination() {
    if (totalPages <= 1) { paginationContainer.style.display = 'none'; return; }

    let html = '';

    // Prev button
    html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}" aria-label="Previous page">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
    </button>`;

    // Page numbers
    for (let p = 1; p <= totalPages; p++) {
      if (
        p === 1 || p === totalPages ||
        (p >= currentPage - 1 && p <= currentPage + 1)
      ) {
        html += `<button class="pagination__btn ${p === currentPage ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}">${p}</button>`;
      } else if (p === currentPage - 2 || p === currentPage + 2) {
        html += `<span class="pagination__ellipsis">…</span>`;
      }
    }

    // Next button
    html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}" aria-label="Next page">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
    </button>`;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.pagination__btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        if (page && page !== currentPage) showPage(page);
      });
    });
  }

  showPage(1);
})();
