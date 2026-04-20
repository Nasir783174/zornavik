# Zornavik

Honest vacuum cleaner reviews and buying guides — built with vanilla HTML, CSS, and JavaScript.

## Structure

```
zornavik/
├── index.html                        ← Homepage (paginated blog grid)
├── category-best.html                ← Best category
├── category-brand.html               ← Brand category
├── category-budget.html              ← Budget category
├── category-guides.html              ← Guides category
├── category-accessories.html         ← Accessories category
├── blog-best-cordless-vacuums-2026.html ← Demo blog post
├── about.html
├── contact.html
├── privacy.html
├── disclaimer.html
├── terms.html
├── style.css                         ← Global styles (homepage + category pages)
├── style1.css                        ← Blog post styles (all tags styled globally)
├── components.js                     ← Shared nav toggle + active link logic
├── vercel.json                       ← Vercel deployment config
└── README.md
```

## Adding a New Blog Post

1. Create `your-post-slug.html` using `style1.css`
2. Add a post object to the `posts` array in `index.html`
3. Add the same post object to the matching category page's `allPosts` array
4. Done — pagination and category filtering are automatic

## Deploy

Push to GitHub, connect the repo to Vercel, and deploy. No build step required.
