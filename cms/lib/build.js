'use strict';
/*
 * Everything that changes files inside the website folder lives here:
 * publish / unpublish / delete a post, regenerate the list pages, sitemap, redirects.
 */
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const U = require('./util');
const S = require('./store');
const R = require('./registry-file');
const L = require('./layout');
const C = require('./content');
const I = require('./images');

class UserError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

/* ---------- one operation at a time ---------- */
let chain = Promise.resolve();
function withLock(fn) {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

/* ---------- small file helpers ---------- */
function writeIfChanged(file, text) {
  if (U.readText(file) === text) return false;
  U.writeText(file, text);
  return true;
}
function rm(file) { try { fs.unlinkSync(file); return true; } catch (e) { return false; } }
function rmdirIfEmpty(dir) { try { if (!fs.readdirSync(dir).length) fs.rmdirSync(dir); } catch (e) { /* ignore */ } }
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------------------------------------------ */
/* Sitemap                                                             */
/* ------------------------------------------------------------------ */
function sitemapBlock(loc, o) {
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${o.lastmod}</lastmod>\n    <changefreq>${o.changefreq}</changefreq>\n    <priority>${o.priority}</priority>\n  </url>`;
}
function sitemapSet(xml, loc, o) {
  const re = new RegExp(`(<url>\\s*<loc>${reEsc(loc)}</loc>\\s*<lastmod>)[^<]*(</lastmod>)`);
  if (re.test(xml)) return xml.replace(re, (m, a, b) => a + o.lastmod + b);
  const block = sitemapBlock(loc, o) + '\n\n';
  const marker = '  <!-- Static pages -->';
  if (xml.includes(marker)) return xml.replace(marker, () => block + marker);
  return xml.replace('</urlset>', () => block + '</urlset>');
}
function sitemapRemove(xml, loc) {
  return xml.replace(new RegExp(`\\n*[ \\t]*<url>\\s*<loc>${reEsc(loc)}</loc>[\\s\\S]*?</url>`), '');
}

/* ------------------------------------------------------------------ */
/* vercel.json redirects (only used when a published post moves)       */
/* ------------------------------------------------------------------ */
function addRedirect(source, destination) {
  const txt = U.readText(P.VERCEL);
  if (txt == null || source === destination) return;
  let obj;
  try { obj = JSON.parse(txt); } catch (e) { return; }
  const list = obj.redirects || [];
  const chained = list.some((r) => r.destination === source || r.source === destination);
  if (!chained && !list.some((r) => r.source === source)) {
    const line = `    { "source": ${JSON.stringify(source)}, "destination": ${JSON.stringify(destination)}, "permanent": true }`;
    const m = /(\}\s*)\n(\s*)\]\s*\n\}\s*$/.exec(txt);
    if (m) {
      U.writeText(P.VERCEL, txt.replace(/(\})\s*\n(\s*)\]\s*\n\}\s*$/, (all, a, ws) => `${a},\n${line}\n${ws}]\n}\n`));
      return;
    }
  }
  obj.redirects = list.filter((r) => r.source !== destination && r.source !== source)
    .map((r) => (r.destination === source ? { ...r, destination } : r));
  obj.redirects.push({ source, destination, permanent: true });
  U.writeJson(P.VERCEL, obj);
}

/* ------------------------------------------------------------------ */
/* Registry helpers                                                    */
/* ------------------------------------------------------------------ */
function sortEntries(entries, order) {
  const dir = order === 'oldest' ? 1 : -1;
  return entries.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * dir);
}
function entryForPost(post, cat, readTime, settings, plainText) {
  const excerpt = post.excerpt || post.metaDescription || plainText.slice(0, 155);
  return {
    title: R.htmlSafe(post.title),
    slug: `/${post.category}/${post.slug}`,
    date: post.date,
    excerpt: R.htmlSafe(excerpt),
    readTime,
    category: post.category,
    catLabel: R.htmlSafe(cat.label),
    image: post.featuredImage || settings.defaultOgImage,
  };
}

/* ------------------------------------------------------------------ */
/* Listing pages (home, blog, categories)                              */
/* ------------------------------------------------------------------ */
function retarget(html, o) {
  const swap = (re, val) => { html = html.replace(re, (m, a, b) => a + val + b); };
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${U.esc(o.title)}</title>`);
  swap(/(<meta name="description" content=")[^"]*(")/, U.esc(o.desc));
  swap(/(<link rel="canonical" href=")[^"]*(")/, U.esc(o.url));
  swap(/(<meta property="og:title" content=")[^"]*(")/, U.esc(o.title));
  swap(/(<meta property="og:description" content=")[^"]*(")/, U.esc(o.desc));
  swap(/(<meta property="og:url" content=")[^"]*(")/, U.esc(o.url));
  if (o.jsonUrlFrom) html = html.replace(`"url": "${o.jsonUrlFrom}"`, () => `"url": "${o.url}"`);
  return html;
}
function setPerPage(html, n) { return html.replace(/const postsPerPage = \d+;/g, `const postsPerPage = ${n};`); }

function blogTabs(categories) {
  const tabs = [`      <button class="filter-tab active" data-filter="all">All Posts</button>`]
    .concat(categories.map((c) => `      <button class="filter-tab" data-filter="${c.slug}">${U.esc(c.label)}</button>`));
  return '\n' + tabs.join('\n') + '\n    ';
}

function rebuildListings({ syncNav = false } = {}) {
  const settings = S.getSettings();
  const categories = S.getCategories();
  const per = settings.postsPerPage;
  const today = U.todayISO();
  const entries = sortEntries(R.read(), settings.postOrder);
  R.write(entries);                                    // also applies the two small helper fixes
  let sitemap = U.readText(P.SITEMAP, '');
  const sm = (loc, freq, prio, force) => { sitemap = sitemapSet(sitemap, settings.siteUrl + loc, { lastmod: today, changefreq: freq, priority: prio }); };
  const smKeep = (loc, freq, prio) => { if (!sitemap.includes(`<loc>${settings.siteUrl}${loc}</loc>`)) sm(loc, freq, prio); };

  /* --- Home: index.html is a single hub page, curated by hand ---
   * The "Latest Reviews" cards on the homepage are NOT auto-generated
   * from the registry and there is no page-2 for the homepage - it's a
   * hub page, not an archive. Update the cards in index.html yourself
   * after publishing a new post. Full archive + pagination lives at /blog. */
  smKeep('/', 'weekly', '1.0');
  for (const f of fs.readdirSync(P.ROOT)) {
    const m = /^page-(\d+)\.html$/.exec(f);
    if (m) { rm(path.join(P.ROOT, f)); sitemap = sitemapRemove(sitemap, `${settings.siteUrl}/page-${m[1]}`); }
  }

  /* --- Blog: blog/index.html in place, blog/page-2.html … cloned --- */
  const blogFile = path.join(P.ROOT, 'blog', 'index.html');
  let blog = U.readText(blogFile);
  if (blog) {
    const total = Math.max(1, Math.ceil(entries.length / per));
    let b1 = setPerPage(blog, per);
    b1 = U.replaceDivInner(b1, /<div class="filter-tabs" id="blog-filter-tabs"[^>]*>/, blogTabs(categories)) || b1;
    b1 = U.replaceDivInner(b1, /<div class="blog-grid" id="blog-all-grid">/, '\n' + L.buildCards(entries.slice(0, per)) + '\n') || b1;
    b1 = U.replaceDivInner(b1, /<div id="blog-all-pagination">/, '\n' + L.buildPagination(1, total, '/blog') + '\n') || b1;
    if (writeIfChanged(blogFile, b1)) sm('/blog', 'weekly', '0.9');
    for (let k = 2; k <= total; k++) {
      let bk = retarget(b1, {
        title: `Vacuum Buying Guides & Reviews - Page ${k} | ${settings.siteName}`,
        desc: `More vacuum cleaner reviews and buying guides from ${settings.siteName}, page ${k} of our full blog archive.`,
        url: `${settings.siteUrl}/blog/page-${k}`,
        jsonUrlFrom: `${settings.siteUrl}/blog`,
      });
      bk = U.replaceDivInner(bk, /<div class="blog-grid" id="blog-all-grid">/, '\n' + L.buildCards(entries.slice((k - 1) * per, k * per)) + '\n') || bk;
      bk = U.replaceDivInner(bk, /<div id="blog-all-pagination">/, '\n' + L.buildPagination(k, total, '/blog') + '\n') || bk;
      if (writeIfChanged(path.join(P.ROOT, 'blog', `page-${k}.html`), bk)) sm(`/blog/page-${k}`, 'weekly', '0.5');
      else smKeep(`/blog/page-${k}`, 'weekly', '0.5');
    }
    for (const f of fs.readdirSync(path.join(P.ROOT, 'blog'))) {
      const m = /^page-(\d+)\.html$/.exec(f);
      if (m && Number(m[1]) > total) { rm(path.join(P.ROOT, 'blog', f)); sitemap = sitemapRemove(sitemap, `${settings.siteUrl}/blog/page-${m[1]}`); }
    }
  }

  /* --- Category pages --- */
  for (const cat of categories) {
    const list = entries.filter((e) => e.category === cat.slug);
    const total = Math.max(1, Math.ceil(list.length / per));
    for (let k = 1; k <= total; k++) {
      const html = L.renderCategoryPage({ cat, entries: list, page: k, totalPages: total, perPage: per, settings, categories });
      const file = k === 1 ? path.join(P.ROOT, 'category', `${cat.slug}.html`) : path.join(P.ROOT, 'category', cat.slug, `page-${k}.html`);
      const loc = k === 1 ? `/category/${cat.slug}` : `/category/${cat.slug}/page-${k}`;
      if (writeIfChanged(file, html)) sm(loc, 'weekly', k === 1 ? '0.8' : '0.5');
      else smKeep(loc, 'weekly', k === 1 ? '0.8' : '0.5');
    }
    const sub = path.join(P.ROOT, 'category', cat.slug);
    if (U.exists(sub)) {
      for (const f of fs.readdirSync(sub)) {
        const m = /^page-(\d+)\.html$/.exec(f);
        if (m && Number(m[1]) > total) { rm(path.join(sub, f)); sitemap = sitemapRemove(sitemap, `${settings.siteUrl}/category/${cat.slug}/page-${m[1]}`); }
      }
      rmdirIfEmpty(sub);
    }
  }

  writeIfChanged(P.SITEMAP, sitemap);
  if (syncNav) syncNavAll(categories);
}

/* Update the Categories menu in every page of the site (only needed when a category is added / renamed / deleted). */
function syncNavAll(categories) {
  let touched = 0;
  for (const f of U.walk(P.ROOT, (p) => p.endsWith('.html'))) {
    const html = U.readText(f, '');
    if (!html.includes('nav-dropdown-menu')) continue;
    const next = L.applyNav(html, categories);
    if (next !== html) { U.writeText(f, next); touched++; }
  }
  return touched;
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */
async function prepare(post, { inlineImages }) {
  const settings = S.getSettings();
  let html = post.content || '';
  if (inlineImages) html = await I.inlineDataImages(html, post.slug || 'post');
  const processed = await C.processContent(html, { siteUrl: settings.siteUrl });
  const readTime = post.readTimeOverride || Math.max(1, Math.ceil(processed.words / settings.wordsPerMinute));
  return { settings, processed, readTime, plain: processed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() };
}

function relatedFor(entries, post, settings) {
  const self = `/${post.category}/${post.slug}`;
  const others = sortEntries(entries.filter((e) => e.slug !== self), 'newest');
  const same = others.filter((e) => e.category === post.category);
  const rest = others.filter((e) => e.category !== post.category);
  return same.concat(rest).slice(0, 5);
}

function withFeaturedSize(post) {
  const out = { ...post };
  if (post.featuredImage && post.featuredImage.startsWith('/images/')) {
    const d = I.imageSize(path.join(P.ROOT, post.featuredImage));
    if (d) { out._featW = d.width; out._featH = d.height; }
  }
  return out;
}

function validate(post, categories) {
  const errors = [];
  if (!post.title) errors.push('Add a title.');
  if (!post.slug) errors.push('Add a slug (the last part of the URL).');
  else if (!U.SLUG_RE.test(post.slug)) errors.push('The slug can only contain lowercase letters, numbers and hyphens.');
  if (!post.category) errors.push('Choose a category.');
  else if (!categories.some((c) => c.slug === post.category)) errors.push('That category does not exist.');
  if (!String(post.content || '').replace(/<[^>]*>/g, '').trim() && !/<img|<table/i.test(post.content || '')) errors.push('The post is empty - write something first.');
  if (post.canonical && !/^https?:\/\//i.test(post.canonical)) errors.push('The canonical URL must start with https://');
  if (!errors.length) {
    const url = `/${post.category}/${post.slug}`;
    const file = path.join(P.ROOT, post.category, post.slug + '.html');
    const clash = S.listPosts().find((p) => p.id !== post.id && p.status === 'published' && p.publishedUrl === url);
    if (clash) errors.push(`Another post ("${clash.title}") already uses ${url}. Change the slug.`);
    else if (U.exists(file) && post.publishedUrl !== url) errors.push(`A page already exists at ${url}. Change the slug or category.`);
  }
  return errors;
}

async function publishPost(post) {
  return withLock(async () => {
    const categories = S.getCategories();
    const errors = validate(post, categories);
    if (errors.length) throw new UserError(errors.join(' '));
    const cat = categories.find((c) => c.slug === post.category);
    const today = U.todayISO();
    const wasPublished = !!post.publishedAt;
    if (!post.date) post.date = today;
    if (wasPublished && post.bumpUpdated && today > post.date) post.updated = today;

    const { settings, processed, readTime, plain } = await prepare(post, { inlineImages: true });
    const url = `/${post.category}/${post.slug}`;
    const entries = R.read();
    const html = L.renderPost({
      post: withFeaturedSize(post), processed, settings, category: cat, categories,
      related: relatedFor(entries, post, settings), readTime,
    });
    U.writeText(path.join(P.ROOT, post.category, post.slug + '.html'), html);

    /* moved to a new URL? remove the old file and add a 301 */
    const old = post.publishedUrl;
    let oldCategory = null;
    if (old && old !== url) {
      const oldParts = old.split('/').filter(Boolean);
      oldCategory = oldParts[0];
      if (oldParts.length === 2 && U.SLUG_RE.test(oldParts[0]) && U.SLUG_RE.test(oldParts[1])) {
        rm(path.join(P.ROOT, oldParts[0], oldParts[1] + '.html'));
        rmdirIfEmpty(path.join(P.ROOT, oldParts[0]));
      }
      addRedirect(old, url);
      let sm = U.readText(P.SITEMAP, '');
      U.writeText(P.SITEMAP, sitemapRemove(sm, settings.siteUrl + old));
    }

    /* registry (the list the site's own JavaScript reads) */
    let next = entries.filter((e) => e.slug !== url && e.slug !== old);
    const entry = entryForPost(post, cat, readTime, settings, plain);
    if (settings.postOrder === 'oldest') next.push(entry); else next.unshift(entry);
    R.write(sortEntries(next, settings.postOrder));

    /* sitemap */
    let sm = U.readText(P.SITEMAP, '');
    sm = sitemapSet(sm, settings.siteUrl + url, { lastmod: today, changefreq: 'monthly', priority: '0.9' });
    U.writeText(P.SITEMAP, sm);

    post.status = 'published';
    post.publishedUrl = url;
    if (!post.publishedAt) post.publishedAt = new Date().toISOString();
    S.savePost(post);
    rebuildListings();
    return {
      post, url, readTime, words: processed.words, missingAlt: processed.missingAlt,
      moved: old && old !== url ? old : '', firstPublish: !wasPublished,
    };
  });
}

function removePublishedFiles(post, settings) {
  const url = post.publishedUrl;
  if (!url) return;
  const parts = url.split('/').filter(Boolean);
  if (parts.length === 2 && U.SLUG_RE.test(parts[0]) && U.SLUG_RE.test(parts[1])) {
    rm(path.join(P.ROOT, parts[0], parts[1] + '.html'));
    rmdirIfEmpty(path.join(P.ROOT, parts[0]));
  }
  R.write(R.read().filter((e) => e.slug !== url));
  U.writeText(P.SITEMAP, sitemapRemove(U.readText(P.SITEMAP, ''), settings.siteUrl + url));
}

async function unpublishPost(post) {
  return withLock(async () => {
    const settings = S.getSettings();
    removePublishedFiles(post, settings);
    post.status = 'draft';
    post.publishedUrl = '';
    post.publishedAt = '';
    S.savePost(post);
    rebuildListings();
    return post;
  });
}

async function deletePost(post) {
  return withLock(async () => {
    const settings = S.getSettings();
    if (post.status === 'published' && post.publishedUrl) { removePublishedFiles(post, settings); }
    S.trashPost(post.id);
    rebuildListings();
  });
}

async function previewPost(post) {
  const categories = S.getCategories();
  const cat = categories.find((c) => c.slug === post.category) || { slug: 'uncategorized', label: 'Uncategorized' };
  const p = { ...post, slug: post.slug || 'preview', title: post.title || 'Untitled post', date: post.date || U.todayISO() };
  const { settings, processed, readTime } = await prepare(p, { inlineImages: false });
  return L.renderPost({
    post: withFeaturedSize(p), processed, settings, category: cat, categories,
    related: relatedFor(R.read(), p, settings), readTime, preview: true,
  });
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
function categoryCounts() {
  const counts = {};
  for (const e of R.read()) counts[e.category] = (counts[e.category] || 0) + 1;
  return counts;
}

async function createCategory(input) {
  return withLock(async () => {
    const settings = S.getSettings();
    const cats = S.getCategories();
    const label = String(input.label || '').trim();
    if (!label) throw new UserError('Give the category a name.');
    const slug = String(input.slug || '').trim().toLowerCase() || U.slugify(label);
    if (!U.SLUG_RE.test(slug)) throw new UserError('The category slug can only contain lowercase letters, numbers and hyphens.');
    if (S.RESERVED_SLUGS.has(slug)) throw new UserError(`"${slug}" is reserved by the website. Pick another slug.`);
    if (cats.some((c) => c.slug === slug)) throw new UserError('A category with this slug already exists.');
    if (cats.some((c) => c.label.toLowerCase() === label.toLowerCase())) throw new UserError('A category with this name already exists.');
    if (U.exists(path.join(P.ROOT, slug)) || U.exists(path.join(P.ROOT, slug + '.html'))) {
      throw new UserError(`A file or folder called "${slug}" already exists in the website folder.`);
    }
    const cat = S.buildCategory({ ...input, label, slug }, settings);
    cats.push(cat);
    S.saveCategories(cats);
    rebuildListings({ syncNav: true });
    return cat;
  });
}

async function updateCategory(slug, input) {
  return withLock(async () => {
    const settings = S.getSettings();
    const cats = S.getCategories();
    const i = cats.findIndex((c) => c.slug === slug);
    if (i < 0) throw new UserError('Category not found.', 404);
    const label = String(input.label || '').trim();
    if (!label) throw new UserError('Give the category a name.');
    const updated = S.buildCategory({ ...input, label, slug }, settings, {});
    cats[i] = { ...cats[i], ...updated };
    S.saveCategories(cats);
    /* keep card labels in the registry in sync */
    const entries = R.read();
    let touched = false;
    for (const e of entries) if (e.category === slug && e.catLabel !== R.htmlSafe(label)) { e.catLabel = R.htmlSafe(label); touched = true; }
    if (touched) R.write(entries);
    rebuildListings({ syncNav: true });
    return cats[i];
  });
}

async function deleteCategory(slug) {
  return withLock(async () => {
    const cats = S.getCategories();
    if (!cats.some((c) => c.slug === slug)) throw new UserError('Category not found.', 404);
    if ((categoryCounts()[slug] || 0) > 0) throw new UserError('This category still has posts. Move or delete them first.');
    const settings = S.getSettings();
    S.saveCategories(cats.filter((c) => c.slug !== slug));
    rm(path.join(P.ROOT, 'category', slug + '.html'));
    const sub = path.join(P.ROOT, 'category', slug);
    if (U.exists(sub)) { for (const f of fs.readdirSync(sub)) rm(path.join(sub, f)); rmdirIfEmpty(sub); }
    let sm = U.readText(P.SITEMAP, '');
    sm = sitemapRemove(sm, `${settings.siteUrl}/category/${slug}`);
    U.writeText(P.SITEMAP, sm);
    rebuildListings({ syncNav: true });
  });
}

async function rebuildAll() {
  return withLock(async () => { rebuildListings({ syncNav: true }); });
}

module.exports = {
  UserError, withLock, publishPost, unpublishPost, deletePost, previewPost, validate,
  createCategory, updateCategory, deleteCategory, categoryCounts, rebuildAll, rebuildListings,
};
