'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- escaping ---------- */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
/* JSON-LD safe string (used inside <script type="application/ld+json">) */
function jsonLd(obj) {
  return JSON.stringify(obj, null, 2).replace(/</g, '\\u003c');
}

/* ---------- slugs ---------- */
function slugify(str, max = 90) {
  let s = String(str || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length > max) {
    s = s.slice(0, max);
    const cut = s.lastIndexOf('-');
    if (cut > max * 0.6) s = s.slice(0, cut);
    s = s.replace(/-+$/g, '');
  }
  return s;
}
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ---------- dates ---------- */
function pad(n) { return String(n).padStart(2, '0'); }
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDate(iso) {
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}
function isISODate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }

/* ---------- files ---------- */
function ensureDir(dir) { fs.mkdirSync(dir, { recursive: true }); }
function readText(file, fallback = null) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { return fallback; }
}
function writeText(file, text) {
  ensureDir(path.dirname(file));
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, file);
}
function readJson(file, fallback) {
  const t = readText(file);
  if (t == null) return fallback;
  try { return JSON.parse(t); } catch (e) { return fallback; }
}
function writeJson(file, obj) { writeText(file, JSON.stringify(obj, null, 2) + '\n'); }
function exists(file) { try { fs.accessSync(file); return true; } catch (e) { return false; } }
function walk(dir, filter, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === 'node_modules' || ent.name === '.git' || ent.name === 'cms') continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, filter, out);
    else if (!filter || filter(p)) out.push(p);
  }
  return out;
}

/* ---------- html helpers ---------- */
/* Find the matching </div> for the <div ...> that starts at `openIdx`. Returns {innerStart, innerEnd, end}. */
function matchDiv(html, openIdx) {
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = openIdx;
  let depth = 0, m, innerStart = -1;
  while ((m = re.exec(html))) {
    if (m[0][1] !== '/') {
      depth++;
      if (depth === 1) innerStart = m.index + m[0].length;
    } else {
      depth--;
      if (depth === 0) return { innerStart, innerEnd: m.index, end: m.index + m[0].length };
    }
  }
  return null;
}
/* Replace the inner HTML of the first <div> whose opening tag matches `openRe`. Returns new html or null. */
function replaceDivInner(html, openRe, newInner) {
  const m = openRe.exec(html);
  if (!m) return null;
  const r = matchDiv(html, m.index);
  if (!r) return null;
  return html.slice(0, r.innerStart) + newInner + html.slice(r.innerEnd);
}

function countWords(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t ? t.split(' ').length : 0;
}

module.exports = {
  esc, jsonLd, slugify, SLUG_RE, todayISO, formatDate, isISODate,
  ensureDir, readText, writeText, readJson, writeJson, exists, walk,
  matchDiv, replaceDivInner, countWords,
};
