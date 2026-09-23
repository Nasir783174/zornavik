'use strict';
/*
 * HTML templates. They copy the markup of the pages that already exist on the website,
 * and the header + footer are read live from index.html so they never drift.
 */
const path = require('path');
const P = require('./paths');
const U = require('./util');
const { esc, jsonLd } = U;

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap';

const SHARE_ICONS = {
  facebook: 'M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.885v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
};

/* ---------- header / footer (harvested from index.html) ---------- */
function harvest() {
  const idx = U.readText(path.join(P.ROOT, 'index.html'), '');
  const header = (/<header id="site-header">[\s\S]*?<\/header>/.exec(idx) || [''])[0];
  const footer = (/<footer id="site-footer">[\s\S]*?<\/footer>/.exec(idx) || [''])[0];
  return { header, footer };
}

/* Rewrite the category links inside a header (desktop dropdown + mobile menu). */
function applyNav(html, categories) {
  html = html.replace(/(<div class="nav-dropdown-menu">)[\s\S]*?(<\/div>)/, (m, a, z) =>
    `${a}\n${categories.map((c) => `            <a href="/category/${c.slug}">${esc(c.label)}</a>`).join('\n')}\n          ${z}`);
  html = html.replace(/(<nav class="mobile-nav"[^>]*>)([\s\S]*?)(<\/nav>)/, (m, a, inner, z) => {
    const keep = [...inner.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>[\s\S]*?<\/a>/g)]
      .filter((x) => !x[1].startsWith('/category/')).map((x) => `    ${x[0]}`);
    const cats = categories.map((c) => `    <a href="/category/${c.slug}">${esc(c.label)}</a>`);
    return `${a}\n${[...keep, ...cats].join('\n')}\n  ${z}`;
  });
  return html;
}

function siteChrome(categories) {
  const { header, footer } = harvest();
  return { header: applyNav(header, categories), footer };
}

/* ---------- shared head pieces ---------- */
function headCommon(blocks) {
  return `  <link rel="icon" type="image/png" href="/zornavik.png">
  <link rel="apple-touch-icon" href="/zornavik.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_URL}" media="print" onload="this.media='all'">
  <noscript><link rel="stylesheet" href="${FONTS_URL}"></noscript>
  <link rel="stylesheet" href="/css/style.css">${blocks ? '\n  <link rel="stylesheet" href="/css/cms-blocks.css">' : ''}`;
}

function absUrl(settings, p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return settings.siteUrl + (p.startsWith('/') ? p : '/' + p);
}

/* ---------- post cards + pagination (same markup as js/registry.js builds) ---------- */
function buildCard(e) {
  return `  <article class="post-card">
    <a href="${esc(e.slug)}" class="post-card-img">
      <img src="${esc(e.image)}" alt="${esc(unesc(e.title))}" loading="lazy">
    </a>
    <div class="post-card-body">
      <span class="post-cat">${esc(unesc(e.catLabel))}</span>
      <a href="${esc(e.slug)}"><h2 class="post-title">${esc(unesc(e.title))}</h2></a>
      <p class="post-excerpt">${esc(unesc(e.excerpt))}</p>
      <span class="post-meta">${U.formatDate(e.date)} &middot; ${e.readTime} min read</span>
    </div>
  </article>`;
}
/* registry.js holds text that is already HTML-safe for innerHTML; decode it before escaping for static HTML */
function unesc(s) {
  return String(s == null ? '' : s)
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}
function buildCards(entries) { return entries.map(buildCard).join('\n'); }

function pageUrl(base, i) { return i === 1 ? (base || '/') : `${base}/page-${i}`; }
function buildPagination(cur, total, base) {
  if (total <= 1) return '';
  let h = '<div class="pagination">';
  h += `<a href="${cur > 1 ? pageUrl(base, cur - 1) : '#'}" class="page-btn${cur === 1 ? ' disabled' : ''}">&#8592;</a>`;
  for (let i = 1; i <= total; i++) h += `<a href="${pageUrl(base, i)}" class="page-btn${i === cur ? ' active' : ''}">${i}</a>`;
  h += `<a href="${cur < total ? pageUrl(base, cur + 1) : '#'}" class="page-btn${cur === total ? ' disabled' : ''}">&#8594;</a>`;
  return h + '</div>';
}

