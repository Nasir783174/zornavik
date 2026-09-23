'use strict';
const path = require('path');

const CMS = path.resolve(__dirname, '..');          // .../zornavik-main/cms
const ROOT = path.resolve(CMS, '..');               // .../zornavik-main  (the website)

module.exports = {
  CMS,
  ROOT,
  DATA: path.join(CMS, 'data'),
  POSTS: path.join(CMS, 'data', 'posts'),
  TRASH: path.join(CMS, 'data', 'trash'),
  SETTINGS_FILE: path.join(CMS, 'data', 'settings.json'),
  CATEGORIES_FILE: path.join(CMS, 'data', 'categories.json'),
  IMAGES: path.join(ROOT, 'images'),
  REGISTRY: path.join(ROOT, 'js', 'registry.js'),
  SITEMAP: path.join(ROOT, 'sitemap.xml'),
  VERCEL: path.join(ROOT, 'vercel.json'),
  PUBLIC: path.join(CMS, 'public'),
};
