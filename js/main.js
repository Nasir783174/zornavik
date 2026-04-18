/* ============================================================
   ZORNAVIK — Main JavaScript
   Handles: blog index loading, pagination, category routing,
            markdown parsing, TOC, header nav
   ============================================================ */

// ── Tiny markdown parser (no external deps) ──────────────────
const Marked = {
  parse(md) {
    if (!md) return '';
    let html = md;

    // Fenced code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/gm, (_, lang, code) =>
      `<pre><code class="lang-${lang}">${escHtml(code.trim())}</code></pre>`);

    // Tables
    html = html.replace(/(\|.+\|\n)((?:\|[-:| ]+\|\n))((?:\|.+\|\n?)+)/gm, (match) => {
      const rows = match.trim().split('\n').filter(r => r.trim());
      const head = rows[0].split('|').filter(c => c.trim());
      const body = rows.slice(2);
      const th = head.map(c => `<th>${c.trim()}</th>`).join('');
      const trs = body.map(r => {
        const cells = r.split('|').filter(c => c !== undefined && !(c === '' && r.indexOf(c) === 0 && r.lastIndexOf(c) === r.length - 1));
        const filtered = cells.filter((_, i) => i !== 0 && i !== cells.length - 1 || cells.length === 1);
        const tds = r.split('|').slice(1, -1).map(c => `<td>${c.trim()}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('');
      return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
    });

    // Headings
    html = html.replace(/^#{6}\s+(.+)$/gm, (_, t) => `<h6 id="${slug(t)}">${t}</h6>`);
    html = html.replace(/^#{5}\s+(.+)$/gm, (_, t) => `<h5 id="${slug(t)}">${t}</h5>`);
    html = html.replace(/^#{4}\s+(.+)$/gm, (_, t) => `<h4 id="${slug(t)}">${t}</h4>`);
    html = html.replace(/^#{3}\s+(.+)$/gm, (_, t) => `<h3 id="${slug(t)}">${t}</h3>`);
    html = html.replace(/^#{2}\s+(.+)$/gm, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`);
    html = html.replace(/^#{1}\s+(.+)$/gm, (_, t) => `<h1 id="${slug(t)}">${t}</h1>`);

    // Blockquote
    html = html.replace(/^>\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

    // HR
    html = html.replace(/^[-*_]{3,}$/gm, '<hr>');

    // Unordered list
    html = html.replace(/((?:^[ \t]*[-*+] .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^[ \t]*[-*+] /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    // Ordered list
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, match => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Images before links
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Bold + italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Paragraphs (lines not already in block tags)
    html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<(h[1-6]|ul|ol|blockquote|hr|table|pre|img)[^>]*>)/g, '$1');

    return html;
  }
};

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function slug(t) {
  return t.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
}

// ── State ────────────────────────────────────────────────────
const PER_PAGE = 9;
let allPosts = [];

// ── Helpers ──────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function cardHTML(post) {
  const thumb = post.thumbnail
    ? `<img class="card-thumb" src="${post.thumbnail}" alt="${post.title}" loading="lazy">`
    : `<div class="card-thumb-placeholder">🧹</div>`;
  const excerpt = post.excerpt ? `<p class="card-excerpt">${post.excerpt}</p>` : '';
  const date = post.date ? `<span class="card-date">${formatDate(post.date)}</span>` : '';
  return `
    <article class="blog-card">
      <a href="/blog.html?slug=${post.slug}">${thumb}</a>
      <div class="card-body">
        <span class="card-tag">${post.category || 'General'}</span>
        <h2 class="card-title"><a href="/blog.html?slug=${post.slug}">${post.title}</a></h2>
        ${excerpt}
        <div class="card-meta">
          ${date}
          <a class="card-read-link" href="/blog.html?slug=${post.slug}">Read more →</a>
        </div>
      </div>
    </article>`;
}

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
  if (paginationEl) renderPagination(posts.length, page, paginationEl, (p) => renderGrid(posts, p, container, paginationEl));
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
  el.querySelectorAll('[data-p]').forEach(btn => {
    if (!btn.disabled) btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      onPage(parseInt(btn.dataset.p));
    });
  });
}

// ── Load posts.json ──────────────────────────────────────────
async function loadPosts() {
  try {
    const res = await fetch('/posts.json');
    const data = await res.json();
    // Sort by date descending (newest first)
    return data.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  } catch (e) {
    console.error('Could not load posts.json', e);
    return [];
  }
}

// ── Build header nav from posts.json categories ──────────────
function buildNav(posts) {
  const catMap = {};
  posts.forEach(p => {
    if (p.category && p.category_slug) {
      catMap[p.category_slug] = p.category;
    }
  });

  const navEls = document.querySelectorAll('.dynamic-nav');
  navEls.forEach(nav => {
    // Keep existing static links, append categories after
    const existingLinks = Array.from(nav.querySelectorAll('a.static-link'));
    let catHTML = '';
    Object.entries(catMap).forEach(([cSlug, cName]) => {
      catHTML += `<a href="/category.html?cat=${cSlug}">${cName}</a>`;
    });
    // Insert before last static link or append
    nav.insertAdjacentHTML('beforeend', catHTML);
  });

  // Mobile nav
  const mobileNavEls = document.querySelectorAll('.dynamic-mobile-nav');
  mobileNavEls.forEach(nav => {
    let catHTML = '';
    Object.entries(catMap).forEach(([cSlug, cName]) => {
      catHTML += `<a href="/category.html?cat=${cSlug}">${cName}</a>`;
    });
    nav.insertAdjacentHTML('beforeend', catHTML);
  });

  // Highlight active nav link
  const currentURL = window.location.pathname + window.location.search;
  document.querySelectorAll('.site-nav a, .mobile-nav a').forEach(a => {
    if (a.getAttribute('href') === currentURL || a.getAttribute('href') === window.location.pathname) {
      a.classList.add('active');
    }
    const catParam = getUrlParam('cat');
    if (catParam && a.getAttribute('href') === `/category.html?cat=${catParam}`) {
      a.classList.add('active');
    }
  });
}

// ── Hamburger menu ───────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!btn || !mobileNav) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
}

// ── HOME PAGE ────────────────────────────────────────────────
async function initHomePage() {
  allPosts = await loadPosts();
  buildNav(allPosts);
  const grid = document.getElementById('blog-grid');
  const pag = document.getElementById('pagination');
  if (grid) renderGrid(allPosts, 1, grid, pag);
}

// ── CATEGORY PAGE ────────────────────────────────────────────
async function initCategoryPage() {
  allPosts = await loadPosts();
  buildNav(allPosts);
  const catSlug = getUrlParam('cat') || '';
  const filtered = allPosts.filter(p => (p.category_slug || '').toLowerCase() === catSlug.toLowerCase());

  // Set header text
  const h1 = document.getElementById('cat-title');
  const desc = document.getElementById('cat-desc');
  const catName = filtered.length ? filtered[0].category : catSlug.charAt(0).toUpperCase() + catSlug.slice(1);
  if (h1) h1.textContent = catName;
  if (desc) desc.textContent = filtered.length
    ? `Showing ${filtered.length} post${filtered.length !== 1 ? 's' : ''} in "${catName}"`
    : `No posts found in "${catName}" yet.`;

  // Update page title
  document.title = `${catName} — Zornavik`;

  const grid = document.getElementById('blog-grid');
  const pag = document.getElementById('pagination');
  if (grid) renderGrid(filtered, 1, grid, pag);
}

// ── BLOG POST PAGE ───────────────────────────────────────────
async function initBlogPage() {
  allPosts = await loadPosts();
  buildNav(allPosts);
  const postSlug = getUrlParam('slug');
  if (!postSlug) { window.location.href = '/'; return; }

  const post = allPosts.find(p => p.slug === postSlug);
  if (!post) {
    document.getElementById('post-body').innerHTML =
      '<div class="empty-state"><div class="empty-icon">😕</div><h3>Post not found</h3><p>This post does not exist.</p></div>';
    return;
  }

  // Set meta
  document.title = `${post.title} — Zornavik`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && post.excerpt) metaDesc.setAttribute('content', post.excerpt);

  // Header fields
  setText('post-title-el', post.title);
  setText('post-category-el', post.category || '');
  setText('post-date-el', formatDate(post.date));
  const catLink = document.getElementById('post-cat-link');
  if (catLink) catLink.href = `/category.html?cat=${post.category_slug}`;

  // Fetch markdown
  try {
    const res = await fetch(post.file);
    if (!res.ok) throw new Error('Not found');
    const md = await res.text();
    const html = Marked.parse(md);
    const body = document.getElementById('post-body');
    if (body) body.innerHTML = html;

    // Build TOC
    buildTOC(body);

    // Related posts (same category, excluding current)
    const related = allPosts.filter(p => p.category_slug === post.category_slug && p.slug !== post.slug).slice(0, 5);
    const relEl = document.getElementById('related-posts');
    if (relEl) {
      relEl.innerHTML = related.length
        ? related.map(r => `<a class="related-link" href="/blog.html?slug=${r.slug}">${r.title}</a>`).join('')
        : '<p style="font-size:.85rem;color:var(--text-muted)">No related posts yet.</p>';
    }
  } catch (e) {
    document.getElementById('post-body').innerHTML =
      '<p style="color:var(--accent)">Could not load this post. Please try again.</p>';
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function buildTOC(container) {
  if (!container) return;
  const heads = container.querySelectorAll('h2, h3');
  const tocEl = document.getElementById('toc-list');
  if (!tocEl || !heads.length) {
    const tocWidget = document.getElementById('toc-widget');
    if (tocWidget) tocWidget.style.display = 'none';
    return;
  }
  const items = Array.from(heads).map(h => {
    const indent = h.tagName === 'H3' ? 'padding-left:12px;' : '';
    return `<li style="${indent}"><a href="#${h.id}">${h.textContent}</a></li>`;
  }).join('');
  tocEl.innerHTML = items;
}

// ── Auto-init based on body data attribute ───────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  const page = document.body.dataset.page;
  if (page === 'home') initHomePage();
  else if (page === 'category') initCategoryPage();
  else if (page === 'blog') initBlogPage();
  else {
    // Still build nav on static pages
    loadPosts().then(posts => buildNav(posts));
  }
});
