'use strict';
/*
 * Makes the blog pages that were written by hand (before the Studio existed) editable.
 * Nothing on the website changes here: we only read the page and save a draft-style copy in
 * cms/data/posts. The page itself is rewritten only when you press "Update" in the editor,
 * and the original HTML is backed up to cms/data/backups the first time that happens.
 */
const path = require('path');
const cheerio = require('cheerio');
const P = require('./paths');
const U = require('./util');
const S = require('./store');
const R = require('./registry-file');
const L = require('./layout');

class ImportError extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

const URL_RE = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/;

function widget(kind, inner) {
  return `<div class="cms-widget" data-cms-widget="${kind}" contenteditable="false">${inner}</div>`;
}

/* the old pages built the Quick Picks box with inline styles - move it onto the classes the Studio knows */
function convertQuickPicks($, root) {
  root.find('div').each((_, el) => {
    const $el = $(el);
    const st = String($el.attr('style') || '').replace(/\s+/g, '').toLowerCase();
    if (!st.includes('background:#f8f8f8') || !$el.find('ul li a[href^="#"]').length) return;
    const title = $el.children('p').first().text().replace(/\s+/g, ' ').trim() || '▾ Quick Picks - Jump to Any Review';
    const items = $el.find('ul li').toArray().map((li) => {
      const $li = $(li);
      const a = $li.find('a').first();
      const em = $li.find('em').first();
      const anchor = (a.attr('href') || '').replace(/^#/, '');
      const text = a.text().replace(/\s+/g, ' ').trim();
      const note = em.text().replace(/\s+/g, ' ').trim();
      return `<li>&#8594; ${anchor ? `<a href="#${U.esc(anchor)}">${U.esc(text)}</a>` : U.esc(text)}${note ? ` - <em>${U.esc(note)}</em>` : ''}</li>`;
    });
    $el.replaceWith(widget('quick-picks',
      `<div class="quick-picks"><p class="quick-picks-title">${U.esc(title)}</p><ul class="quick-picks-list">${items.join('')}</ul></div>`));
  });
}

/* wrap every "Check Price" button so a double-click opens the button dialog */
function convertBuyButtons($, root) {
  root.find('a.buy-btn').each((_, el) => {
    const $a = $(el);
    if ($a.closest('[data-cms-widget]').length) return;
    const parent = $a.parent();
    const holder = parent.is('p') && parent.children().length === 1 && !parent.text().replace($a.text(), '').trim() ? parent : null;
    const html = `<p>${$.html($a)}</p>`;
    (holder || $a).replaceWith(widget('buy-btn', html));
  });
}

function schemaBlocks($) {
  const keep = [];
  let article = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    let data;
    try { data = JSON.parse($(el).contents().text()); } catch (e) { return; }
    const list = Array.isArray(data) ? data : [data];
    for (const d of list) {
      if (d && Array.isArray(d['@graph'])) {
        const rest = d['@graph'].filter((g) => {
          if (g['@type'] === 'Article') { article = g; return false; }
          return g['@type'] !== 'BreadcrumbList';
        });
        if (rest.length) keep.push({ '@context': d['@context'] || 'https://schema.org', '@graph': rest });
      } else if (d) {
        if (d['@type'] === 'Article') article = d;
        else if (d['@type'] !== 'BreadcrumbList') keep.push(d);
      }
    }
  });
  return { extraSchema: keep, article };
}

function importLegacy(url) {
  if (!URL_RE.test(String(url || ''))) throw new ImportError('That is not a page address the Studio can import.');
  const existing = S.listPosts().find((p) => p.publishedUrl === url);
  if (existing) return existing;                                   // already imported

  const entry = R.read().find((e) => e.slug === url);
  const file = path.join(P.ROOT, ...url.split('/').filter(Boolean)) + '.html';
  const html = U.readText(file);
  if (html == null) throw new ImportError('The page file was not found in the website folder.', 404);

  const settings = S.getSettings();
  const categories = S.getCategories();
  const [, category, slug] = URL_RE.exec(url);
  if (!categories.some((c) => c.slug === category)) throw new ImportError(`The category "${category}" does not exist in the Studio.`);

  const $ = cheerio.load(html);
  const art = $('article.article-content').first();
  if (!art.length) throw new ImportError('This page does not have an article body the Studio understands.');

  const title = $('h1.article-title').first().text().replace(/\s+/g, ' ').trim() || (entry ? S.decodeEntities(entry.title) : slug);
  const pageTitle = $('title').first().text().replace(/\s+/g, ' ').trim();
  const metaTitle = pageTitle && pageTitle !== `${title} | ${settings.siteName}` ? pageTitle : '';
  const metaDescription = ($('meta[name="description"]').attr('content') || '').replace(/\s+/g, ' ').trim();
  let canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
  if (canonical === settings.siteUrl + url) canonical = '';

  const feat = $('img.article-featured-img').first();
  const featuredImage = (feat.attr('src') || '').trim();
  const featuredAlt = (feat.attr('alt') || '').trim();

  const { extraSchema, article } = schemaBlocks($);
  const iso = (v) => (U.isISODate(String(v || '').slice(0, 10)) ? String(v).slice(0, 10) : '');
  const date = iso(article && article.datePublished) || iso(entry && entry.date) || U.todayISO();
  let updated = iso(article && article.dateModified);
  if (!updated || updated <= date) updated = '';

  /* body: take everything except the parts the Studio adds by itself */
  const body = art.clone();
  const showDisclosure = body.find('.ftc-disclosure').length > 0;
  const showAuthor = body.find('.author-card').length > 0;
  const showRelated = body.find('.related-posts').length > 0;
  body.find('.ftc-disclosure, .author-card, .related-posts').remove();
  convertQuickPicks($, body);
  convertBuyButtons($, body);
  const content = body.html().replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();

  const post = {
    ...S.coercePost({
      title, slug, category, content, metaTitle, metaDescription, canonical,
      excerpt: entry ? L.unesc(entry.excerpt) : '', featuredImage, featuredAlt, date, updated,
      bumpUpdated: true, showDisclosure, showAuthor, showRelated,
    }, null),
    status: 'published',
    publishedUrl: url,
    publishedAt: `${date}T00:00:00.000Z`,
    extraSchema,
    importedFrom: url,
    dirty: false,
  };
  return S.savePost(post);
}

function importAll() {
  const posts = S.listPosts();
  const owned = new Set(posts.filter((p) => p.publishedUrl).map((p) => p.publishedUrl));
  const done = [], failed = [];
  for (const e of R.read()) {
    if (owned.has(e.slug)) continue;
    try { done.push(importLegacy(e.slug).id); } catch (err) { failed.push({ url: e.slug, error: err.message }); }
  }
  return { imported: done.length, failed };
}

module.exports = { importLegacy, importAll, ImportError };
