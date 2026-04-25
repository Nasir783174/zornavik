/* ============================================================
   ZORNAVIK.ME — Blog Registry
   ============================================================
   এখানে শুধু তোমার blog গুলোর info লিখবে।
   বাকি সব automatically হবে — home page, category page সব।

   প্রতিটা blog এর জন্য এই format follow করো:

   {
     title:       "Blog এর title",
     slug:        "blogs/তোমার-file-name.html",   ← blogs/ folder এর ভেতরে যে file upload করবে
     date:        "2026-04-25",                    ← YYYY-MM-DD format
     excerpt:     "Blog এর short description (2-3 line)",
     readTime:    10,                              ← কত মিনিটে পড়া যাবে (সংখ্যা)
     category:    "vacuums-for-floors",            ← নিচে category list দেখো
     subcategory: "best-for-carpet",              ← নিচে subcategory list দেখো
   },

   ─── CATEGORY ও SUBCATEGORY LIST ───────────────────────────

   category: "vacuums-for-floors"
     subcategory options:
       "best-for-hardwood"      → Best for Hardwood Floors
       "best-for-carpet"        → Best for Carpet
       "best-for-tile"          → Best for Tile Floors
       "best-for-mixed"         → Best for Mixed Flooring

   category: "cleaning-needs"
     subcategory options:
       "pet-hair"               → Best for Pet Hair
       "cordless"               → Best Cordless Vacuums
       "robot"                  → Best Robot Vacuums
       "handheld"               → Best Handheld Vacuums
       "upright"                → Best Upright Vacuums

   category: "by-home-type"
     subcategory options:
       "apartments"             → For Apartments
       "large-homes"            → For Large Homes
       "pet-owners"             → For Pet Owners
       "allergy-sufferers"      → For Allergy Sufferers

   ──────────────────────────────────────────────────────────── */

const BlogRegistry = [

  {
    title:       "Best 10 Cordless Vacuum Cleaners of 2026",
    slug:        "blogs/best-cordless-vacuum-cleaners.html",
    date:        "2026-04-01",
    excerpt:     "Industry reports show cordless vacuums now account for over half of global vacuum sales. We tested and ranked the top 10 models — from the Dyson Gen5 Detect to the Samsung Bespoke Jet AI Ultra — so you don't have to.",
    readTime:    12,
    category:    "cleaning-needs",
    subcategory: "cordless",
  },

  {
    title:       "Top 5 Best Vacuums for Pet Hair in 2026",
    slug:        "blogs/best-vacuums-pet-hair-2026.html",
    date:        "2026-03-28",
    excerpt:     "Pet hair gets everywhere — into carpets, corners, and curtains. We break down the 5 best vacuums that tackle fur, dander, and odor in real homes with real pets, from the Dyson Ball Animal 3 to the Miele Classic C1 Cat & Dog.",
    readTime:    9,
    category:    "cleaning-needs",
    subcategory: "pet-hair",
  },

  {
    title:       "Best Handheld Vacuum in 2026 — Top 5 Picks",
    slug:        "blogs/best-handheld-vacuum-2026.html",
    date:        "2026-03-20",
    excerpt:     "Handheld vacuums have transformed from weak, noisy afterthoughts into powerful spot-cleaners. Our top 5 picks — including the Black+Decker Dustbuster AdvancedClean+ and the featherlight Shark Wandvac — cover every use case and budget.",
    readTime:    8,
    category:    "cleaning-needs",
    subcategory: "handheld",
  },

  {
    title:       "Best Robot Vacuum and Mop Combos of 2026",
    slug:        "blogs/best-robot-vacuum-mop-2026.html",
    date:        "2026-03-15",
    excerpt:     "Robot vacuum mop combos are no longer basic cleaning tools — they're smart home appliances. We compare the Dreame X60 Max Ultra, Roborock Saros 20, Ecovacs Deebot X8 Pro Omni, and more to find the best hands-free cleaner for your home.",
    readTime:    11,
    category:    "cleaning-needs",
    subcategory: "robot",
  },

  {
    title:       "Best Vacuum for Hardwood Floors — 7 Top Picks",
    slug:        "blogs/best-vacuum-hardwood-floors.html",
    date:        "2026-03-10",
    excerpt:     "Hardwood floors reveal dust nobody else sees. A good vacuum for wood needs the right brush, controlled suction, and a sealed filter. We test 7 vacuums — from the Dyson V15 Detect to the SEBO Airbelt K3 — to find the safest, cleanest results.",
    readTime:    10,
    category:    "vacuums-for-floors",
    subcategory: "best-for-hardwood",
  },

  {
    title:       "Best Roomba for Pet Hair in 2026 — Top 5 Ranked",
    slug:        "blogs/best-roomba-pet-hair-2026.html",
    date:        "2026-03-05",
    excerpt:     "Not all Roombas handle pet hair equally. From the flagship Combo 10 Max with its self-washing dock to the budget-friendly i3+ EVO, we rank the 5 best models for shedding pets, carpet performance, and real-world automation.",
    readTime:    9,
    category:    "cleaning-needs",
    subcategory: "robot",
  },

  {
    title:       "Best Dyson Cordless Vacuum — Which Model Is Right for You?",
    slug:        "blogs/best-dyson-cordless-vacuum.html",
    date:        "2026-02-28",
    excerpt:     "The Dyson lineup is vast and confusing. V12 vs V15 vs Gen5detect vs V15s Submarine — what's actually different? We break down each model's real-world strengths, laser tech, suction, and who each one is best suited for in 2026.",
    readTime:    13,
    category:    "cleaning-needs",
    subcategory: "cordless",
  },

  {
    title:       "Best Upright Vacuum of 2026 — 5 Models Compared",
    slug:        "blogs/best-upright-vacuum-2026.html",
    date:        "2026-02-20",
    excerpt:     "Upright vacuums still dominate deep carpet cleaning. We tested the Shark Stratos, Dyson Ball Animal 3, Shark Navigator, Kenmore Intuition Bagged, and Bissell Pet Hair Eraser Turbo across real homes to find the best balance of power, maintenance, and value.",
    readTime:    11,
    category:    "cleaning-needs",
    subcategory: "upright",
  },

  {
    title:       "Best Bissell Vacuum Cleaners in 2026 — Full Lineup Guide",
    slug:        "blogs/best-bissell-vacuums-2026.html",
    date:        "2026-02-14",
    excerpt:     "Bissell focuses on task-specific cleaning — and that's its biggest advantage. From the portable Little Green Carpet Cleaner to the SpinWave R5 robot mop, we walk through the top 5 Bissell models and help you find the one that fits your real cleaning habits.",
    readTime:    8,
    category:    "cleaning-needs",
    subcategory: "upright",
  },

  {
    title:       "Best Lightweight Vacuum in 2026 — 5 Picks That Won't Tire You Out",
    slug:        "blogs/best-lightweight-vacuum.html",
    date:        "2026-02-07",
    excerpt:     "Cleaning shouldn't feel like a workout. We compare five lightweight vacuums — including the Dyson V12 Detect Slim, the budget-friendly Levoit LVAC-200, and the self-emptying Tineco Pure One Station — to find the best balance of comfort, suction, and smart features.",
    readTime:    9,
    category:    "vacuums-for-floors",
    subcategory: "best-for-carpet",
  },

];

