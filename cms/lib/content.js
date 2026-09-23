'use strict';
/*
 * Turns the HTML that comes out of the dashboard editor (or a Google Docs / Word paste)
 * into clean article HTML that uses only the classes the website's style.css already knows.
 */
const path = require('path');
const cheerio = require('cheerio');
const P = require('./paths');
const U = require('./util');
const { imageSize } = require('./imagesize');

const ALLOWED_CLASSES = new Set([
  'buy-btn', 'pros-cons', 'pros', 'cons', 'specs-box',
  'quick-picks', 'quick-picks-title', 'quick-picks-list',
]);
const ATTRS = {
  a: ['href', 'target', 'rel', 'title', 'id', 'name'],
  img: ['src', 'alt', 'width', 'height', 'loading', 'title'],
  td: ['colspan', 'rowspan'],
  th: ['colspan', 'rowspan'],
  ol: ['start'],
  h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
};
const AFFILIATE_RE = /(^|\.)(amzn\.to|amzn\.com|a\.co|amazon\.[a-z.]+|shareasale\.com|awin1\.com|impact\.com|go\.skimresources\.com|howl\.me|clickbank\.net)$/i;

function rename(el, name) { el.name = name; if (el.tagName !== undefined) { try { el.tagName = name; } catch (e) { /* getter only */ } } }
function textOf($, el) { return $(el).text().replace(/\s+/g, ' ').trim(); }

function isBlank($, el) {
  const $el = $(el);
  if ($el.find('img, table, iframe, hr').length) return false;
  return $el.text().replace(/[\s\u00a0\u200b]+/g, '') === '';
}

