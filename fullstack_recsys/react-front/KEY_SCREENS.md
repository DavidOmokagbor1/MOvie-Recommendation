# Key Screens Spec (Apple TV–Style)

Layout and structure for Home, Detail, and Search. Implement in React to match this spec.

---

## 1. Home

### Structure
- **Header (minimal):** Logo/brand, primary CTA (e.g. RECOMMEND), model selector, search entry. Optional: glass bar with `--blur-glass`.
- **Hero (one):** Full-width, single featured item. Height: ~40vh (e.g. 360px min). Content: background image (backdrop or poster), bottom-aligned gradient overlay, title (--font-size-hero), subtitle (genre or tagline), primary CTA button (e.g. "Get recommendations" or "Info").
- **Rails (2–3):** Each rail = section title (--font-size-section) + horizontal scroll row of cards.
  - Rail 1: **Trending** — `trendingMovies`.
  - Rail 2: **Recommended for you** — `recommended` (after user gets recommendations).
  - Rail 3: **Available to browse** — `candidatesShow` (capped e.g. 12–24), or "Continue browsing".

### Layout
- Hero: full viewport width, no side padding. Content padding bottom/left (e.g. --space-32).
- Rails: container max-width e.g. 1800px, horizontal padding --space-24. Gap between rails: --space-32.
- Card in rail: width ~160–180px, gap between cards ~--space-16. Cards scroll horizontally (overflow-x: auto), no vertical scroll for the rail itself.

### Focus / keyboard
- Tab order: header (logo, CTA, model, search) → hero CTA → rail 1 cards → rail 2 cards → rail 3 cards.
- Within a rail: Arrow Left/Right moves focus between cards; Enter opens detail (or triggers action).
- Optional: Arrow Up/Down moves between rails.

---

## 2. Detail

### Structure
- Full-bleed backdrop image (from details API), with gradient overlay for readability.
- Content over overlay: title (large), metadata row (genre, year, certification if available), short synopsis (2–3 lines), primary CTA: "Get recommendations" (adds to selection and/or opens recommend flow).
- Optional: Close button (top-right); Escape closes and returns focus to trigger element.

### Layout
- Modal or full-page overlay. If modal: max-width 900px, centered, rounded corners (--radius-lg), glass background (--blur-glass-strong).
- Backdrop: object-fit cover, full area behind content.
- Typography: title --font-size-hero or larger, body --font-size-body, metadata --color-text-secondary.

### Focus
- On open: focus primary CTA or first focusable element.
- Tab: cycles through CTA, close, any other links.
- Escape: close and restore focus to element that opened detail.

---

## 3. Search

### Structure
- Search bar at top (full width or centered, max-width ~600px). Input + search button; optional genre/title toggle (existing searchKey).
- Results: one horizontal rail or grid of FocusableCards. Same card style as Home rails.
- Empty state: message when no query or no results (e.g. "Search by title or genre").

### Layout
- Results use same rail layout as Home (horizontal scroll, same card size and gap).
- Padding consistent with Home (--space-24).

### Focus
- On open/search view: focus search input.
- After results: Arrow keys move between cards; Enter opens detail.
- Escape: clear search or exit search view and return focus to previous element.

---

## 4. Focus ring (global)

- All interactive elements (cards, buttons, inputs) use same focus style: visible ring/outline `--color-focus-ring`, 2–3px, offset 2px. No focus outline removal without a visible replacement.
- Respect `prefers-reduced-motion`: use shorter or no transitions when set.
