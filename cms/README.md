# Zornavik Studio - local blog CMS

A small local editor that lives inside your website folder. You write a post here,
hit Publish, and it writes a real `.html` file straight into `zornavik-main/`, updates
the homepage/blog/category listings, the sitemap, and (when a URL changes) adds a
redirect. You then push to GitHub and Vercel deploys it, exactly like before.

This tool never talks to the internet and is never deployed. `.vercelignore` already
excludes the whole `cms/` folder from your Vercel deployment.

## First-time setup

```bash
cd zornavik-main/cms
npm install
npm start
```

This opens two local servers:

- **`http://localhost:3000`** - the dashboard (Studio). This is what you open every day.
- **`http://localhost:3001`** - a live preview of your actual website files, so
  "View" and "Preview" links work exactly like the real site.

Leave the terminal running while you write. Stop it any time with `Ctrl+C`.

If port 3000 or 3001 is already taken by something else on your computer:

```bash
PORT=3100 SITE_PORT=3101 npm start
```

## Everyday use

1. **Add new post** → write your title, paste your draft (from Google Docs, Word,
   anywhere), pick a category.
2. Use **+ Block** in the toolbar to drop in the pieces that need special styling:
   **Quick Picks list**, **Pros & Cons**, **Specs box**, **Check Price button**.
   Double-click any of these once inserted to edit it again.
3. Fill in the right-hand sidebar: **Category**, **Featured image**, **Excerpt**,
   **Meta title / description**, **Canonical URL** (only needed if this content
   also lives somewhere else), and the **Checklist** panel to see what's still
   missing.
4. Click **Preview** any time to see it rendered with your real site's CSS. Click
   **Publish** when you're happy - that's the moment a file is written into your
   website folder and the listing pages/sitemap are updated.
5. Back in VS Code: `git add -A`, `git commit -m "New post: <title>"`, `git push`.
   Vercel takes it from there.

To edit a post later, open it from the **Posts** list. Editing and republishing a
live post updates the existing page in place - it does not create a duplicate.
Changing a post's slug or category moves it to the new URL and automatically adds
a redirect from the old one, so you never lose SEO on an old link.

Deleting a post ("Move to trash") removes its live page from your site folder but
keeps a JSON backup in `cms/data/trash/` in case you want it back - that folder is
never cleaned up automatically, so clear it out yourself once you're sure.

## Categories

**Categories** in the left rail lets you add a new category (it gets its own page
and is added to the menu on every page automatically), or edit an existing one's
heading/intro/meta text. A category can only be deleted once it has no posts left
in it.

## Media

Every image in your `images/` folder shows up under **Media**. Uploading a new
JPG or PNG there (or from inside a post) automatically converts it to WebP, same
as the images already on your site, and drops it straight into `images/`.

## Settings

Your author bio/photo, the affiliate disclosure text, site name/URL, and how many
posts show per page - set once, used on every post.

## The 10 posts that already existed

Your original 10 reviews are untouched and still show up in the Posts list,
labeled "Existing page." They were written by hand and aren't tracked by the CMS,
so edit their HTML directly in VS Code as before. Anything you create from here on
is a normal CMS post you can edit, unpublish, or delete from the dashboard.

## If something looks off

- **"Port already in use"** - another `npm start` is probably still running
  somewhere; close it, or use the `PORT=... SITE_PORT=...` command above.
- **A page 404s after publishing** - click **Rebuild site pages** at the bottom of
  the sidebar; it regenerates the homepage, blog, and category pages and the
  sitemap from scratch.
- Nothing here ever touches Vercel or the internet directly - if a page looks
  wrong, it's a file sitting right there in your website folder, and pushing to
  GitHub is still the only way it goes live.
