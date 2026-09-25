'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const U = require('./util');

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */
const DEFAULT_SETTINGS = {
  siteName: 'Zornavik',
  siteUrl: 'https://zornavik.me',
  twitterHandle: '@zornavik',
  twitterUrl: 'https://twitter.com/zornavik',
  defaultOgImage: '/images/vacuum.webp',
  postsPerPage: 9,
  postOrder: 'newest',            // 'newest' | 'oldest'
  wordsPerMinute: 200,
  disclosure:
    'Zornavik participates in the Amazon Services LLC Associates Program and other affiliate programs. ' +
    'If you click a link on this page and make a purchase, we may earn a small commission at no extra cost to you. ' +
    'This does not influence our recommendations - we only feature products we genuinely believe offer value.',
  author: {
    name: 'Liam Adrian Foster',
    role: 'Vacuum Expert & Reviewer',
    jobTitle: 'Vacuum Industry Expert',
    bio:
      'Vacuum industry expert with 12+ years in product testing, quality control, and customer feedback analysis. ' +
      'Honest, data-driven reviews to help you choose the right vacuum without confusion or wasted money.',
    avatar: '/images/liam-adrian-foster.webp',
    url: '/about',
  },
};

function getSettings() {
  const saved = U.readJson(P.SETTINGS_FILE, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    author: { ...DEFAULT_SETTINGS.author, ...(saved.author || {}) },
  };
}

function saveSettings(input) {
  const cur = getSettings();
  const s = (v, d = '') => (typeof v === 'string' ? v.trim() : d);
  const next = {
    ...cur,
    siteName: s(input.siteName, cur.siteName) || cur.siteName,
    siteUrl: s(input.siteUrl, cur.siteUrl).replace(/\/+$/, '') || cur.siteUrl,
    twitterHandle: s(input.twitterHandle, cur.twitterHandle),
    twitterUrl: s(input.twitterUrl, cur.twitterUrl),
    defaultOgImage: s(input.defaultOgImage, cur.defaultOgImage),
    disclosure: s(input.disclosure, cur.disclosure),
    postsPerPage: Math.min(30, Math.max(3, parseInt(input.postsPerPage, 10) || cur.postsPerPage)),
    postOrder: input.postOrder === 'oldest' ? 'oldest' : 'newest',
    author: {
      name: s(input.author && input.author.name, cur.author.name) || cur.author.name,
      role: s(input.author && input.author.role, cur.author.role),
      jobTitle: s(input.author && input.author.jobTitle, cur.author.jobTitle),
      bio: s(input.author && input.author.bio, cur.author.bio),
      avatar: s(input.author && input.author.avatar, cur.author.avatar),
      url: s(input.author && input.author.url, cur.author.url) || '/about',
    },
  };
  U.writeJson(P.SETTINGS_FILE, next);
  return next;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '-', ndash: '–', rsquo: '’', lsquo: '‘', hellip: '…' };
function decodeEntities(s) {
  return String(s || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return isNaN(n) ? m : String.fromCodePoint(n);
    }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e.toLowerCase()) ? ENTITIES[e.toLowerCase()] : m;
  });
}