/* ============================================================
   নিচের কোড touch করো না — এটা automatically সব কিছু করে
   ============================================================ */

const CategoryMeta = {
  "vacuums-for-floors": {
    label: "Vacuums for Floors",
    subcategories: {
      "best-for-hardwood": "Best for Hardwood Floors",
      "best-for-carpet":   "Best for Carpet",
      "best-for-tile":     "Best for Tile Floors",
      "best-for-mixed":    "Best for Mixed Flooring",
    }
  },
  "cleaning-needs": {
    label: "Cleaning Needs",
    subcategories: {
      "pet-hair":  "Best for Pet Hair",
      "cordless":  "Best Cordless Vacuums",
      "robot":     "Best Robot Vacuums",
      "handheld":  "Best Handheld Vacuums",
      "upright":   "Best Upright Vacuums",
    }
  },
  "by-home-type": {
    label: "By Home Type",
    subcategories: {
      "apartments":        "For Apartments",
      "large-homes":       "For Large Homes",
      "pet-owners":        "For Pet Owners",
      "allergy-sufferers": "For Allergy Sufferers",
    }
  },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildPostCard(post, rootPath = '') {
  const placeholderSVG = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  const catMeta   = CategoryMeta[post.category];
  const subLabel  = catMeta ? catMeta.subcategories[post.subcategory] || post.subcategory : post.subcategory;
  const href      = rootPath + post.slug;

  return `
<article class="post-card" itemscope itemtype="https://schema.org/BlogPosting">
  <a href="${href}" class="post-card__image" aria-label="${post.title} — read more">
    <div class="post-card__image-placeholder">
      ${placeholderSVG}
      <span>Image coming soon</span>
    </div>
  </a>
  <div class="post-card__body">
    <div class="post-card__meta">
      <span class="post-card__category">${subLabel}</span>
      <time class="post-card__date" datetime="${post.date}" itemprop="datePublished">${formatDate(post.date)}</time>
    </div>
    <h2 class="post-card__title" itemprop="headline">
      <a href="${href}">${post.title}</a>
    </h2>
    <p class="post-card__excerpt" itemprop="description">${post.excerpt}</p>
    <div class="post-card__footer">
      <div class="post-card__author">
        <div class="post-card__avatar" aria-hidden="true">LA</div>
        <span class="post-card__author-name" itemprop="author">Liam A. Foster</span>
      </div>
      <span class="post-card__read-time">${post.readTime} min read</span>
    </div>
  </div>
</article>`;
}

function renderBlogGrid(containerId, posts, rootPath = '') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  grid.innerHTML = sorted.map(p => buildPostCard(p, rootPath)).join('');
}
