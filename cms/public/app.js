'use strict';
/* Zornavik Studio — dashboard (plain JavaScript, no build step) */

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function slugify(str, max = 90) {
  let s = String(str || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > max) { s = s.slice(0, max); const c = s.lastIndexOf('-'); if (c > max * 0.6) s = s.slice(0, c); s = s.replace(/-+$/g, ''); }
  return s;
}
const pad2 = (n) => String(n).padStart(2, '0');
function todayISO() { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

async function api(method, url, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let res;
  try { res = await fetch(url, opts); } catch (e) { throw new Error('Cannot reach the CMS server. Is "npm start" still running?'); }
  let data = null;
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

function toast(msg, o = {}) {
  const el = document.createElement('div');
  el.className = 'toast' + (o.err ? ' err' : '');
  el.innerHTML = `<span>${esc(msg)}</span>`;
  if (o.href) { const a = document.createElement('a'); a.href = o.href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = o.linkText || 'Open'; el.appendChild(a); }
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), o.ms || (o.err ? 7000 : 5000));
}

/* ---------- modal ---------- */
function openModal({ title, body, wide, actions = [], onOpen }) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-x" type="button" aria-label="Close">×</button></div>
    <div class="modal-body"></div><div class="modal-foot"></div></div>`;
  const bodyEl = $('.modal-body', back);
  if (typeof body === 'string') bodyEl.innerHTML = body; else bodyEl.appendChild(body);
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('.modal-x', back).onclick = close;
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  const foot = $('.modal-foot', back);
  if (!actions.length) foot.remove();
  actions.forEach((a) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (a.primary ? ' btn-primary' : '') + (a.danger ? ' btn-danger' : '');
    b.textContent = a.label;
    b.onclick = () => a.onClick ? a.onClick(close, b) : close();
    foot.appendChild(b);
  });
  $('#modal-root').appendChild(back);
  if (onOpen) onOpen(bodyEl, close);
  const first = $('input, textarea, select', bodyEl); if (first) first.focus();
  return { close, el: back, body: bodyEl };
}
function confirmBox(title, message, okLabel = 'OK', danger = false) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal({
      title, body: `<p style="margin:0;color:var(--ink-2)">${esc(message)}</p>`,
      actions: [
        { label: 'Cancel', onClick: (close) => { done = true; close(); resolve(false); } },
        { label: okLabel, primary: !danger, danger, onClick: (close) => { done = true; close(); resolve(true); } },
      ],
    });
    m.el.addEventListener('DOMNodeRemoved', () => {}, { once: true });
    const obs = new MutationObserver(() => { if (!document.body.contains(m.el) && !done) { done = true; resolve(false); } });
    obs.observe($('#modal-root'), { childList: true });
  });
}

/* ------------------------------------------------------------------ */
/* state                                                               */
/* ------------------------------------------------------------------ */
let S = null;      // server state
let E = null;      // editor state (only while the editor is open)

const siteUrl = (p) => `http://localhost:${S.sitePort}${p || ''}`;
const catLabel = (slug) => { const c = S.categories.find((x) => x.slug === slug); return c ? c.label : (slug || '—'); };
async function refresh() {
  S = await api('GET', '/api/bootstrap');
  $('#site-link').href = siteUrl('/');
}

/* ------------------------------------------------------------------ */
/* router                                                              */
/* ------------------------------------------------------------------ */
let routing = false;
async function route() {
  if (routing) return;
  routing = true;
  try {
    if (E) { const ok = await leaveEditor(); if (!ok) { history.replaceState(null, '', E.hash); routing = false; return; } }
    const hash = location.hash || '#/posts';
    const [, name, arg] = hash.split('/');
    $('#app').classList.toggle('editing', name === 'new' || name === 'edit');
    $$('#rail-nav a').forEach((a) => a.classList.toggle('active', a.dataset.nav === (name === 'edit' ? 'posts' : name)));
    const view = $('#view');
    view.innerHTML = '<div class="loading">Loading…</div>';
    if (name === 'posts') { await refresh(); renderPosts(); }
    else if (name === 'new') { if (!S) await refresh(); await showEditor(null); }
    else if (name === 'edit') { if (!S) await refresh(); await showEditor(arg); }
    else if (name === 'categories') { await refresh(); renderCategories(); }
    else if (name === 'media') { await refresh(); renderMedia(); }
    else if (name === 'settings') { await refresh(); renderSettings(); }
    else { location.hash = '#/posts'; }
  } catch (e) {
    $('#view').innerHTML = `<div class="page"><div class="empty"><h3>Something went wrong</h3><p>${esc(e.message)}</p><a class="btn" href="#/posts">Back to posts</a></div></div>`;
  } finally { routing = false; }
}
window.addEventListener('hashchange', route);

