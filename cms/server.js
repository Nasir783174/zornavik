'use strict';
/*
 * Zornavik CMS — local blog editor.
 *   Dashboard:      http://localhost:3000
 *   Site preview:   http://localhost:3001   (your real website files, served locally)
 * Nothing here is deployed — Vercel only ever sees the HTML/CSS/JS/images the CMS writes.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');

const P = require('./lib/paths');
const U = require('./lib/util');
const S = require('./lib/store');
const R = require('./lib/registry-file');
const B = require('./lib/build');
const I = require('./lib/images');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const SITE_PORT = parseInt(process.env.SITE_PORT, 10) || 3001;
const HOST = '127.0.0.1';

/* ---------- first-run setup ---------- */
U.ensureDir(P.POSTS);
U.ensureDir(P.IMAGES);
S.getCategories();                                   // creates data/categories.json from the existing category pages
if (!U.exists(path.join(P.ROOT, 'css', 'cms-blocks.css'))) {
  console.error('\n  ✗ css/cms-blocks.css is missing from the website folder. Copy it back from the CMS download.\n');
  process.exit(1);
}
try { R.read(); } catch (e) { console.error('\n  ✗ ' + e.message + '\n'); process.exit(1); }

/* ---------- guards (this is a local tool: only accept requests from this computer) ---------- */
function guard(req, res, next) {
  const hostOk = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(req.headers.host || '');
  if (!hostOk) return res.status(403).send('Forbidden');
  const origin = req.headers.origin;
  if (origin && req.method !== 'GET' && req.method !== 'HEAD' && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)) {
    return res.status(403).send('Forbidden');
  }
  next();
}

/* ------------------------------------------------------------------ */
/* Dashboard app                                                       */
/* ------------------------------------------------------------------ */
const app = express();
app.disable('x-powered-by');
app.use(guard);

const tinymceDir = path.dirname(require.resolve('tinymce/tinymce.min.js'));
const noCache = (res) => res.setHeader('Cache-Control', 'no-store');
app.use('/_cms/tinymce', express.static(tinymceDir, { maxAge: '7d' }));
app.use('/_cms', express.static(P.PUBLIC, { setHeaders: noCache }));
/* the editor shows your real site CSS + images */
app.use('/css', express.static(path.join(P.ROOT, 'css'), { setHeaders: noCache }));
app.use('/images', express.static(P.IMAGES, { setHeaders: noCache }));
app.use('/js', express.static(path.join(P.ROOT, 'js'), { setHeaders: noCache }));
app.get('/zornavik.png', (req, res) => res.sendFile(path.join(P.ROOT, 'zornavik.png')));
app.get('/', (req, res) => { noCache(res); res.sendFile(path.join(P.PUBLIC, 'index.html')); });

const api = express.Router();
api.use(express.json({ limit: '30mb' }));

const wrap = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.message || 'Something went wrong.' });
  });
};

function summary(p) {
  const words = U.countWords(String(p.content || '').replace(/<[^>]+>/g, ' '));
  return {
    id: p.id, title: p.title, slug: p.slug, category: p.category, status: p.status,
    date: p.date, updated: p.updated, publishedUrl: p.publishedUrl, dirty: !!p.dirty,
    updatedAt: p.updatedAt, createdAt: p.createdAt, words,
    featuredImage: p.featuredImage,
  };
}
function listAll() {
  const posts = S.listPosts();
  const own = new Set(posts.filter((p) => p.publishedUrl).map((p) => p.publishedUrl));
  const legacy = R.read().filter((e) => !own.has(e.slug)).map((e) => ({
    legacy: true, title: S.decodeEntities(e.title), url: e.slug, category: e.category, date: e.date, image: e.image, status: 'published',
  }));
  return { posts: posts.map(summary), legacy };
}

api.get('/bootstrap', wrap(async (req, res) => {
  const settings = S.getSettings();
  const counts = B.categoryCounts();
  res.json({
    settings,
    categories: S.getCategories().map((c) => ({ ...c, count: counts[c.slug] || 0 })),
    ...listAll(),
    hasSharp: I.hasSharp(),
    sitePort: SITE_PORT,
    reserved: [...S.RESERVED_SLUGS],
  });
}));

api.get('/posts', wrap(async (req, res) => res.json(listAll())));

api.post('/posts', wrap(async (req, res) => {
  const post = S.coercePost(req.body || {}, null);
  res.json(S.savePost(post));
}));

api.get('/posts/:id', wrap(async (req, res) => {
  const post = S.getPost(req.params.id);
  if (!post) throw new B.UserError('Post not found.', 404);
  res.json(post);
}));

api.put('/posts/:id', wrap(async (req, res) => {
  const cur = S.getPost(req.params.id);
  if (!cur) throw new B.UserError('Post not found.', 404);
  const post = S.coercePost(req.body || {}, cur);
  if (cur.status === 'published') post.dirty = true;
  res.json(S.savePost(post));
}));

api.post('/posts/:id/publish', wrap(async (req, res) => {
  const cur = S.getPost(req.params.id);
  if (!cur) throw new B.UserError('Post not found.', 404);
  const post = S.coercePost(req.body || {}, cur);
  post.dirty = false;
  const result = await B.publishPost(post);
  res.json({ ...result, ...listAll(), categories: S.getCategories().map((c) => ({ ...c, count: B.categoryCounts()[c.slug] || 0 })) });
}));

