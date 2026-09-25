'use strict';
const fs = require('fs');
const path = require('path');
const P = require('./paths');
const U = require('./util');
const { fromBuffer, imageSize } = require('./imagesize');

let sharp = null;
try { sharp = require('sharp'); } catch (e) { /* optional - images are then saved as they are */ }

const ALLOWED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);
const MAX_WIDTH = 1600;

function looksLikeSvg(buf) { return /^\s*(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(buf.slice(0, 400).toString('utf8')); }

function uniqueName(base, ext) {
  let name = base + ext, n = 2;
  while (U.exists(path.join(P.IMAGES, name))) name = `${base}-${n++}${ext}`;
  return name;
}

/* Save an uploaded image into /images. PNG/JPG are converted to WebP (like the rest of the site's images). */
async function saveImage(buffer, originalName, preferredBase) {
  let ext = path.extname(originalName || '').toLowerCase();
  if (ext === '.jpeg') ext = '.jpg';
  const sniff = fromBuffer(buffer);
  if (!ALLOWED.has(ext) || (!sniff && !(ext === '.svg' && looksLikeSvg(buffer)))) {
    throw new Error('Only JPG, PNG, WebP, GIF, SVG or AVIF images can be uploaded.');
  }
  let base = U.slugify(preferredBase || path.parse(originalName || 'image').name, 70) || 'image';
  let out = buffer;
  let dims = sniff;

  if (sharp && ext !== '.svg' && ext !== '.gif') {
    try {
      const meta = await sharp(buffer).metadata();
      const animated = (meta.pages || 1) > 1;
      const convert = ['.jpg', '.png', '.avif'].includes(ext);
      const tooWide = meta.width > MAX_WIDTH;
      if (!animated && (convert || tooWide)) {
        let pipe = sharp(buffer).rotate();
        if (tooWide) pipe = pipe.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        const converted = await pipe.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
        if (convert || converted.data.length < buffer.length) {
          out = converted.data; ext = '.webp';
          dims = { width: converted.info.width, height: converted.info.height };
        }
      }
    } catch (e) { /* keep the original bytes */ }
  }
  U.ensureDir(P.IMAGES);
  const name = uniqueName(base, ext);
  fs.writeFileSync(path.join(P.IMAGES, name), out);
  return { name, src: '/images/' + name, size: out.length, width: dims && dims.width, height: dims && dims.height, converted: ext === '.webp' && !/\.webp$/i.test(originalName || '') };
}

function listImages() {
  const out = [];
  const walk = (dir, rel) => {
    if (!U.exists(dir)) return;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.')) continue;
      if (ent.isDirectory()) { walk(path.join(dir, ent.name), rel + ent.name + '/'); continue; }
      if (!ALLOWED.has(path.extname(ent.name).toLowerCase())) continue;
      const st = fs.statSync(path.join(dir, ent.name));
      out.push({ name: rel + ent.name, src: '/images/' + rel + ent.name, size: st.size, mtime: st.mtimeMs });
    }
  };
  walk(P.IMAGES, '');
  return out.sort((a, b) => b.mtime - a.mtime);
}

/* Google Docs sometimes pastes images as base64 - save them as real files. */
async function inlineDataImages(html, baseName) {
  const re = /(<img\b[^>]*?\bsrc=")data:image\/([a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)(")/gi;
  const jobs = [];
  html.replace(re, (m, pre, type, b64, post) => { jobs.push({ m, pre, type, b64, post }); return m; });
  for (const j of jobs) {
    try {
      const ext = '.' + (j.type === 'jpeg' ? 'jpg' : j.type.replace('svg+xml', 'svg'));
      const saved = await saveImage(Buffer.from(j.b64.replace(/\s+/g, ''), 'base64'), 'x' + ext, `${baseName || 'post'}-image`);
      html = html.split(j.m).join(j.pre + saved.src + j.post);
    } catch (e) { /* leave it; the publish check will warn */ }
  }
  return html;
}

module.exports = { saveImage, listImages, inlineDataImages, imageSize, hasSharp: () => !!sharp };
