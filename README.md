# Zornavik — Affiliate Blog Site

A clean, SEO-friendly, fully static affiliate blog for vacuum cleaner reviews.  
**No frameworks. No build tools. Pure HTML + CSS + JavaScript.**

---

## 📁 Folder Structure

```
zornavik/
├── index.html          ← Home page
├── blog.html           ← Single post page
├── category.html       ← Category archive page
├── posts.json          ← ⭐ YOUR MASTER CONTENT FILE
├── robots.txt
├── vercel.json         ← Vercel routing config
├── css/
│   └── style.css       ← All styles (global)
├── js/
│   ├── layout.js       ← Header + footer injector
│   └── main.js         ← Blog loader, markdown parser, pagination
├── blogs/
│   └── vacuum.md       ← Example blog post (markdown)
└── pages/
    ├── about.html
    ├── contact.html
    ├── privacy.html
    ├── disclaimer.html
    └── terms.html
```

---

## ✍️ How to Add a New Blog Post

### Step 1 — Write your post in Markdown
Create a `.md` file inside the `/blogs/` folder.  
Example: `/blogs/best-robot-vacuums.md`

Markdown supports: headings, paragraphs, bold/italic, tables, bullet lists, numbered lists, blockquotes, images, links, inline code, code blocks, and horizontal rules.

### Step 2 — Add an entry to `posts.json`
Open `posts.json` and add a new object to the array:

```json
{
  "title": "Best Robot Vacuums of 2026",
  "slug": "best-robot-vacuums-2026",
  "file": "/blogs/best-robot-vacuums.md",
  "category": "Best",
  "category_slug": "best",
  "excerpt": "A short 1–2 sentence description shown on the card.",
  "thumbnail": "/images/robot-vacuums.jpg",
  "date": "2026-04-20"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | ✅ | Shown on card and post header |
| `slug` | ✅ | URL-safe, unique identifier |
| `file` | ✅ | Path to your `.md` file |
| `category` | ✅ | Display name (e.g. "Best", "Reviews") |
| `category_slug` | ✅ | URL-safe version (e.g. "best", "reviews") |
| `excerpt` | Recommended | Card preview text |
| `thumbnail` | Optional | Card image (16:9 ratio recommended) |
| `date` | Recommended | ISO format: `YYYY-MM-DD` |

### Step 3 — Deploy
Push to GitHub → Vercel auto-deploys. Done! ✅

---

## 🗂️ How Categories Work

- Categories are **auto-generated** from `posts.json`
- Any unique `category_slug` in your posts creates a category page
- The header nav updates automatically — no code changes needed
- URL format: `/category.html?cat=best`

To add a new category, just use a new `category` + `category_slug` in your post entry.

---

## 🚀 Deploy to Vercel

1. Upload this folder to a **GitHub repository**
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Framework Preset: **Other**
5. Root Directory: `/` (or wherever you placed the files)
6. Click **Deploy**

No build command needed. No install command needed. It's just static files.

---

## 🖼️ Adding Thumbnail Images

1. Create an `/images/` folder in the root
2. Add your image (JPG/WebP recommended, 16:9 ratio, ~800px wide)
3. Reference it in `posts.json` as `"thumbnail": "/images/your-image.jpg"`

---

## ➕ Adding More Pages

To add a new static page (e.g. a "Reviews" landing page):
1. Copy any page from `/pages/` as a template
2. Edit the content
3. Link to it from the footer in `js/layout.js`

---

## 🎨 Customization

All colors, fonts, and spacing are controlled via CSS variables at the top of `css/style.css`:

```css
:root {
  --accent: #c8622a;       /* Main brand color */
  --font-display: 'Playfair Display', ...;
  --font-body: 'Source Serif 4', ...;
  /* etc. */
}
```

---

## 📦 No Dependencies

- Zero npm packages
- Zero build steps  
- Google Fonts loaded via CSS `@import`
- Markdown parsed by a built-in lightweight parser in `main.js`