api.post('/posts/:id/unpublish', wrap(async (req, res) => {
  const cur = S.getPost(req.params.id);
  if (!cur) throw new B.UserError('Post not found.', 404);
  res.json({ post: await B.unpublishPost(cur) });
}));

api.delete('/posts/:id', wrap(async (req, res) => {
  const cur = S.getPost(req.params.id);
  if (!cur) throw new B.UserError('Post not found.', 404);
  await B.deletePost(cur);
  res.json({ ok: true });
}));

/* images */
api.post('/upload', express.raw({ type: () => true, limit: '30mb' }), wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new B.UserError('No file received.');
  const name = decodeURIComponent(String(req.headers['x-filename'] || 'image.png'));
  const base = req.headers['x-basename'] ? decodeURIComponent(String(req.headers['x-basename'])) : '';
  try { res.json(await I.saveImage(req.body, name, base)); }
  catch (e) { throw new B.UserError(e.message); }
}));
api.get('/images', wrap(async (req, res) => res.json({ images: I.listImages() })));

/* settings */
api.get('/settings', wrap(async (req, res) => res.json(S.getSettings())));
api.put('/settings', wrap(async (req, res) => {
  const before = S.getSettings();
  const s = S.saveSettings(req.body || {});
  if (s.postsPerPage !== before.postsPerPage || s.postOrder !== before.postOrder) await B.rebuildAll();
  res.json(s);
}));

/* categories */
const catList = () => { const c = B.categoryCounts(); return S.getCategories().map((x) => ({ ...x, count: c[x.slug] || 0 })); };
api.post('/categories', wrap(async (req, res) => { const cat = await B.createCategory(req.body || {}); res.json({ category: cat, categories: catList() }); }));
api.put('/categories/:slug', wrap(async (req, res) => { const cat = await B.updateCategory(req.params.slug, req.body || {}); res.json({ category: cat, categories: catList() }); }));
api.delete('/categories/:slug', wrap(async (req, res) => { await B.deleteCategory(req.params.slug); res.json({ categories: catList() }); }));

api.post('/rebuild', wrap(async (req, res) => { await B.rebuildAll(); res.json({ ok: true, ...listAll() }); }));

app.use('/api', api);

/* ------------------------------------------------------------------ */
/* Site preview app (your website files, with "clean URLs" like Vercel) */
/* ------------------------------------------------------------------ */
const site = express();
site.disable('x-powered-by');
site.use(guard);

site.get('/__preview/:id', async (req, res) => {
  try {
    const post = S.getPost(req.params.id);
    if (!post) return res.status(404).send('Post not found');
    const html = await B.previewPost(post);
    noCache(res);
    res.type('html').send(html);
  } catch (e) { console.error(e); res.status(500).send('Preview failed: ' + e.message); }
});

const BLOCKED = /^\/(cms|node_modules|\.git)(\/|$)|\/\.[^/]/i;
site.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  let p;
  try { p = decodeURIComponent(req.path); } catch (e) { return res.status(400).end(); }
  if (p.includes('\0') || BLOCKED.test(p)) return next();
  p = p.replace(/\/+$/, '') || '/';
  const candidates = p === '/' ? ['index.html'] : [p + '.html', p, p + '/index.html'];
  for (const c of candidates) {
    const full = path.join(P.ROOT, c);
    if (!full.startsWith(P.ROOT + path.sep)) continue;
    try {
      if (fs.statSync(full).isFile()) { noCache(res); return res.sendFile(full); }
    } catch (e) { /* try the next candidate */ }
  }
  next();
});
site.use((req, res) => {
  const f = path.join(P.ROOT, '404.html');
  res.status(404);
  if (U.exists(f)) res.sendFile(f); else res.send('Not found');
});

/* ---------- start ---------- */
function openBrowser(url) {
  if (process.env.NO_OPEN) return;
  const cmd = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  try { spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref(); } catch (e) { /* ignore */ }
}

function listen(server, port, label) {
  return new Promise((resolve) => {
    const srv = server.listen(port, HOST, () => resolve(true));
    srv.on('error', (err) => {
      if (err.code === 'EADDRINUSE') console.error(`\n  ✗ Port ${port} is already in use (${label}). Close the other CMS window, or start with:  PORT=3100 SITE_PORT=3101 npm start\n`);
      else console.error(err);
      process.exit(1);
    });
  });
}

(async () => {
  await listen(app, PORT, 'dashboard');
  await listen(site, SITE_PORT, 'site preview');
  const url = `http://localhost:${PORT}`;
  console.log('\n  Zornavik CMS is running');
  console.log(`  ▸ Dashboard      ${url}`);
  console.log(`  ▸ Site preview   http://localhost:${SITE_PORT}`);
  console.log(`  ▸ Website folder ${P.ROOT}`);
  console.log(I.hasSharp() ? '  ▸ Images         JPG/PNG uploads are converted to WebP automatically' : '  ▸ Images         (sharp not installed — uploads are saved as they are)');
  console.log('\n  Press Ctrl+C to stop.\n');
  openBrowser(url);
})();