/* ------------------------------------------------------------------ */
/* posts list                                                          */
/* ------------------------------------------------------------------ */
let postFilter = 'all', postQuery = '';
function renderPosts() {
  const view = $('#view');
  const rows = [
    ...S.posts.map((p) => ({ ...p, _sort: p.date || (p.updatedAt || '').slice(0, 10) })),
    ...S.legacy.map((p) => ({ ...p, _sort: p.date })),
  ].sort((a, b) => (a._sort < b._sort ? 1 : a._sort > b._sort ? -1 : 0));
  const counts = {
    all: rows.length,
    published: rows.filter((r) => r.status === 'published').length,
    draft: rows.filter((r) => r.status === 'draft').length,
  };
  view.innerHTML = `<div class="page">
    <div class="page-head"><div><h1>Posts</h1><p class="page-sub">${S.posts.length} made with Studio · ${S.legacy.length} existing pages on the site</p></div>
      <a class="btn btn-primary" href="#/new">Add new post</a></div>
    <div class="toolbar">
      <div class="tabs" id="p-tabs">
        ${['all', 'published', 'draft'].map((k) => `<button type="button" data-k="${k}" class="${postFilter === k ? 'active' : ''}">${{ all: 'All', published: 'Published', draft: 'Drafts' }[k]} (${counts[k]})</button>`).join('')}
      </div>
      <input class="search" id="p-search" type="text" placeholder="Search posts" value="${esc(postQuery)}">
    </div>
    <div id="p-table"></div></div>`;
  const draw = () => {
    const q = postQuery.trim().toLowerCase();
    const list = rows.filter((r) => (postFilter === 'all' || r.status === postFilter) && (!q || (r.title || '').toLowerCase().includes(q)));
    if (!list.length) {
      $('#p-table').innerHTML = S.posts.length || q
        ? `<div class="empty"><h3>No posts match</h3><p>Try a different filter or search.</p></div>`
        : `<div class="empty"><h3>Write your first post</h3><p>Paste from Google Docs, add your product boxes, and publish.</p><a class="btn btn-primary" href="#/new">Add new post</a></div>`;
      return;
    }
    $('#p-table').innerHTML = `<table class="table"><thead><tr><th>Title</th><th style="width:170px">Category</th><th style="width:150px">Status</th><th style="width:120px">Date</th></tr></thead><tbody>
      ${list.map((r) => r.legacy ? `<tr>
        <td><a class="t-title" href="${siteUrl(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a><div class="t-path">${esc(r.url)}</div>
          <div class="row-actions"><a href="${siteUrl(r.url)}" target="_blank" rel="noopener">View</a><span style="color:var(--faint)">Edit its HTML in VS Code</span></div></td>
        <td>${esc(catLabel(r.category))}</td><td><span class="pill legacy">Existing page</span></td><td>${fmtDate(r.date)}</td></tr>`
      : `<tr>
        <td><a class="t-title" href="#/edit/${r.id}">${esc(r.title || 'Untitled post')}</a>
          <div class="t-path">${esc(r.publishedUrl || (r.category && r.slug ? `/${r.category}/${r.slug}` : 'No URL yet'))}${r.words ? ` · ${r.words.toLocaleString()} words` : ''}</div>
          <div class="row-actions"><a href="#/edit/${r.id}">Edit</a>
            ${r.status === 'published' ? `<a href="${siteUrl(r.publishedUrl)}" target="_blank" rel="noopener">View</a>` : `<a href="${siteUrl('/__preview/' + r.id)}" target="_blank" rel="noopener">Preview</a>`}
            <button type="button" class="danger" data-trash="${r.id}">Move to trash</button></div></td>
        <td>${esc(catLabel(r.category))}</td>
        <td><span class="pill ${r.status}">${r.status === 'published' ? 'Published' : 'Draft'}</span>${r.dirty ? '<div class="t-path">Unpublished changes</div>' : ''}</td>
        <td>${fmtDate(r.date)}</td></tr>`).join('')}
      </tbody></table>`;
    $$('[data-trash]').forEach((b) => b.onclick = () => trashPost(b.dataset.trash));
  };
  draw();
  $$('#p-tabs button').forEach((b) => b.onclick = () => { postFilter = b.dataset.k; renderPosts(); });
  $('#p-search').oninput = debounce((e) => { postQuery = e.target.value; draw(); }, 120);
}
async function trashPost(id) {
  const p = S.posts.find((x) => x.id === id);
  const ok = await confirmBox('Move to trash?', p && p.status === 'published'
    ? 'This post is live. Its page will be removed from the site (push to GitHub to take it offline). The draft is kept in cms/data/trash.'
    : 'The draft is moved to cms/data/trash.', 'Move to trash', true);
  if (!ok) return;
  try { await api('DELETE', `/api/posts/${id}`); toast('Moved to trash.'); await refresh(); renderPosts(); } catch (e) { toast(e.message, { err: true }); }
}

/* ------------------------------------------------------------------ */
/* categories                                                          */
/* ------------------------------------------------------------------ */
function renderCategories() {
  const view = $('#view');
  view.innerHTML = `<div class="page"><div class="page-head"><div><h1>Categories</h1>
    <p class="page-sub">Each category gets its own page, a menu link, and a folder for its posts.</p></div></div>
    <div class="card"><h3>All categories</h3><div id="cat-rows"></div></div>
    <div class="card"><h3>Add a category</h3>
      <div class="grid-2">
        <div class="field"><label>Name <span class="hint">e.g. Air Purifiers</span></label><input type="text" id="nc-label"></div>
        <div class="field"><label>Slug <span class="hint">used in URLs</span></label><input type="text" id="nc-slug" placeholder="air-purifiers"></div>
      </div>
      <button class="btn btn-primary" id="nc-add" type="button">Add category</button>
    </div></div>`;
  const rowsEl = $('#cat-rows');
  rowsEl.innerHTML = S.categories.map((c) => `<div data-c="${c.slug}">
      <div class="cat-row"><div class="grow"><strong>${esc(c.label)}</strong><div class="muted">/category/${esc(c.slug)} · ${c.count} post${c.count === 1 ? '' : 's'}</div></div>
        <a class="btn btn-sm" href="${siteUrl('/category/' + c.slug)}" target="_blank" rel="noopener">View</a>
        <button class="btn btn-sm" type="button" data-edit="${c.slug}">Edit</button>
        <button class="btn btn-sm btn-danger" type="button" data-del="${c.slug}" ${c.count ? 'disabled title="Move or delete its posts first"' : ''}>Delete</button></div>
      <div class="cat-edit" hidden></div></div>`).join('');
  $$('[data-edit]').forEach((b) => b.onclick = () => {
    const c = S.categories.find((x) => x.slug === b.dataset.edit);
    const box = $(`[data-c="${c.slug}"] .cat-edit`);
    if (!box.hidden) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = `<div class="grid-2">
      <div class="field"><label>Name</label><input type="text" data-k="label" value="${esc(c.label)}"></div>
      <div class="field"><label>Page heading (H1)</label><input type="text" data-k="h1" value="${esc(c.h1)}"></div></div>
      <div class="field"><label>Intro text</label><input type="text" data-k="intro" value="${esc(c.intro)}"></div>
      <div class="field"><label>Meta title</label><input type="text" data-k="metaTitle" value="${esc(c.metaTitle)}"></div>
      <div class="field"><label>Meta description</label><textarea data-k="metaDescription" style="min-height:60px">${esc(c.metaDescription)}</textarea></div>
      <button class="btn btn-primary btn-sm" type="button" data-save>Save category</button>`;
    $('[data-save]', box).onclick = async () => {
      const body = { ...c }; $$('[data-k]', box).forEach((i) => body[i.dataset.k] = i.value);
      try { await api('PUT', `/api/categories/${c.slug}`, body); toast('Category saved. Menus and pages updated.'); await refresh(); renderCategories(); }
      catch (e) { toast(e.message, { err: true }); }
    };
  });
  $$('[data-del]').forEach((b) => b.onclick = async () => {
    if (!(await confirmBox('Delete category?', 'Its page and menu link are removed.', 'Delete', true))) return;
    try { await api('DELETE', `/api/categories/${b.dataset.del}`); toast('Category deleted.'); await refresh(); renderCategories(); } catch (e) { toast(e.message, { err: true }); }
  });
  const label = $('#nc-label'), slug = $('#nc-slug');
  label.oninput = () => { if (!slug.dataset.touched) slug.value = slugify(label.value); };
  slug.oninput = () => { slug.dataset.touched = '1'; };
  $('#nc-add').onclick = async () => {
    try { await api('POST', '/api/categories', { label: label.value, slug: slug.value }); toast('Category added. Its page and menu link are ready.'); await refresh(); renderCategories(); }
    catch (e) { toast(e.message, { err: true }); }
  };
}