/* Read the category pages that already exist on the website so the CMS starts with the same wording. */
function bootstrapCategories() {
  const dir = path.join(P.ROOT, 'category');
  const out = [];
  if (!U.exists(dir)) return out;
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.html')).sort()) {
    const slug = f.replace(/\.html$/, '');
    if (/^page-\d+$/.test(slug)) continue;
    const html = U.readText(path.join(dir, f), '');
    const pick = (re) => { const m = re.exec(html); return m ? decodeEntities(m[1]) : ''; };
    const label = pick(/<nav class="breadcrumb"[\s\S]*?<span>([^<]*)<\/span>\s*<\/nav>/) || slug;
    out.push({
      slug,
      label,
      h1: pick(/<div class="cat-header">[\s\S]*?<h1>([\s\S]*?)<\/h1>/) || `${label} Reviews`,
      intro: pick(/<div class="cat-header">[\s\S]*?<h1>[\s\S]*?<\/h1>\s*<p>([\s\S]*?)<\/p>/),
      sectionTitle: pick(/<div class="section-head"[^>]*>\s*<h2>([\s\S]*?)<\/h2>/) || `All ${label} Reviews`,
      metaTitle: pick(/<title>([\s\S]*?)<\/title>/),
      metaDescription: pick(/<meta name="description" content="([^"]*)"/),
      ogTitle: pick(/<meta property="og:title" content="([^"]*)"/),
      ogDescription: pick(/<meta property="og:description" content="([^"]*)"/),
      collectionDescription: pick(/"@type": "CollectionPage"[\s\S]*?"description": "([^"]*)"/),
    });
  }
  /* keep the same order the site menu already uses */
  const idx = U.readText(path.join(P.ROOT, 'index.html'), '');
  const menu = /<div class="nav-dropdown-menu">([\s\S]*?)<\/div>/.exec(idx);
  if (menu) {
    const order = [...menu[1].matchAll(/href="\/category\/([^"]+)"/g)].map((m) => m[1]);
    out.sort((a, b) => {
      const ia = order.indexOf(a.slug), ib = order.indexOf(b.slug);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }
  return out;
}

function getCategories() {
  let cats = U.readJson(P.CATEGORIES_FILE, null);
  if (!Array.isArray(cats)) {
    cats = bootstrapCategories();
    U.writeJson(P.CATEGORIES_FILE, cats);
  }
  return cats;
}
function saveCategories(cats) { U.writeJson(P.CATEGORIES_FILE, cats); }

const RESERVED_SLUGS = new Set([
  'blog', 'products', 'category', 'css', 'js', 'images', 'cms', 'about', 'contact', 'api', 'admin',
  'privacy-policy', 'disclaimer', 'terms-and-conditions', '404', 'index', 'sitemap', 'robots', 'page-2', '_cms',
  'node_modules', 'zornavik', 'favicon',
]);

/* Fill in every derived field of a category from just a name (used for brand-new categories).
   Every text field is whitespace-collapsed the same way post fields are (see coercePost below) -
   a category's meta description is edited in a <textarea>, so without this a stray line break
   pasted or typed in there would land as a literal newline inside <meta content="...">, breaking
   the tag across lines on every page that uses that category. */
function buildCategory(input, settings, existing) {
  const s = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');
  const label = s(input.label);
  const slug = s(input.slug) || U.slugify(label);
  const author = settings.author.name;
  const lower = label.toLowerCase();
  const base = existing || {};
  return {
    slug,
    label,
    h1: s(input.h1) || base.h1 || `${label} Reviews`,
    intro: s(input.intro) || base.intro || `Expert reviews and buying guides for ${lower} - by ${author}.`,
    sectionTitle: s(input.sectionTitle) || base.sectionTitle || `All ${label} Reviews`,
    metaTitle: s(input.metaTitle) || base.metaTitle || `Best ${label} Reviews & Buying Guides | ${settings.siteName}`,
    metaDescription:
      s(input.metaDescription) || base.metaDescription ||
      `Expert ${lower} reviews & buying guides. Honest comparisons and real specs by ${author}.`,
    ogTitle: s(input.ogTitle) || base.ogTitle || '',
    ogDescription: s(input.ogDescription) || base.ogDescription || '',
    collectionDescription:
      s(input.collectionDescription) || base.collectionDescription || `All ${lower} reviews and buying guides at ${settings.siteName}.`,
  };
}

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */
function postFile(id) { return path.join(P.POSTS, id + '.json'); }
function isValidId(id) { return /^p_[a-z0-9]+$/.test(String(id || '')); }
function newId() { return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

function listPosts() {
  U.ensureDir(P.POSTS);
  const out = [];
  for (const f of fs.readdirSync(P.POSTS)) {
    if (!f.endsWith('.json')) continue;
    const p = U.readJson(path.join(P.POSTS, f), null);
    if (p && p.id) out.push(p);
  }
  return out;
}
function getPost(id) {
  if (!isValidId(id)) return null;
  return U.readJson(postFile(id), null);
}
function savePost(post) {
  post.updatedAt = new Date().toISOString();
  U.writeJson(postFile(post.id), post);
  return post;
}
function trashPost(id) {
  if (!isValidId(id) || !U.exists(postFile(id))) return;
  U.ensureDir(P.TRASH);
  fs.renameSync(postFile(id), path.join(P.TRASH, id + '.' + Date.now() + '.json'));
}

const EMPTY_POST = {
  status: 'draft',
  title: '',
  slug: '',
  category: '',
  content: '',
  metaTitle: '',
  metaDescription: '',
  canonical: '',
  excerpt: '',
  featuredImage: '',
  featuredAlt: '',
  date: '',
  updated: '',
  bumpUpdated: true,
  readTimeOverride: null,
  showDisclosure: true,
  showAuthor: true,
  showRelated: true,
  publishedUrl: '',
  publishedAt: '',
  createdAt: '',
  updatedAt: '',
};

/* Take whatever the dashboard sent and keep only fields we know, with the right types. */
function coercePost(input, existing) {
  const base = existing ? { ...existing } : { ...EMPTY_POST, id: newId(), createdAt: new Date().toISOString() };
  const s = (v, d) => (typeof v === 'string' ? v.trim() : d);
  const out = { ...base };
  if ('title' in input) out.title = s(input.title, '').replace(/\s+/g, ' ');
  if ('slug' in input) out.slug = s(input.slug, '').toLowerCase();
  if ('category' in input) out.category = s(input.category, '');
  if ('content' in input) out.content = typeof input.content === 'string' ? input.content : out.content;
  if ('metaTitle' in input) out.metaTitle = s(input.metaTitle, '');
  if ('metaDescription' in input) out.metaDescription = s(input.metaDescription, '').replace(/\s+/g, ' ');
  if ('canonical' in input) out.canonical = s(input.canonical, '');
  if ('excerpt' in input) out.excerpt = s(input.excerpt, '').replace(/\s+/g, ' ');
  if ('featuredImage' in input) out.featuredImage = s(input.featuredImage, '');
  if ('featuredAlt' in input) out.featuredAlt = s(input.featuredAlt, '');
  if ('date' in input) out.date = U.isISODate(input.date) ? input.date : '';
  if ('updated' in input) out.updated = U.isISODate(input.updated) ? input.updated : '';
  if ('bumpUpdated' in input) out.bumpUpdated = !!input.bumpUpdated;
  if ('readTimeOverride' in input) {
    const n = parseInt(input.readTimeOverride, 10);
    out.readTimeOverride = n > 0 ? Math.min(n, 999) : null;
  }
  for (const k of ['showDisclosure', 'showAuthor', 'showRelated']) if (k in input) out[k] = !!input[k];
  return out;
}

module.exports = {
  DEFAULT_SETTINGS, getSettings, saveSettings,
  getCategories, saveCategories, buildCategory, RESERVED_SLUGS, decodeEntities,
  listPosts, getPost, savePost, trashPost, coercePost, newId, isValidId,
};