function hostOf(href) {
  try { return new URL(href).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

async function processContent(html, ctx = {}) {
  const siteUrl = (ctx.siteUrl || '').replace(/\/+$/, '');
  const siteHost = hostOf(siteUrl);
  const $ = cheerio.load(String(html || ''), null, false);

  /* 1 — throw away anything that should never be in an article */
  $('script, style, iframe, object, embed, form, input, button, select, textarea, link, meta, noscript, colgroup, col').remove();
  $('*').each((_, el) => {
    for (const name of Object.keys(el.attribs || {})) if (/^on/i.test(name)) $(el).removeAttr(name);
  });

  /* 2 — unwrap dashboard widget wrappers (keep the markup inside) */
  $('[data-cms-widget]').each((_, el) => { $(el).replaceWith($(el).contents()); });

  /* 3 — normalise tags */
  /* Google Docs / Word mark bold + italic with inline styles on <span>s — turn those into real <strong>/<em> */
  $('span[style]').each((_, el) => {
    const st = String($(el).attr('style') || '').toLowerCase();
    const bold = /font-weight:\s*(bold|[6-9]00)/.test(st);
    const ital = /font-style:\s*italic/.test(st);
    let inner = $(el).contents();
    if (!bold && !ital) { $(el).replaceWith(inner); return; }
    let html = $.html(inner);
    if (ital) html = `<em>${html}</em>`;
    if (bold) html = `<strong>${html}</strong>`;
    $(el).replaceWith(html);
  });
  $('b[style]').each((_, el) => {            // Google Docs wraps the whole paste in <b style="font-weight:normal">
    if (/font-weight:\s*(normal|[1-5]00)/i.test($(el).attr('style') || '')) $(el).replaceWith($(el).contents());
  });
  $('b').each((_, el) => rename(el, 'strong'));
  $('i').each((_, el) => rename(el, 'em'));
  $('h1').each((_, el) => rename(el, 'h2'));
  $('u, span, font, mark, small, big, center').each((_, el) => { $(el).replaceWith($(el).contents()); });
  $('strong strong, em em').each((_, el) => { $(el).replaceWith($(el).contents()); });
  $('div').each((_, el) => {
    const cls = ($(el).attr('class') || '').split(/\s+/);
    if (cls.some((c) => ALLOWED_CLASSES.has(c))) return;
    if ($(el).find('p, ul, ol, table, h2, h3, h4, h5, h6, div, img, blockquote').length) $(el).replaceWith($(el).contents());
    else rename(el, 'p');
  });

  /* 4 — list items / table cells: Google Docs wraps their text in <p> */
  $('li').each((_, el) => {
    const kids = $(el).children('p');
    if (kids.length === 1 && $(el).contents().length === 1) $(kids[0]).replaceWith($(kids[0]).contents());
    else kids.each((i, p) => { if (i < kids.length - 1) $(p).after('<br>'); $(p).replaceWith($(p).contents()); });
  });
  $('td, th').each((_, el) => {
    const kids = $(el).children('p');
    kids.each((i, p) => { if (i < kids.length - 1) $(p).after('<br>'); $(p).replaceWith($(p).contents()); });
  });

  /* 5 — attribute + class whitelist */
  $('*').each((_, el) => {
    const tag = el.name;
    const allowed = ATTRS[tag] || [];
    for (const name of Object.keys(el.attribs || {})) {
      if (name === 'class') continue;
      if (!allowed.includes(name)) $(el).removeAttr(name);
    }
    const cls = ($(el).attr('class') || '').split(/\s+/).filter((c) => ALLOWED_CLASSES.has(c));
    if (cls.length) $(el).attr('class', cls.join(' ')); else $(el).removeAttr('class');
    const href = $(el).attr('href');
    if (href && /^\s*(javascript|data|vbscript):/i.test(href)) $(el).removeAttr('href');
  });

  /* 6 — empty blocks, trailing <br> */
  $('p').each((_, el) => { if (isBlank($, el)) $(el).remove(); });
  $('p').each((_, el) => {
    let last = $(el).contents().last();
    while (last.length && last[0].type === 'tag' && last[0].name === 'br') { last.remove(); last = $(el).contents().last(); }
  });

  /* 7 — images: unwrap <p><img></p>, clean src, dimensions, lazy loading */
  $('p').each((_, el) => {
    const kids = $(el).contents().filter((__, n) => !(n.type === 'text' && !n.data.trim()));
    if (kids.length === 1 && kids[0].type === 'tag' && kids[0].name === 'img') $(el).replaceWith(kids[0]);
  });
  let missingAlt = 0;
  const imgs = $('img').toArray();
  for (const el of imgs) {
    let src = ($(el).attr('src') || '').trim().replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, '');
    if (siteUrl && src.startsWith(siteUrl + '/')) src = src.slice(siteUrl.length);
    $(el).attr('src', src);
    if ($(el).attr('alt') == null) $(el).attr('alt', '');
    if (!$(el).attr('alt').trim()) missingAlt++;
    $(el).attr('loading', 'lazy');
    if (src.startsWith('/images/') && (!$(el).attr('width') || !$(el).attr('height'))) {
      const dim = ctx.imageSizeOf ? ctx.imageSizeOf(src) : imageSize(path.join(P.ROOT, src));
      if (dim && dim.width && dim.height) { $(el).attr('width', String(dim.width)); $(el).attr('height', String(dim.height)); }
    }
  }

  /* 8 — links (Google Docs wraps every link in a google.com/url?q=... redirect on copy — unwrap it) */
  $('a[href]').each((_, el) => {
    let href = ($(el).attr('href') || '').trim();
    const gm = /^https?:\/\/(?:www\.)?google\.[a-z.]+\/url\?(?:[^#&]*&)*q=([^&]+)/i.exec(href);
    if (gm) { try { href = decodeURIComponent(gm[1]); } catch (e) { /* keep as-is */ } }
    if (siteUrl && (href === siteUrl || href.startsWith(siteUrl + '/') || href.startsWith(siteUrl + '#'))) {
      href = href.slice(siteUrl.length) || '/';
    }
    $(el).attr('href', href);
    if (/^https?:\/\//i.test(href) && hostOf(href) !== siteHost) {
      const affiliate = AFFILIATE_RE.test(hostOf(href)) || $(el).hasClass('buy-btn');
      if (!$(el).attr('rel')) $(el).attr('rel', affiliate ? 'nofollow sponsored noopener' : 'noopener');
      if (!$(el).attr('target') && (affiliate || $(el).hasClass('buy-btn'))) $(el).attr('target', '_blank');
    }
    if ($(el).hasClass('buy-btn') && !$(el).attr('target')) $(el).attr('target', '_blank');
  });
  $('p').each((_, el) => {               // <p><a class="buy-btn"></a></p> → the bare link (that is how the site's CSS expects it)
    const kids = $(el).contents().filter((__, n) => !(n.type === 'text' && !n.data.trim()));
    if (kids.length === 1 && kids[0].type === 'tag' && kids[0].name === 'a' && $(kids[0]).hasClass('buy-btn')) $(el).replaceWith(kids[0]);
  });

  /* 9 — tables need a header row */
  $('table').each((_, el) => {
    const $t = $(el);
    $t.find('thead, tbody, tfoot').each((__, s) => { /* flatten so we can rebuild */ $(s).replaceWith($(s).contents()); });
    const rows = $t.children('tr').toArray();
    if (!rows.length) { $t.remove(); return; }
    let first = $(rows[0]);
    if (!first.children('th').length) first.children('td').each((__, c) => rename(c, 'th'));
    const thead = $('<thead></thead>').append(first);
    const tbody = $('<tbody></tbody>').append(rows.slice(1));
    $t.empty().append(thead).append(tbody);
  });

  /* headings: Google Docs marks its Heading styles as bold spans too — that's redundant once it's an <h2> */
  $('h2, h3, h4, h5, h6').each((_, el) => {
    const $el = $(el);
    if ($el.children().length === 1 && $el.children().first().is('strong')) $el.children().first().replaceWith($el.children().first().contents());
  });

  /* 10 — heading ids (used by Quick Picks and "jump to" links) */
  const used = new Set();
  $('[id]').each((_, el) => { if (/^h[2-6]$/.test(el.name)) used.add($(el).attr('id')); });
  const headings = [];
  $('h2, h3, h4').each((_, el) => {
    let id = $(el).attr('id');
    const text = textOf($, el);
    if (!id) {
      const base = U.slugify(text, 60) || 'section';
      id = base; let n = 2;
      while (used.has(id)) id = `${base}-${n++}`;
      used.add(id);
      $(el).attr('id', id);
    }
    headings.push({ level: Number(el.name[1]), text, id });
  });

  /* 11 — FAQ block → structured data */
  const faqs = [];
  const top = $.root().children().toArray();
  const faqIdx = top.findIndex((n) => n.name === 'h2' && /^(faqs?\b|frequently asked)/i.test(textOf($, n)));
  if (faqIdx >= 0) {
    let q = null;
    for (let i = faqIdx + 1; i < top.length; i++) {
      const n = top[i];
      if (n.name === 'h2') break;
      if (n.name === 'h3' || n.name === 'h4') { q = { q: textOf($, n), a: [] }; faqs.push(q); }
      else if (q && ['p', 'ul', 'ol'].includes(n.name)) q.a.push(textOf($, n));
    }
  }
  const faqItems = faqs.map((f) => ({ q: f.q, a: f.a.join(' ').trim() })).filter((f) => f.q && f.a);

  /* 12 — serialise with a blank line between top-level blocks */
  const parts = [];
  $.root().contents().each((_, n) => {
    if (n.type === 'text') { if (n.data.trim()) parts.push(`<p>${U.esc(n.data.trim())}</p>`); return; }
    if (n.type === 'comment') return;
    parts.push($.html(n));
  });
  const out = parts.join('\n\n');
  const words = U.countWords($.root().text());

  return { html: out, words, headings, faqs: faqItems, missingAlt, images: imgs.length };
}

module.exports = { processContent };