/* ------------------------------------------------------------------ */
/* Post page                                                           */
/* ------------------------------------------------------------------ */
function renderPost({ post, processed, settings, category, categories, related, readTime, preview }) {
  const path_ = `/${post.category}/${post.slug}`;
  const canonical = post.canonical || settings.siteUrl + path_;
  const plain = processed.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const desc = post.metaDescription || post.excerpt || plain.slice(0, 155);
  const title = post.metaTitle || `${post.title} | ${settings.siteName}`;
  const ogImage = absUrl(settings, post.featuredImage || settings.defaultOgImage);
  const a = settings.author;
  const authorUrl = absUrl(settings, a.url);
  const published = post.date;
  const modified = post.updated || post.date;
  const { header, footer } = siteChrome(categories);

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: settings.siteUrl },
          { '@type': 'ListItem', position: 2, name: category.label, item: `${settings.siteUrl}/category/${category.slug}` },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      },
      {
        '@type': 'Article',
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        headline: post.title,
        description: desc,
        image: ogImage,
        author: {
          '@type': 'Person', name: a.name, url: authorUrl, jobTitle: a.jobTitle,
          image: absUrl(settings, a.avatar),
          ...(settings.twitterUrl ? { sameAs: [settings.twitterUrl] } : {}),
        },
        publisher: {
          '@type': 'Organization', name: settings.siteName, url: settings.siteUrl,
          logo: { '@type': 'ImageObject', url: `${settings.siteUrl}/zornavik.png` },
        },
        datePublished: published,
        dateModified: modified,
      },
    ],
  };
  let schema = `  <script type="application/ld+json">\n  ${jsonLd(ld).replace(/\n/g, '\n  ')}\n  </script>`;
  if (processed.faqs.length) {
    const faq = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: processed.faqs.map((f) => ({
        '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    schema += `\n\n  <script type="application/ld+json">\n  ${jsonLd(faq).replace(/\n/g, '\n  ')}\n  </script>`;
  }

  const meta = [
    `<span>By <a href="${esc(a.url)}" class="author-link">${esc(a.name)}</a></span>`,
    `<span>${U.formatDate(published)}</span>`,
  ];
  if (post.updated && post.updated > post.date) meta.push(`<span>Updated ${U.formatDate(post.updated)}</span>`);
  meta.push(`<span>${readTime} min read</span>`);
  const metaBar = meta.join('\n        <span class="sep">&middot;</span>\n        ');

  const featured = post.featuredImage
    ? `\n    <img class="article-featured-img"
         src="${esc(post.featuredImage)}"
         alt="${esc(post.featuredAlt || post.title)}"
         loading="eager" fetchpriority="high"
         width="${post._featW || 1200}" height="${post._featH || 630}">\n`
    : '';

  const disclosure = post.showDisclosure
    ? `        <div class="ftc-disclosure">
          <p><strong>Affiliate Disclosure:</strong> ${esc(settings.disclosure)}</p>
        </div>\n\n`
    : '';

  const authorCard = post.showAuthor
    ? `\n        <div class="author-card">
          <img src="${esc(a.avatar)}" alt="${esc(a.name)}" width="80" height="80" class="author-avatar" loading="lazy">
          <div class="author-card-body">
            <div class="author-meta">${esc(a.role)}</div>
            <strong>${esc(a.name)}</strong>
            <p>${esc(a.bio)}</p>
          </div>
        </div>\n`
    : '';

  const relatedBlock = post.showRelated && related.length
    ? `\n        <section class="related-posts">
          <h3>Related Guides</h3>
          <ul>
${related.map((r) => `            <li><a href="${esc(r.slug)}">${esc(unesc(r.title))}</a></li>`).join('\n')}
          </ul>
        </section>\n`
    : '';

  const shareUrl = encodeURIComponent(canonical).replace(/%3A/g, ':').replace(/%2F/g, '/');
  const shareText = encodeURIComponent(post.title).replace(/%20/g, '+');
  const shareBtn = (href, icon, label) => `            <a class="share-btn" href="${href}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24"><path d="${SHARE_ICONS[icon]}"/></svg>
              ${label}
            </a>`;

  const previewBanner = preview
    ? `\n<div style="position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#111;color:#fff;font:600 14px/1.4 Inter,system-ui,sans-serif;padding:10px 16px;text-align:center;">Preview — this page is not published yet</div>\n`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(canonical)}">${preview ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="${esc(ogImage)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${esc(settings.twitterHandle)}">
${headCommon(true)}

${schema}
</head>
<body>

${header}

<main>
  <div class="container">

    <div class="article-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span class="breadcrumb-sep">/</span>
        <a href="/category/${esc(category.slug)}">${esc(category.label)}</a>
        <span class="breadcrumb-sep">/</span>
        <span>${esc(post.title)}</span>
      </nav>
      <h1 class="article-title">${esc(post.title)}</h1>
      <div class="article-meta-bar">
        ${metaBar}
      </div>
    </div>
${featured}
    <div class="article-layout">

      <article class="article-content">

${disclosure}${processed.html.split('\n').map((l) => (l ? '        ' + l : l)).join('\n')}
${authorCard}${relatedBlock}
      </article>

      <!-- SIDEBAR -->
      <aside class="article-sidebar">
        <div class="sidebar-share">
          <h5>Share this article</h5>
          <div class="share-btns">
${shareBtn(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, 'facebook', 'Facebook')}
${shareBtn(`https://twitter.com/intent/tweet?url=${shareUrl}&amp;text=${shareText}`, 'x', 'Twitter / X')}
${shareBtn(esc(settings.instagramUrl || 'https://www.instagram.com/zornavik/'), 'instagram', 'Instagram')}
          </div>
        </div>
      </aside>

    </div><!-- /article-layout -->

  </div>

</main>

${footer}

<script>document.getElementById('yr').textContent = new Date().getFullYear();</script>
<script src="/js/registry.js"></script>
<script src="/js/main.js"></script>${previewBanner}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/* Category page                                                       */
/* ------------------------------------------------------------------ */
function renderCategoryPage({ cat, entries, page, totalPages, perPage, settings, categories }) {
  const base = `/category/${cat.slug}`;
  const url = settings.siteUrl + (page === 1 ? base : `${base}/page-${page}`);
  const lower = cat.label.toLowerCase();
  const title = page === 1 ? cat.metaTitle : `${cat.h1} — Page ${page} | ${settings.siteName}`;
  const desc = page === 1 ? cat.metaDescription : `More ${lower} reviews and buying guides from ${settings.siteName}, page ${page} of ${lower}.`;
  const ogTitle = page === 1 ? (cat.ogTitle || cat.metaTitle) : title;
  const ogDesc = page === 1 ? (cat.ogDescription || cat.metaDescription) : desc;
  const { header, footer } = siteChrome(categories);
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.h1,
    url,
    description: cat.collectionDescription || `All ${lower} reviews and buying guides at ${settings.siteName}.`,
    isPartOf: { '@type': 'WebSite', name: settings.siteName, url: settings.siteUrl },
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: settings.siteUrl },
      { '@type': 'ListItem', position: 2, name: cat.label, item: settings.siteUrl + base },
    ],
  };
  const pageEntries = entries.slice((page - 1) * perPage, page * perPage);
  const pag = buildPagination(page, totalPages, base);
  const ind = (s) => s.replace(/\n/g, '\n  ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${esc(url)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(ogTitle)}">
  <meta property="og:description" content="${esc(ogDesc)}">
  <meta property="og:url" content="${esc(url)}">
  <meta property="og:image" content="${esc(absUrl(settings, settings.defaultOgImage))}">
  <meta property="og:image:width" content="800">
  <meta property="og:image:height" content="800">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="${esc(settings.twitterHandle)}">
${headCommon(false)}
  <script type="application/ld+json">
  ${ind(jsonLd(collection))}
  </script>
  <script type="application/ld+json">
  ${ind(jsonLd(crumbs))}
  </script>
</head>
<body>

${header}

<main>
  <div class="container">
    <div class="cat-header">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span class="breadcrumb-sep">/</span>
        <span>${esc(cat.label)}</span>
      </nav>
      <h1>${esc(cat.h1)}</h1>
      <p>${esc(cat.intro)}</p>
    </div>

    <div class="section-head" style="margin-top:32px;">
      <h2>${esc(cat.sectionTitle)}</h2>
    </div>

    <div class="blog-grid" id="cat-grid">
${buildCards(pageEntries)}
</div>
    <div id="cat-pagination">${pag}</div>
  </div>
</main>

${footer}

<script>document.getElementById('yr').textContent = new Date().getFullYear();</script>
<script src="/js/registry.js"></script>
<script src="/js/main.js"></script>
<script>
  const CATEGORY = '${cat.slug}';
  const CAT_BASE = '/category/${cat.slug}';
  const postsPerPage = ${perPage};
  const pathParts = window.location.pathname.split('/page-');
  const currentPage = pathParts.length > 1 ? parseInt(pathParts[1]) : 1;
  const filtered = BLOG_REGISTRY.filter(p => p.category === CATEGORY);
  const totalPages = Math.ceil(filtered.length / postsPerPage);
  const start = (currentPage - 1) * postsPerPage;
  const pagePosts = filtered.slice(start, start + postsPerPage);
  renderGrid('cat-grid', pagePosts);
  if (totalPages > 1) {
    document.getElementById('cat-pagination').innerHTML = buildPagination(currentPage, totalPages, CAT_BASE);
  }
</script>

</body>
</html>
`;
}

module.exports = {
  siteChrome, applyNav, harvest, buildCard, buildCards, buildPagination, pageUrl,
  renderPost, renderCategoryPage, absUrl, unesc,
};