/* ------------------------------------------------------------------ */
/* media                                                               */
/* ------------------------------------------------------------------ */
async function uploadFile(file, baseName) {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name || 'image.png'), ...(baseName ? { 'X-Basename': encodeURIComponent(baseName) } : {}) },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data;
}
const fmtSize = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';

/* Library grid used by both the Media page and the "choose image" popup. */
function mediaLibrary(container, { onSelect, onDouble, baseName }) {
  container.innerHTML = `<div class="dropzone" data-drop>Drop images here or <button type="button" class="btn btn-sm" data-browse>Upload</button>
    <input type="file" accept="image/*" multiple hidden data-file></div>
    <div class="toolbar"><input class="search" style="margin-left:0;width:100%" type="text" placeholder="Search images" data-q></div>
    <div class="media-grid" data-grid></div>`;
  let items = [], selected = null;
  const grid = $('[data-grid]', container), q = $('[data-q]', container);
  const draw = () => {
    const term = q.value.trim().toLowerCase();
    const list = items.filter((i) => !term || i.name.toLowerCase().includes(term));
    grid.innerHTML = list.length ? list.map((i) => `<button type="button" class="media-item${selected === i.src ? ' selected' : ''}" data-src="${esc(i.src)}" title="${esc(i.src)}">
      <div class="thumb"><img loading="lazy" src="${esc(i.src)}" alt=""></div><div class="cap">${esc(i.name)}<br>${fmtSize(i.size)}</div></button>`).join('')
      : '<div class="empty" style="grid-column:1/-1">No images yet.</div>';
    $$('.media-item', grid).forEach((b) => {
      b.onclick = () => { selected = b.dataset.src; draw(); onSelect && onSelect(items.find((i) => i.src === selected)); };
      b.ondblclick = () => onDouble && onDouble(items.find((i) => i.src === b.dataset.src));
    });
  };
  const upload = async (files) => {
    for (const f of files) {
      if (!f.type.startsWith('image/')) { toast(`${f.name} is not an image.`, { err: true }); continue; }
      try {
        const r = await uploadFile(f, baseName);
        items.unshift({ name: r.name, src: r.src, size: r.size }); selected = r.src; draw();
        onSelect && onSelect(items[0]);
        toast(`Uploaded ${r.name}${r.converted ? ' (converted to WebP)' : ''}`);
      } catch (e) { toast(e.message, { err: true }); }
    }
  };
  const dz = $('[data-drop]', container), fileIn = $('[data-file]', container);
  $('[data-browse]', container).onclick = () => fileIn.click();
  fileIn.onchange = () => { upload([...fileIn.files]); fileIn.value = ''; };
  ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('over'); }));
  dz.addEventListener('drop', (e) => upload([...e.dataTransfer.files]));
  q.oninput = debounce(draw, 100);
  api('GET', '/api/images').then((r) => { items = r.images; draw(); }).catch((e) => toast(e.message, { err: true }));
}
function renderMedia() {
  $('#view').innerHTML = `<div class="page"><div class="page-head"><div><h1>Media</h1><p class="page-sub">Everything in your website's <code>images</code> folder. Uploads land there automatically${S.hasSharp ? ' and PNG/JPG are converted to WebP' : ''}.</p></div></div><div id="ml"></div></div>`;
  mediaLibrary($('#ml'), {
    onSelect: null,
    onDouble: (i) => openModal({ title: i.name, body: `<img src="${esc(i.src)}" alt="" style="max-width:100%;border-radius:6px;display:block;margin-bottom:12px"><p class="mono">${esc(i.src)}</p>`, actions: [{ label: 'Close' }] }),
  });
}
function openMedia(onPick, opts = {}) {
  let picked = null;
  const wrap = document.createElement('div');
  const m = openModal({
    title: opts.title || 'Choose an image', wide: true, body: wrap,
    actions: [{ label: 'Cancel' }, { label: opts.button || 'Use this image', primary: true, onClick: (close) => { if (!picked) return toast('Click an image first.', { err: true }); close(); onPick(picked); } }],
  });
  mediaLibrary(wrap, { onSelect: (i) => { picked = i; }, onDouble: (i) => { m.close(); onPick(i); }, baseName: opts.baseName });
}

/* ------------------------------------------------------------------ */
/* settings                                                            */
/* ------------------------------------------------------------------ */
function renderSettings() {
  const s = S.settings, a = s.author;
  $('#view').innerHTML = `<div class="page" style="max-width:820px"><div class="page-head"><div><h1>Settings</h1><p class="page-sub">Used on every post the Studio publishes.</p></div>
    <button class="btn btn-primary" id="s-save" type="button">Save settings</button></div>
    <div class="card"><h3>Website</h3><div class="grid-2">
      <div class="field"><label>Site URL</label><input type="text" data-s="siteUrl" value="${esc(s.siteUrl)}"></div>
      <div class="field"><label>Site name</label><input type="text" data-s="siteName" value="${esc(s.siteName)}"></div>
      <div class="field"><label>Twitter / X handle</label><input type="text" data-s="twitterHandle" value="${esc(s.twitterHandle)}"></div>
      <div class="field"><label>Default social image</label><input type="text" data-s="defaultOgImage" value="${esc(s.defaultOgImage)}"></div></div></div>
    <div class="card"><h3>Author box</h3><div class="grid-2">
      <div class="field"><label>Name</label><input type="text" data-a="name" value="${esc(a.name)}"></div>
      <div class="field"><label>Label above the name</label><input type="text" data-a="role" value="${esc(a.role)}"></div>
      <div class="field"><label>Job title (for Google)</label><input type="text" data-a="jobTitle" value="${esc(a.jobTitle)}"></div>
      <div class="field"><label>Photo</label><input type="text" data-a="avatar" value="${esc(a.avatar)}"></div></div>
      <div class="field"><label>Short bio</label><textarea data-a="bio">${esc(a.bio)}</textarea></div></div>
    <div class="card"><h3>Affiliate disclosure</h3><div class="field"><label>Text shown at the top of a post</label><textarea data-s="disclosure" style="min-height:110px">${esc(s.disclosure)}</textarea></div></div>
    <div class="card"><h3>Lists</h3><div class="grid-2">
      <div class="field"><label>Posts per page</label><input type="number" min="3" max="30" data-s="postsPerPage" value="${s.postsPerPage}"></div>
      <div class="field"><label>Order</label><select data-s="postOrder"><option value="newest" ${s.postOrder === 'newest' ? 'selected' : ''}>Newest first</option><option value="oldest" ${s.postOrder === 'oldest' ? 'selected' : ''}>Oldest first</option></select></div></div></div></div>`;
  $('#s-save').onclick = async () => {
    const body = { author: {} };
    $$('[data-s]').forEach((i) => body[i.dataset.s] = i.value);
    $$('[data-a]').forEach((i) => body.author[i.dataset.a] = i.value);
    try { S.settings = await api('PUT', '/api/settings', body); toast('Settings saved.'); } catch (e) { toast(e.message, { err: true }); }
  };
}

