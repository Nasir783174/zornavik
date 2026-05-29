/* =============================================
   zornavik.me — Blog Registry
   Single source of truth for all posts.
   ============================================= */

const BLOG_REGISTRY = [
  {
    title:    "Best 10 Cordless Vacuum Cleaners of 2026",
    slug:     "/blog/best-cordless-vacuum-cleaners",
    date:     "2026-01-10",
    excerpt:  "Compare the top 10 cordless vacuum cleaners of 2026. Expert-tested for suction, runtime, filtration & pet hair. Find the best cordless vacuum for your home.",
    readTime: 18,
    category: "cordless-stick-vacuums",
    catLabel: "Cordless Stick Vacuums",
    image:    "/images/cordless-vacuum-cleaners/cordless-vacuum-cleaners.webp",
  },
  {
    title:    "Top 5 Best Vacuums for Pet Hair in 2026",
    slug:     "/blog/best-vacuums-for-pet-hair",
    date:     "2026-01-15",
    excerpt:  "Expert-picked top 5 vacuums for pet hair in 2026. Tested for fur removal, dander filtration & odor control. Find the right vacuum for your pet home.",
    readTime: 14,
    category: "vacuums",
    catLabel: "Vacuums",
    image:    "/images/dyson-ball-animal-3.webp",
  },
  {
    title:    "Best Handheld Vacuums of 2026: Top 5 Picks",
    slug:     "/blog/best-handheld-vacuums",
    date:     "2026-01-20",
    excerpt:  "Compare the 5 best handheld vacuums of 2026 for cars, pet hair & quick cleanups. Real specs, honest pros & cons from a 12-year vacuum industry expert.",
    readTime: 12,
    category: "vacuums",
    catLabel: "Vacuums",
    image:    "/images/black-decker-pivot-max.webp",
  },
  {
    title:    "Best Robot Vacuum and Mop Combos of 2026",
    slug:     "/blog/best-robot-vacuum-mop",
    date:     "2026-02-01",
    excerpt:  "Top 5 robot vacuum and mop combos of 2026 reviewed. Compare smart navigation, mopping systems & self-cleaning docks to find the best robot cleaner for your home.",
    readTime: 16,
    category: "robot-vacuums",
    catLabel: "Robot Vacuums",
    image:    "/images/dreame-x60-max-ultra.webp",
  },
  {
    title:    "Best Vacuums for Hardwood Floors in 2026",
    slug:     "/blog/best-vacuum-for-hardwood-floors",
    date:     "2026-02-10",
    excerpt:  "Top 7 vacuums for hardwood floors tested in 2026. Soft rollers, scratch-free designs & fine dust capture. Find the best vacuum for your wood floors.",
    readTime: 15,
    category: "vacuums",
    catLabel: "Vacuums",
    image:    "/images/cordless-vacuum-cleaners/dyson-v15-detect.webp",
  },
  {
    title:    "Best Roomba for Pet Hair in 2026: Top 5 Picks",
    slug:     "/blog/best-roomba-for-pet-hair",
    date:     "2026-02-15",
    excerpt:  "Compare the 5 best Roombas for pet hair in 2026. Real-world brush performance, maintenance costs & smart mapping reviewed by a vacuum industry expert.",
    readTime: 17,
    category: "robot-vacuums",
    catLabel: "Robot Vacuums",
    image:    "/images/roomba-combo-10-max.webp",
  },
  {
    title:    "Best Dyson Cordless Vacuum of 2026: Top 5 Ranked",
    slug:     "/blog/best-dyson-cordless-vacuum",
    date:     "2026-03-01",
    excerpt:  "All 5 Dyson cordless vacuums ranked for 2026. Honest runtime data, real suction comparisons & the best Dyson model for your home size and cleaning needs.",
    readTime: 19,
    category: "cordless-stick-vacuums",
    catLabel: "Cordless Stick Vacuums",
    image:    "/images/cordless-vacuum-cleaners/dyson-v15-detect.webp",
  },
  {
    title:    "Best Upright Vacuums of 2026: Top 5 Reviewed",
    slug:     "/blog/best-upright-vacuum",
    date:     "2026-03-10",
    excerpt:  "Top 5 upright vacuums of 2026 tested for pet hair, deep carpet cleaning & HEPA filtration. Compare weight, suction & maintenance to find your best pick.",
    readTime: 16,
    category: "vacuums",
    catLabel: "Vacuums",
    image:    "/images/shark-stratos-upright.webp",
  },
  {
    title:    "Best Bissell Vacuums of 2026: 5 Top Models Reviewed",
    slug:     "/blog/best-bissell-vacuum",
    date:     "2026-03-20",
    excerpt:  "Top 5 Bissell vacuums of 2026 reviewed for pet hair, carpet cleaning & hard floors. Honest analysis by a 12-year vacuum industry expert.",
    readTime: 13,
    category: "vacuums",
    catLabel: "Vacuums",
    image:    "/images/bissell-little-green-portable-carpet-cleaner.webp",
  },
  {
    title:    "Best Lightweight Vacuums of 2026: Top 5 Picks",
    slug:     "/blog/best-lightweight-vacuum",
    date:     "2026-04-01",
    excerpt:  "The 5 best lightweight vacuums of 2026 ranked by real weight, battery life & cleaning power. Find the easiest cordless vacuum for daily fatigue-free cleaning.",
    readTime: 14,
    category: "cordless-stick-vacuums",
    catLabel: "Cordless Stick Vacuums",
    image:    "/images/cordless-vacuum-cleaners/dyson-v12-detect-slim.webp",
  },
];

/* ---- Utilities ---- */

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildPostCard(post) {
  return `
  <article class="post-card">
    <a href="${post.slug}" class="post-card-img">
      <img src="${post.image}" alt="${post.title}" loading="lazy">
    </a>
    <div class="post-card-body">
      <span class="post-cat">${post.catLabel}</span>
      <a href="${post.slug}"><h2 class="post-title">${post.title}</h2></a>
      <p class="post-excerpt">${post.excerpt}</p>
      <span class="post-meta">${formatDate(post.date)} &middot; ${post.readTime} min read</span>
    </div>
  </article>`;
}

function buildPagination(currentPage, totalPages, baseUrl) {
  let html = `<div class="pagination">`;
  html += `<a href="${currentPage > 1 ? baseUrl + (currentPage - 1 === 1 ? '' : '/page-' + (currentPage - 1)) : '#'}" class="page-btn${currentPage === 1 ? ' disabled' : ''}">&#8592;</a>`;
  for (let i = 1; i <= totalPages; i++) {
    const url = i === 1 ? baseUrl : `${baseUrl}/page-${i}`;
    html += `<a href="${url}" class="page-btn${i === currentPage ? ' active' : ''}">${i}</a>`;
  }
  html += `<a href="${currentPage < totalPages ? baseUrl + '/page-' + (currentPage + 1) : '#'}" class="page-btn${currentPage === totalPages ? ' disabled' : ''}">&#8594;</a>`;
  html += `</div>`;
  return html;
}

/* ---- Render grid into a container ---- */
function renderGrid(containerId, posts) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = posts.map(buildPostCard).join('');
}
