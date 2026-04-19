/* ============================================================
   ZORNAVIK — Main JavaScript
   Handles: blog index, pagination, category page,
            single blog post loading (HTML files),
            TOC generation from blog headings
   ============================================================ */

const PER_PAGE = 9;
let allPosts = [];

// ── Helpers ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Card HTML ────────────────────────────────────────────────
function cardHTML(post) {
  const thumb = post.thumbnail
    ? `<img class="card-thumb" src="${post.thumbnail}" alt="${post.title}" loading="lazy">`
    : `<div class="card-thumb-placeholder">🧹</div>`;
  const excerpt = post.excerpt ? `<p class="card-excerpt">${post.excerpt}</p>` : '';
  const date = post.date ? `<span class="card-date">${formatDate(post.date)}</span>` : '';
  return `
    <article class="blog-card">
      <a href="${post.url}">${thumb}</a>
      <div class="card-body">
        <span class="card-tag">${post.category || 'General'}</span>
        <h2 class="card-title"><a href="${post.url}">${post.title}</a></h2>
        ${excerpt}
        <div class="card-meta">
          ${date}
          <a class="card-read-link" href="${post.url}">Read more →</a>
        </div>
      </div>
    </article>`;
}

// ── Grid + Pagination ────────────────────────────────────────
function renderGrid(posts, page, container, paginationEl) {
  const start = (page - 1) * PER_PAGE;
  const slice = posts.slice(start, start + PER_PAGE);
  if (!slice.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🧹</div>
        <h3>No posts yet</h3>
        <p>There are no blog posts in this category yet. Check back soon!</p>
      </div>`;
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }
  container.innerHTML = slice.map(cardHTML).join('');
  if (paginationEl) renderPagination(posts.length, page, paginationEl, (p) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderGrid(posts, p, container, paginationEl);
  });
}

function renderPagination(total, current, el, onPage) {
  const pages = Math.ceil(total / PER_PAGE);
  if (pages <= 1) { el.innerHTML = ''; return; }
  let html = `<button class="page-btn" ${current === 1 ? 'disabled' : ''} data-p="${current - 1}">← Prev</button>`;
  for (let i = 1; i <= pages; i++) {
    html += `<button class="page-btn ${i === current ? 'active' : ''}" data-p="${i}">${i}</button>`;
  }
  html += `<button class="page-btn" ${current === pages ? 'disabled' : ''} data-p="${current + 1}">Next →</button>`;
  el.innerHTML = html;
  el.querySelectorAll('[data-p]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPage(parseInt(btn.dataset.p)));
  });
}

// ── Load posts.json ──────────────────────────────────────────
async function loadPosts() {
  try {
    const res = await fetch('/posts.json');
    const data = await res.json();
    return data
      .map(p => ({
        ...p,
        // url: use 'url' field if given, otherwise build from slug
        url: p.url || `/blogs/${p.slug}.html`
      }))
      .sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
      });
  } catch (e) {
    console.error('Could not load posts.json', e);
    return [];
  }
}

// ── TOC builder (reads headings from article) ────────────────
function buildTOC(container) {
  if (!container) return;
  const heads = container.querySelectorAll('h2, h3');
  const tocEl = document.getElementById('toc-list');
  if (!tocEl || !heads.length) {
    const tocWidget = document.getElementById('toc-widget');
    if (tocWidget) tocWidget.style.display = 'none';
    return;
  }
  // Ensure each heading has an id
  heads.forEach(h => {
    if (!h.id) {
      h.id = h.textContent.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    }
  });
  tocEl.innerHTML = Array.from(heads).map(h => {
    const indent = h.tagName === 'H3' ? 'padding-left:14px;font-size:.83rem;' : '';
    return `<li style="${indent}"><a href="#${h.id}">${h.textContent}</a></li>`;
  }).join('');
}

// ── HOME PAGE ────────────────────────────────────────────────
async function initHomePage() {
  allPosts = await loadPosts();
  const grid = document.getElementById('blog-grid');
  const pag  = document.getElementById('pagination');
  if (grid) renderGrid(allPosts, 1, grid, pag);
}

// ── CATEGORY PAGE ────────────────────────────────────────────
async function initCategoryPage() {
  allPosts = await loadPosts();
  // Support both /category/slug and /category?cat=slug
  const catSlug = (window.location.pathname.split('/category/')[1] || getUrlParam('cat') || '').toLowerCase().replace(/\/+$/, '');
  const filtered = allPosts.filter(p => (p.category_slug || '').toLowerCase() === catSlug);

  const catName = filtered.length
    ? filtered[0].category
    : catSlug.charAt(0).toUpperCase() + catSlug.slice(1);

  document.title = `${catName} — Zornavik`;
  setText('cat-title', catName);
  const desc = document.getElementById('cat-desc');
  if (desc) desc.textContent = filtered.length
    ? `Showing ${filtered.length} post${filtered.length !== 1 ? 's' : ''} in "${catName}"`
    : `No posts found in "${catName}" yet.`;

  const grid = document.getElementById('blog-grid');
  const pag  = document.getElementById('pagination');
  if (grid) renderGrid(filtered, 1, grid, pag);
}

// ── BLOG POST PAGE ───────────────────────────────────────────
// This page reads the blog content that is ALREADY in the HTML file
// via the #post-body element, then wires up the sidebar.
async function initBlogPage() {
  allPosts = await loadPosts();

  const body = document.getElementById('post-body');

  // Build TOC from whatever is in #post-body
  if (body) buildTOC(body);

  // Related posts — use data attributes set in the blog HTML
  const slug = document.body.dataset.slug;
  const catSlug = document.body.dataset.categorySlug;

  if (slug && catSlug) {
    const related = allPosts.filter(p =>
      p.category_slug === catSlug && p.slug !== slug
    ).slice(0, 5);

    const relEl = document.getElementById('related-posts');
    if (relEl) {
      relEl.innerHTML = related.length
        ? related.map(r => `<a class="related-link" href="${r.url}">${r.title}</a>`).join('')
        : '<p style="font-size:.85rem;color:var(--text-muted)">No related posts yet.</p>';
    }
  }
}

// ── Auto-init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'home')     initHomePage();
  else if (page === 'category') initCategoryPage();
  else if (page === 'blog')     initBlogPage();
  // static pages (about, contact, etc.) need nothing extra
});