/* sidebar links */
$('#rebuild-btn').onclick = async () => {
  try { await api('POST', '/api/rebuild'); toast('List pages, menus and sitemap rebuilt.'); } catch (e) { toast(e.message, { err: true }); }
};

/* ------------------------------------------------------------------ */
/* editor                                                              */
/* ------------------------------------------------------------------ */
const WORDS_PER_MIN = () => (S.settings && S.settings.wordsPerMinute) || 200;
function wordCount(text) { const t = (text || '').replace(/\s+/g, ' ').trim(); return t ? t.split(' ').length : 0; }

function blankPost() {
  return { id: null, status: 'draft', title: '', slug: '', category: (S.categories[0] || {}).slug || '', content: '',
    metaTitle: '', metaDescription: '', canonical: '', excerpt: '', featuredImage: '', featuredAlt: '',
    date: '', updated: '', bumpUpdated: true, readTimeOverride: null, showDisclosure: true, showAuthor: true, showRelated: true,
    publishedUrl: '', publishedAt: '', slugTouched: false };
}

async function showEditor(id) {
  const post = id ? await api('GET', `/api/posts/${id}`) : blankPost();
  post.slugTouched = !!(post.slug); // existing posts: don't auto-slug over what's there
  E = { post, hash: location.hash, saving: false, dirty: false, lastSavedAt: Date.now(), timer: null, editor: null };

  const view = $('#view');
  view.innerHTML = `
  <div class="editor-shell">
    <div class="topbar">
      <a class="back" href="#/posts" title="Back to posts"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></a>
      <div class="doc">${post.id ? `Editing <b>${esc(post.title || 'Untitled post')}</b>` : 'New post'}</div>
      <div class="saved" id="ed-saved">${post.id ? 'Saved' : 'Not saved yet'}</div>
      <button class="btn btn-sm" id="ed-side-toggle" type="button" style="display:none">Post settings</button>
      ${post.status === 'published' ? `<a class="btn btn-sm" href="${siteUrl(post.publishedUrl)}" target="_blank" rel="noopener">View live</a>` : `<button class="btn btn-sm" id="ed-preview" type="button">Preview</button>`}
      <button class="btn btn-sm btn-primary" id="ed-publish" type="button">${post.status === 'published' ? 'Update' : 'Publish'}</button>
    </div>
    <div class="editor-body" id="ed-body">
      <div class="canvas">
        <div class="title-wrap">
          <textarea id="ed-title" class="title-input" placeholder="Add title" rows="1">${esc(post.title)}</textarea>
          <div class="title-permalink" id="ed-permalink"></div>
        </div>
        <div class="editor-wrap"><textarea id="ed-tiny"></textarea></div>
      </div>
      <aside class="side">
        <details class="panel" open><summary>Publish</summary><div class="panel-body" id="pnl-publish"></div></details>
        <details class="panel"><summary>Category</summary><div class="panel-body" id="pnl-cat"></div></details>
        <details class="panel"><summary>Featured image</summary><div class="panel-body" id="pnl-feat"></div></details>
        <details class="panel"><summary>Excerpt</summary><div class="panel-body" id="pnl-excerpt"></div></details>
        <details class="panel"><summary>Search &amp; social preview</summary><div class="panel-body" id="pnl-seo"></div></details>
        <details class="panel"><summary>Advanced</summary><div class="panel-body" id="pnl-adv"></div></details>
        <details class="panel"><summary>Checklist</summary><div class="panel-body" id="pnl-check"></div></details>
      </aside>
    </div>
  </div>`;

  autosize($('#ed-title'));
  $('#ed-title').addEventListener('input', () => { post.title = $('#ed-title').value; if (!post.slugTouched) post.slug = slugify(post.title); markDirty(); renderPermalink(); renderSeo(); });
  $('#ed-title').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); E.editor && E.editor.focus(); } });
  renderPermalink();
  renderPublishPanel();
  renderCatPanel();
  renderFeatPanel();
  renderExcerptPanel();
  renderSeo();
  renderAdvPanel();
  renderChecklist();
  $('#ed-publish').onclick = doPublish;
  $('#ed-preview').onclick = doPreview;

  await initEditor(post);
  window.addEventListener('beforeunload', beforeUnload);
}

