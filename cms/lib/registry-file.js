'use strict';
/* Reads and writes js/registry.js - the list of blog posts the site's own JavaScript uses. */
const vm = require('vm');
const P = require('./paths');
const U = require('./util');

const ARRAY_RE = /const BLOG_REGISTRY = \[[\s\S]*?\n\];/;

function readSource() { return U.readText(P.REGISTRY, ''); }

function read() {
  const m = ARRAY_RE.exec(readSource());
  if (!m) throw new Error('Could not find BLOG_REGISTRY in js/registry.js');
  const arr = vm.runInNewContext('(' + m[0].replace(/^const BLOG_REGISTRY = /, '').replace(/;$/, '') + ')');
  return arr.map((e) => ({ ...e }));
}

function serialize(entries) {
  const q = (s) => JSON.stringify(String(s == null ? '' : s));
  const body = entries.map((e) => `  {
    title:    ${q(e.title)},
    slug:     ${q(e.slug)},
    date:     ${q(e.date)},
    excerpt:  ${q(e.excerpt)},
    readTime: ${parseInt(e.readTime, 10) || 1},
    category: ${q(e.category)},
    catLabel: ${q(e.catLabel)},
    image:    ${q(e.image)},
  },`).join('\n');
  return `const BLOG_REGISTRY = [\n${body}\n];`;
}

/* Two small fixes to the helper functions at the bottom of registry.js (safe to run many times):
   1) the "←" button on page 2 of the home page linked to "" instead of "/"
   2) dates were shown one day early for visitors in the Americas (timezone) */
function patchHelpers(src) {
  if (!/function pageUrl\(/.test(src)) {
    src = src.replace(/function buildPagination[\s\S]*?\n}\n/, `function pageUrl(baseUrl, i) {
  return i === 1 ? (baseUrl || '/') : \`\${baseUrl}/page-\${i}\`;
}

function buildPagination(currentPage, totalPages, baseUrl) {
  let html = \`<div class="pagination">\`;
  html += \`<a href="\${currentPage > 1 ? pageUrl(baseUrl, currentPage - 1) : '#'}" class="page-btn\${currentPage === 1 ? ' disabled' : ''}">&#8592;</a>\`;
  for (let i = 1; i <= totalPages; i++) {
    html += \`<a href="\${pageUrl(baseUrl, i)}" class="page-btn\${i === currentPage ? ' active' : ''}">\${i}</a>\`;
  }
  html += \`<a href="\${currentPage < totalPages ? pageUrl(baseUrl, currentPage + 1) : '#'}" class="page-btn\${currentPage === totalPages ? ' disabled' : ''}">&#8594;</a>\`;
  html += \`</div>\`;
  return html;
}
`);
  }
  src = src.replace(/toLocaleDateString\('en-US', \{ year: 'numeric', month: 'long', day: 'numeric' \}\)/,
    "toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })");
  return src;
}

function write(entries) {
  let src = readSource();
  if (!ARRAY_RE.test(src)) throw new Error('Could not find BLOG_REGISTRY in js/registry.js');
  src = src.replace(ARRAY_RE, () => serialize(entries));
  src = patchHelpers(src);
  U.writeText(P.REGISTRY, src);
}

/* htmlSafe: registry text is dropped into innerHTML by the site's JS, so new entries store & / < / " escaped. */
function htmlSafe(s) { return U.esc(s); }

module.exports = { read, write, htmlSafe };