function beforeUnload(e) { if (E && E.dirty) { e.preventDefault(); e.returnValue = ''; } }
async function leaveEditor() {
  if (!E) return true;
  if (E.dirty) {
    const ok = await confirmBox('Leave without saving?', 'Your last edits are not saved yet.', 'Leave without saving', true);
    if (!ok) return false;
  }
  if (E.timer) clearTimeout(E.timer);
  window.removeEventListener('beforeunload', beforeUnload);
  if (E.editor) { try { E.editor.remove(); } catch (e2) {} }
  E = null;
  return true;
}
function autosize(ta) { const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; ta.addEventListener('input', fit); fit(); }
function renderPermalink() {
  const p = E.post;
  $('#ed-permalink').textContent = p.category && p.slug ? `${siteUrl('/')}${p.category}/${p.slug}` : 'A URL will appear here once you add a title, category and slug.';
}
function markDirty() {
  E.dirty = true;
  const el = $('#ed-saved'); if (el) { el.textContent = 'Unsaved changes'; el.classList.add('dirty'); }
  scheduleSave();
}
function scheduleSave() {
  if (E.timer) clearTimeout(E.timer);
  E.timer = setTimeout(saveDraft, 1200);
}
async function saveDraft() {
  if (!E || E.saving) return;
  E.saving = true;
  const p = E.post;
  const body = { title: p.title, slug: p.slug, category: p.category, content: E.editor ? E.editor.getContent() : p.content,
    metaTitle: p.metaTitle, metaDescription: p.metaDescription, canonical: p.canonical, excerpt: p.excerpt,
    featuredImage: p.featuredImage, featuredAlt: p.featuredAlt, date: p.date, updated: p.updated, bumpUpdated: p.bumpUpdated,
    readTimeOverride: p.readTimeOverride, showDisclosure: p.showDisclosure, showAuthor: p.showAuthor, showRelated: p.showRelated };
  try {
    const saved = p.id ? await api('PUT', `/api/posts/${p.id}`, body) : await api('POST', '/api/posts', body);
    p.id = saved.id; p.status = saved.status; p.publishedUrl = saved.publishedUrl; p.publishedAt = saved.publishedAt;
    E.dirty = false;
    const el = $('#ed-saved'); if (el) { el.textContent = 'Saved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); el.classList.remove('dirty'); }
    if (!location.hash.includes(p.id)) history.replaceState(null, '', `#/edit/${p.id}`);
    E.hash = location.hash;
    renderChecklist();
  } catch (e) { toast('Could not save: ' + e.message, { err: true }); }
  finally { E.saving = false; }
}

/* ---------- sidebar panels ---------- */
function renderPublishPanel() {
  const p = E.post;
  $('#pnl-publish').innerHTML = `
    <div class="kv"><span>Status</span><span>${p.status === 'published' ? '<b style="color:var(--ok)">Published</b>' : 'Draft'}</span></div>
    <div class="field"><label>Publish date</label><input type="date" id="pp-date" value="${esc(p.date || todayISO())}"></div>
    ${p.status === 'published' ? `<label class="check"><input type="checkbox" id="pp-bump" ${p.bumpUpdated ? 'checked' : ''}> Show an "Updated" date if you republish on a later day</label>` : ''}
    ${p.publishedUrl ? `<div class="kv"><span>Live at</span><span class="mono" style="word-break:break-all;text-align:right">${esc(p.publishedUrl)}</span></div>
      <button class="btn btn-sm" id="pp-unpublish" type="button" style="margin-top:8px">Unpublish</button>` : ''}`;
  $('#pp-date').onchange = (e) => { p.date = e.target.value; markDirty(); };
  const bump = $('#pp-bump'); if (bump) bump.onchange = (e) => { p.bumpUpdated = e.target.checked; markDirty(); };
  const un = $('#pp-unpublish');
  if (un) un.onclick = async () => {
    if (!(await confirmBox('Unpublish this post?', 'Its live page is removed from the site (push to GitHub to take it offline) and it goes back to Draft.', 'Unpublish', true))) return;
    try { const r = await api('POST', `/api/posts/${p.id}/unpublish`); Object.assign(p, r.post); toast('Unpublished.'); renderPublishPanel(); $('#ed-publish').textContent = 'Publish'; }
    catch (e) { toast(e.message, { err: true }); }
  };
}
function renderCatPanel() {
  const p = E.post;
  $('#pnl-cat').innerHTML = `<div class="cat-list">${S.categories.map((c) => `<label class="check" style="margin-bottom:6px"><input type="radio" name="cat" value="${esc(c.slug)}" ${p.category === c.slug ? 'checked' : ''}>${esc(c.label)}</label>`).join('') || '<p class="hint">No categories yet.</p>'}</div>
    <a href="#/categories" style="font-size:12.5px">+ Add a new category</a>`;
  $$('input[name=cat]', $('#pnl-cat')).forEach((r) => r.onchange = () => { p.category = r.value; markDirty(); renderPermalink(); renderChecklist(); });
}
function renderFeatPanel() {
  const p = E.post;
  $('#pnl-feat').innerHTML = `<div class="feat">${p.featuredImage ? `<img src="${esc(p.featuredImage)}" alt="">` : '<div class="feat-empty">No featured image set</div>'}
    <div class="feat-actions"><button class="btn btn-sm" id="feat-pick" type="button">${p.featuredImage ? 'Replace' : 'Set featured image'}</button>${p.featuredImage ? '<button class="btn btn-sm btn-danger" id="feat-clear" type="button">Remove</button>' : ''}</div></div>
    <div class="field" style="margin-top:10px"><label>Alt text <span class="hint">for accessibility &amp; SEO</span></label><input type="text" id="feat-alt" value="${esc(p.featuredAlt)}" placeholder="${esc(p.title || 'Describe the image')}"></div>`;
  $('#feat-pick').onclick = () => openMedia((img) => { p.featuredImage = img.src; markDirty(); renderFeatPanel(); }, { title: 'Set featured image', baseName: p.slug });
  const cl = $('#feat-clear'); if (cl) cl.onclick = () => { p.featuredImage = ''; markDirty(); renderFeatPanel(); };
  $('#feat-alt').oninput = (e) => { p.featuredAlt = e.target.value; markDirty(); };
}
function renderExcerptPanel() {
  const p = E.post;
  $('#pnl-excerpt').innerHTML = `<div class="field"><label>Shown on the homepage and category cards <span class="count" id="ex-count"></span></label><textarea id="pp-excerpt" maxlength="220">${esc(p.excerpt)}</textarea><span class="hint">Leave blank to use the meta description.</span></div>`;
  const upd = () => { const n = $('#pp-excerpt').value.length; $('#ex-count').textContent = `${n}/220`; $('#ex-count').className = 'count' + (n > 200 ? ' warn' : ''); };
  $('#pp-excerpt').oninput = (e) => { p.excerpt = e.target.value; upd(); markDirty(); }; upd();
}
function renderSeo() {
  const p = E.post, settings = S.settings;
  const title = p.metaTitle || (p.title ? `${p.title} | ${settings.siteName}` : `${settings.siteName}`);
  const url = p.category && p.slug ? `${settings.siteUrl}/${p.category}/${p.slug}` : settings.siteUrl;
  const desc = p.metaDescription || p.excerpt || 'Add a meta description so search engines know what this post is about.';
  const box = $('#pnl-seo'); if (!box) return;
  box.innerHTML = `<div class="serp"><div class="u">${esc(url)}</div><div class="t">${esc(title)}</div><div class="d">${esc(desc)}</div></div>
    <div class="field"><label>Meta title <span class="count" id="mt-count"></span></label><input type="text" id="pp-mtitle" value="${esc(p.metaTitle)}" placeholder="${esc(title)}"></div>
    <div class="field"><label>Meta description <span class="count" id="md-count"></span></label><textarea id="pp-mdesc" maxlength="200">${esc(p.metaDescription)}</textarea></div>
    <div class="field"><label>Canonical URL <span class="hint">only if this content also lives elsewhere</span></label><input type="text" id="pp-canon" value="${esc(p.canonical)}" placeholder="${esc(url)}"></div>`;
  const updT = () => { const n = ($('#pp-mtitle').value || title).length; $('#mt-count').textContent = `${n}/60`; $('#mt-count').className = 'count' + (n > 60 ? ' warn' : n < 15 ? '' : ' ok'); };
  const updD = () => { const n = ($('#pp-mdesc').value || '').length; $('#md-count').textContent = `${n}/160`; $('#md-count').className = 'count' + (n > 160 ? ' warn' : n >= 70 ? ' ok' : ''); };
  $('#pp-mtitle').oninput = (e) => { p.metaTitle = e.target.value; updT(); markDirty(); box.querySelector('.t').textContent = e.target.value || title; };
  $('#pp-mdesc').oninput = (e) => { p.metaDescription = e.target.value; updD(); markDirty(); box.querySelector('.d').textContent = e.target.value || desc; };
  $('#pp-canon').oninput = (e) => { p.canonical = e.target.value; markDirty(); };
  updT(); updD();
}
function renderAdvPanel() {
  const p = E.post;
  $('#pnl-adv').innerHTML = `<div class="field"><label>Read time <span class="hint">minutes — leave blank to calculate automatically</span></label><input type="number" min="1" id="pp-rt" value="${p.readTimeOverride || ''}" placeholder="Auto"></div>
    <label class="check"><input type="checkbox" id="pp-disc" ${p.showDisclosure ? 'checked' : ''}> Show the affiliate disclosure box</label>
    <label class="check"><input type="checkbox" id="pp-auth" ${p.showAuthor ? 'checked' : ''}> Show the author card at the end</label>
    <label class="check"><input type="checkbox" id="pp-rel" ${p.showRelated ? 'checked' : ''}> Show "Related Guides" at the end</label>
    <div class="field" style="margin-top:6px"><label>Slug</label><input type="text" id="pp-slug" value="${esc(p.slug)}"></div>`;
  $('#pp-rt').oninput = (e) => { p.readTimeOverride = e.target.value ? parseInt(e.target.value, 10) : null; markDirty(); };
  $('#pp-disc').onchange = (e) => { p.showDisclosure = e.target.checked; markDirty(); };
  $('#pp-auth').onchange = (e) => { p.showAuthor = e.target.checked; markDirty(); };
  $('#pp-rel').onchange = (e) => { p.showRelated = e.target.checked; markDirty(); };
  $('#pp-slug').oninput = (e) => { p.slugTouched = true; p.slug = slugify(e.target.value, 90); e.target.value = p.slug; markDirty(); renderPermalink(); renderSeo(); };
}
function renderChecklist() {
  const p = E.post;
  const text = E.editor ? E.editor.getContent({ format: 'text' }) : '';
  const words = wordCount(text);
  const items = [];
  const push = (ok, msg) => items.push(`<li class="${ok ? '' : 'warn'}">${esc(msg)}</li>`);
  push(!!p.title, p.title ? `Title added (${p.title.length} characters)` : 'Add a title');
  push(!!p.slug, p.slug ? `Slug: ${p.slug}` : 'Add a slug');
  push(!!p.category, p.category ? `Category: ${catLabel(p.category)}` : 'Choose a category');
  push(words >= 300, `${words.toLocaleString()} words${words < 300 ? ' — aim for 300+' : ''}`);
  push(!!p.featuredImage, p.featuredImage ? 'Featured image set' : 'No featured image yet');
  push(!!(p.metaTitle || p.title), p.metaTitle ? 'Meta title set' : 'Meta title will default to the post title');
  push(!!(p.metaDescription || p.excerpt), (p.metaDescription || p.excerpt) ? 'Meta description set' : 'Add a meta description');
  $('#pnl-check').innerHTML = `<ul class="checks">${items.join('')}</ul><p class="hint" style="margin-top:8px">~${Math.max(1, Math.ceil(words / WORDS_PER_MIN()))} min read at ${WORDS_PER_MIN()} wpm.</p>`;
}

/* ---------- preview / publish ---------- */
async function doPreview() {
  await saveDraft();
  if (E.post.id) window.open(siteUrl('/__preview/' + E.post.id), '_blank', 'noopener');
}
async function doPublish() {
  await saveDraft();
  const p = E.post;
  const btn = $('#ed-publish'); if (!btn) return;
  const body = { title: p.title, slug: p.slug, category: p.category, content: E.editor.getContent(),
    metaTitle: p.metaTitle, metaDescription: p.metaDescription, canonical: p.canonical, excerpt: p.excerpt,
    featuredImage: p.featuredImage, featuredAlt: p.featuredAlt, date: p.date || todayISO(), updated: p.updated, bumpUpdated: p.bumpUpdated,
    readTimeOverride: p.readTimeOverride, showDisclosure: p.showDisclosure, showAuthor: p.showAuthor, showRelated: p.showRelated };
  btn.disabled = true; const was = btn.textContent; btn.textContent = 'Publishing…';
  try {
    const r = await api('POST', `/api/posts/${p.id}/publish`, body);
    Object.assign(p, r.post);
    E.dirty = false;
    S.categories = r.categories; S.posts = r.posts; S.legacy = r.legacy;
    btn.textContent = 'Update';
    document.querySelector('.doc').innerHTML = `Editing <b>${esc(p.title)}</b>`;
    renderPublishPanel();
    let msg = r.firstPublish ? 'Published.' : 'Updated.';
    if (r.moved) msg += ` Moved from ${r.moved} — a redirect was added.`;
    if (r.missingAlt) msg += ` ${r.missingAlt} image${r.missingAlt > 1 ? 's are' : ' is'} missing alt text.`;
    toast(msg, { href: siteUrl(r.url), linkText: 'View', ms: 8000 });
    const linkBtn = document.querySelector('.topbar').querySelector('a[target="_blank"]');
    if (!linkBtn) {
      const a = document.createElement('a'); a.className = 'btn btn-sm'; a.href = siteUrl(r.url); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'View live';
      $('#ed-preview') ? $('#ed-preview').replaceWith(a) : btn.before(a);
    }
  } catch (e) { toast(e.message, { err: true }); }
  finally { btn.disabled = false; if (btn.textContent === 'Publishing…') btn.textContent = was; }
}

/* ------------------------------------------------------------------ */
/* TinyMCE                                                             */
/* ------------------------------------------------------------------ */
function widgetHtml(kind, data) {
  if (kind === 'buy-btn') {
    return `<p><a class="buy-btn" href="${esc(data.href)}" target="_blank" rel="nofollow sponsored noopener">${esc(data.label || 'Check Price on Amazon')}</a></p>`;
  }
  if (kind === 'specs-box') {
    const rows = (data.rows || []).filter((r) => r.k || r.v).map((r) => `<tr><td>${esc(r.k)}</td><td>${esc(r.v)}</td></tr>`).join('');
    return `<div class="specs-box"><h4>${esc(data.title || 'Specifications')}</h4><table>${rows}</table></div>`;
  }
  if (kind === 'pros-cons') {
    const li = (arr) => (arr || []).filter(Boolean).map((x) => `<li>${esc(x)}</li>`).join('');
    return `<div class="pros-cons"><div class="pros"><h4>Pros</h4><ul>${li(data.pros)}</ul></div><div class="cons"><h4>Cons</h4><ul>${li(data.cons)}</ul></div></div>`;
  }
  if (kind === 'quick-picks') {
    const li = (data.rows || []).filter((r) => r.text).map((r) => `<li>&#8594; ${r.anchor ? `<a href="#${esc(r.anchor)}">${esc(r.text)}</a>` : esc(r.text)}${r.note ? ` — <em>${esc(r.note)}</em>` : ''}</li>`).join('');
    return `<div class="quick-picks"><p class="quick-picks-title">${esc(data.title || '▾ Quick Picks — Jump to Any Review')}</p><ul class="quick-picks-list">${li}</ul></div>`;
  }
  return '';
}
function wrapWidget(html, kind) { return `<div class="cms-widget" data-cms-widget="${kind}" contenteditable="false">${html}</div>`; }

function headingOptionsFromEditor(ed) {
  const out = [];
  ed.getBody().querySelectorAll('h2, h3').forEach((h) => {
    let id = h.id;
    if (!id) { id = slugify(h.textContent, 60) || 'section'; h.id = id; }
    out.push({ id, text: h.textContent.trim() || '(untitled heading)' });
  });
  return out;
}

async function initEditor(post) {
  const settings = S.settings;
  return new Promise((resolve) => {
    tinymce.init({
      selector: '#ed-tiny',
      license_key: 'gpl',
      height: '100%', resize: false, statusbar: false, menubar: false,
      skin: 'oxide', content_css: false,
      plugins: 'lists link image table autolink autoresize',
      toolbar: 'blocks | bold italic | bullist numlist | blockquote link image_picker table | h_widgets | removeformat',
      block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
      content_css: ['/css/style.css', '/_cms/editor-content.css'],
      body_class: 'article-content',
      placeholder: 'Type / for nothing yet — paste your draft from Google Docs, or start writing…',
      paste_data_images: true,
      paste_preprocess: (plugin, args) => { args.content = args.content.replace(/<o:p>[\s\S]*?<\/o:p>/g, ''); },
      table_default_attributes: {},
      table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
      valid_elements: '*[*]', // keep buy-btn / specs-box / pros-cons markup intact; server-side cleaner does the real sanitising
      extended_valid_elements: 'div[class|data-cms-widget|contenteditable]',
      custom_undo_redo_levels: 40,
      branding: false, promotion: false,
      setup(ed) {
        ed.ui.registry.addMenuButton('image_picker', {
          icon: 'image', tooltip: 'Insert image',
          fetch: (cb) => cb([{ type: 'menuitem', text: 'Insert image', onAction: () => insertImage(ed) }]),
        });
        ed.ui.registry.addButton('image_picker', { icon: 'image', tooltip: 'Insert image', onAction: () => insertImage(ed) });
        ed.ui.registry.addMenuButton('h_widgets', {
          text: '+ Block', tooltip: 'Insert a review block',
          fetch: (cb) => cb([
            { type: 'menuitem', text: 'Quick Picks list', onAction: () => openQuickPicksDialog(ed) },
            { type: 'menuitem', text: 'Pros & Cons', onAction: () => openProsConsDialog(ed) },
            { type: 'menuitem', text: 'Specs box', onAction: () => openSpecsDialog(ed) },
            { type: 'menuitem', text: 'Check Price button', onAction: () => openBuyBtnDialog(ed) },
          ]),
        });
        ed.on('dblclick', (e) => {
          const w = e.target.closest && e.target.closest('[data-cms-widget]');
          if (w) editWidget(ed, w);
        });
        ed.on('init', () => {
          if (post.content) ed.setContent(post.content);
          E.editor = ed; resolve();
        });
        ed.on('input undo redo Change SetContent', debounce(() => { if (E) { markDirty(); renderChecklist(); } }, 250));
      },
    });
  });
}

function insertImage(ed) {
  openMedia((img) => { ed.insertContent(`<img src="${esc(img.src)}" alt="">`); ed.focus(); }, { title: 'Insert image', baseName: E.post.slug });
}

/* ---------- widget dialogs ---------- */
/* If the cursor is sitting "on" a non-editable widget (which browsers treat as a selectable unit),
   move it into an editable paragraph right after that widget, creating one if needed. */
function ensureEditableCaret(ed) {
  const node = ed.selection.getNode();
  const widget = node && node.closest && node.closest('[data-cms-widget]');
  if (!widget) return;
  let next = widget.nextElementSibling;
  if (!next || (next.getAttribute && next.hasAttribute('data-cms-widget'))) {
    const p = ed.dom.create('p');
    p.innerHTML = '<br data-mce-bogus="1">';
    widget.parentNode.insertBefore(p, widget.nextSibling);
    next = p;
  }
  ed.selection.setCursorLocation(next, 0);
}

function widgetForm(fields) {
  const wrap = document.createElement('div');
  wrap.innerHTML = fields;
  return wrap;
}
function editWidget(ed, node) {
  const kind = node.dataset.cmsWidget;
  const openers = { 'quick-picks': openQuickPicksDialog, 'pros-cons': openProsConsDialog, 'specs-box': openSpecsDialog, 'buy-btn': openBuyBtnDialog };
  if (openers[kind]) openers[kind](ed, node);
}
function replaceOrInsert(ed, node, html, bookmark) {
  if (node) { const div = ed.dom.create('div'); div.innerHTML = html; ed.dom.replace(div.firstChild, node); }
  else {
    ed.focus();
    if (bookmark) ed.selection.moveToBookmark(bookmark);
    ed.insertContent(html);
    ensureEditableCaret(ed);   // land the cursor after the widget, not "on" it, so typing can continue right away
  }
  ed.fire('Change');
}

function openBuyBtnDialog(ed, node) {
  if (!node) ensureEditableCaret(ed);
  const bookmark = node ? null : ed.selection.getBookmark(2, true);
  const current = node ? { href: node.querySelector('a').getAttribute('href'), label: node.querySelector('a').textContent.trim() } : { href: '', label: 'Check Price on Amazon' };
  const body = widgetForm(`
    <div class="field"><label>Button text</label><input type="text" data-f="label" value="${esc(current.label)}"></div>
    <div class="field"><label>Affiliate link</label><input type="url" data-f="href" value="${esc(current.href)}" placeholder="https://amzn.to/..."></div>`);
  openModal({
    title: node ? 'Edit Check Price button' : 'Check Price button', body,
    actions: [{ label: 'Cancel' }, { label: node ? 'Save' : 'Insert', primary: true, onClick: (close) => {
      const data = { label: $('[data-f=label]', body).value.trim(), href: $('[data-f=href]', body).value.trim() };
      if (!data.href) { toast('Add the affiliate link.', { err: true }); return; }
      close(); replaceOrInsert(ed, node, wrapWidget(widgetHtml('buy-btn', data), 'buy-btn'), bookmark);
    } }],
  });
}

function specsRowsFromNode(node) {
  if (!node) return [{ k: '', v: '' }, { k: '', v: '' }, { k: '', v: '' }];
  return [...node.querySelectorAll('table tr')].map((tr) => ({ k: tr.children[0] ? tr.children[0].textContent.trim() : '', v: tr.children[1] ? tr.children[1].textContent.trim() : '' }));
}
function openSpecsDialog(ed, node) {
  if (!node) ensureEditableCaret(ed);
  const bookmark = node ? null : ed.selection.getBookmark(2, true);
  const title = node ? node.querySelector('h4').textContent.trim() : 'Specifications';
  let rows = specsRowsFromNode(node);
  const body = document.createElement('div');
  const renderRows = () => {
    body.innerHTML = `<div class="field"><label>Box title</label><input type="text" data-title value="${esc(title)}"></div><div data-rows></div>
      <button type="button" class="btn btn-sm" data-add>+ Add row</button>`;
    const rowsEl = $('[data-rows]', body);
    rowsEl.innerHTML = rows.map((r, i) => `<div class="qp-row" style="grid-template-columns:1fr 1fr auto"><div><label>Spec</label><input type="text" data-k="${i}" value="${esc(r.k)}"></div><div><label>Value</label><input type="text" data-v="${i}" value="${esc(r.v)}"></div><button type="button" class="btn btn-sm btn-danger" data-rm="${i}">✕</button></div>`).join('');
    rowsEl.querySelectorAll('[data-k]').forEach((i) => i.oninput = () => rows[+i.dataset.k].k = i.value);
    rowsEl.querySelectorAll('[data-v]').forEach((i) => i.oninput = () => rows[+i.dataset.v].v = i.value);
    rowsEl.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { rows.splice(+b.dataset.rm, 1); renderRows(); });
    $('[data-add]', body).onclick = () => { rows.push({ k: '', v: '' }); renderRows(); };
  };
  renderRows();
  openModal({
    title: node ? 'Edit specs box' : 'Specs box', body,
    actions: [{ label: 'Cancel' }, { label: node ? 'Save' : 'Insert', primary: true, onClick: (close) => {
      const data = { title: $('[data-title]', body).value.trim(), rows };
      close(); replaceOrInsert(ed, node, wrapWidget(widgetHtml('specs-box', data), 'specs-box'), bookmark);
    } }],
  });
}

function openProsConsDialog(ed, node) {
  if (!node) ensureEditableCaret(ed);
  const bookmark = node ? null : ed.selection.getBookmark(2, true);
  const pros = node ? [...node.querySelectorAll('.pros li')].map((li) => li.textContent.trim()) : ['', ''];
  const cons = node ? [...node.querySelectorAll('.cons li')].map((li) => li.textContent.trim()) : ['', ''];
  const body = document.createElement('div');
  body.innerHTML = `<div class="grid-2">
    <div><label class="label">Pros</label><textarea data-pros rows="6" placeholder="One per line">${esc(pros.join('\n'))}</textarea></div>
    <div><label class="label">Cons</label><textarea data-cons rows="6" placeholder="One per line">${esc(cons.join('\n'))}</textarea></div></div>`;
  openModal({
    title: node ? 'Edit Pros & Cons' : 'Pros & Cons', wide: true, body,
    actions: [{ label: 'Cancel' }, { label: node ? 'Save' : 'Insert', primary: true, onClick: (close) => {
      const data = { pros: $('[data-pros]', body).value.split('\n').map((s) => s.trim()).filter(Boolean), cons: $('[data-cons]', body).value.split('\n').map((s) => s.trim()).filter(Boolean) };
      if (!data.pros.length && !data.cons.length) { toast('Add at least one pro or con.', { err: true }); return; }
      close(); replaceOrInsert(ed, node, wrapWidget(widgetHtml('pros-cons', data), 'pros-cons'), bookmark);
    } }],
  });
}

function quickPicksRowsFromNode(node) {
  if (!node) return [{ text: '', anchor: '', note: '' }];
  return [...node.querySelectorAll('.quick-picks-list li')].map((li) => {
    const a = li.querySelector('a'), em = li.querySelector('em');
    const clone = li.cloneNode(true); if (clone.querySelector('a')) clone.querySelector('a').remove(); if (clone.querySelector('em')) clone.querySelector('em').remove();
    return { text: a ? a.textContent.trim() : clone.textContent.replace(/^\s*→?\s*/, '').replace(/—\s*$/, '').trim(), anchor: a ? a.getAttribute('href').replace(/^#/, '') : '', note: em ? em.textContent.trim() : '' };
  });
}
function openQuickPicksDialog(ed, node) {
  if (!node) ensureEditableCaret(ed);
  const bookmark = node ? null : ed.selection.getBookmark(2, true);
  const title = node ? node.querySelector('.quick-picks-title').textContent.trim() : '▾ Quick Picks — Jump to Any Review';
  let rows = quickPicksRowsFromNode(node);
  const headings = headingOptionsFromEditor(ed);
  const body = document.createElement('div');
  const renderRows = () => {
    body.innerHTML = `<div class="field"><label>Box title</label><input type="text" data-title value="${esc(title)}"></div><div data-rows></div>
      <button type="button" class="btn btn-sm" data-add>+ Add row</button>
      ${headings.length ? '' : '<p class="hint" style="margin-top:8px">Add H2/H3 headings first so you can link a row to a section.</p>'}`;
    const rowsEl = $('[data-rows]', body);
    rowsEl.innerHTML = rows.map((r, i) => `<div class="qp-row"><div class="anchor"><label>Text</label><input type="text" data-t="${i}" value="${esc(r.text)}" placeholder="Product name"></div>
      <div><label>Jumps to</label><select data-a="${i}"><option value="">— none —</option>${headings.map((h) => `<option value="${esc(h.id)}" ${r.anchor === h.id ? 'selected' : ''}>${esc(h.text)}</option>`).join('')}</select></div>
      <div><label>Note</label><input type="text" data-n="${i}" value="${esc(r.note)}" placeholder="Best overall"></div>
      <button type="button" class="btn btn-sm btn-danger" data-rm="${i}">✕</button></div>`).join('');
    rowsEl.querySelectorAll('[data-t]').forEach((i) => i.oninput = () => rows[+i.dataset.t].text = i.value);
    rowsEl.querySelectorAll('[data-a]').forEach((i) => i.onchange = () => rows[+i.dataset.a].anchor = i.value);
    rowsEl.querySelectorAll('[data-n]').forEach((i) => i.oninput = () => rows[+i.dataset.n].note = i.value);
    rowsEl.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { rows.splice(+b.dataset.rm, 1); renderRows(); });
    $('[data-add]', body).onclick = () => { rows.push({ text: '', anchor: '', note: '' }); renderRows(); };
  };
  renderRows();
  openModal({
    title: node ? 'Edit Quick Picks' : 'Quick Picks list', wide: true, body,
    actions: [{ label: 'Cancel' }, { label: node ? 'Save' : 'Insert', primary: true, onClick: (close) => {
      const data = { title: $('[data-title]', body).value.trim(), rows: rows.filter((r) => r.text) };
      if (!data.rows.length) { toast('Add at least one row.', { err: true }); return; }
      close(); replaceOrInsert(ed, node, wrapWidget(widgetHtml('quick-picks', data), 'quick-picks'), bookmark);
    } }],
  });
}

/* ------------------------------------------------------------------ */
route();
