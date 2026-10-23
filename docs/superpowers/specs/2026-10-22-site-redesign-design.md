# xydinesh.com redesign: Nat Eliason blueprint, calm-minimal style

Date: 2026-10-22
Status: Approved in brainstorming, pending written-spec review
Inputs: `wip.txt` (ux-design-reviewer analysis of nateliason.com/notes; software-architect recommendation)

## 1. Goal

Make xydinesh.com structurally follow Nat Eliason's site (https://nateliason.com/notes):
a top nav with separate sections, book notes shown as cover cards with
categories and a one-line take, sort controls, and a `finished:` line at the
top of each note. It should look like the user's own site, not a copy of Nat's.

Success means:
- `/notes/` reads like Nat's notes index: a cover grid, sortable by date read, title and rating.
- Every note page opens with its cover, author, categories and finished date.
- Adding a book is still one Markdown file plus `npm run covers`.
- Every existing URL (`/posts/<slug>/`, `/tags/<tag>/`) keeps working.

## 2. Decisions made

| Topic | Decision |
|---|---|
| Scope | Whole site. Replace the Topics sidebar with a top nav: notes / writing / now. Books get Nat-style cards. Writing and now are text-first. |
| Ratings | Private `rating`, an integer from 1 to 10, used only for sorting. It is never rendered as visible text. Exposing the raw value in a `data-rating` attribute is acceptable. |
| URLs | `/notes/<slug>/`, `/writing/<slug>/`, `/now/<slug>/`. Old `/posts/<slug>/` and `/tags/<tag>/` URLs redirect through generated stub pages. |
| Visual style | "C". Calm and minimal on a white background. IBM Plex Sans for body text, IBM Plex Mono for metadata (tags, dates, `finished:`, sort controls). One vermilion accent. Tags are lowercase with a `#` prefix. Dates are ISO everywhere. |
| Nav identity | "Dinesh Weerapura" on the left, `notes · writing · now` on the right. No About link. |
| Homepage | A short intro written by the user, then three lists: recent notes, writing, now. |
| Canonical URL | `https://xydinesh.com` |
| Dark mode | Not in v1. The CSS tokens make adding it later a small change. |
| CSS framework | Drop Pico. Use one hand-written `site.css`. |
| Category filter | Deferred until the library has about 12 or more books. |

## 3. Content model

### 3.1 Directories

```
src/
  index.njk  notes.njk  writing.njk  now.njk  404.njk
  notes/    notes.11tydata.js     + 8 book notes (*.md)
  writing/  writing.11tydata.json + 2 essays
  now/      now.11tydata.json     + 4 monthly updates
  redirects/ posts.njk  tags.njk
  _data/    site.js  legacyTags.json
  _includes/ base.njk  note.njk  article.njk  card.njk  entry-list.njk  redirect-page.njk
  assets/   css/site.css  js/notes-sort.js  covers/<slug>.jpg
scripts/    fetch-covers.js  check.js  legacy-urls.txt
```

The index pages (`notes.njk` etc.) live in `src/`, not inside the content
folders. Otherwise they would inherit that folder's directory data (layout,
tag, permalink) and become members of their own collection.

The scaffolds `book-template` and `now_template` are renamed to non-built names
(`_template.md.txt`) and moved into `src/notes/` and `src/now/`. They are
updated to the new front matter.

### 3.2 Directory data

Each folder's data file sets `layout`, `tags: [<section>]` and
`permalink: /<section>/{{ page.fileSlug }}/`. Posts no longer declare
`layout` or `tags`.

`tags` is reserved for section membership. Topical labels go in a separate
`categories` field. This avoids Eleventy creating a collection for every
topic, and avoids tags merging unexpectedly through the data cascade.

`notes.11tydata.js` also computes:
- `description` = `summary`
- `coverUrl` = `/assets/covers/<fileSlug>.jpg` if that file exists, else `null`

### 3.3 Front matter

**Book notes (`src/notes/*.md`):**

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | Book title only |
| `author` | string | yes | Multiple authors are joined with ` & ` |
| `finished` | quoted string `YYYY-MM-DD` | yes | Quoted so YAML keeps it a string. ISO strings sort correctly as text. |
| `summary` | string, ≤ 140 chars | yes | The user's one-line take. Used on cards and as the meta description. |
| `categories` | array of lowercase hyphenated strings, 1–3 | yes | Rendered as `#self-help` |
| `isbn` | string, 13 digits | yes | Used to download the cover |
| `rating` | integer 1–10 | no | Private, used for sorting only. A missing rating sorts last. |
| `legacySlug` | string | no | Only needed when the file was renamed |

**Writing and now (`src/writing/*.md`, `src/now/*.md`):** `title` (required),
`date` (required), `description` (optional, one line), `legacySlug` (optional).

### 3.4 Collections (`.eleventy.js`)

- `notes`, `writing` and `now` come from the directory-data tags.
- `notesByFinished` sorts notes by `data.finished`, newest first. This is the default order on `/notes/` and on the homepage. Notes are never ordered by `date`.
- Writing and now are shown newest first, ordered by `date`.
- `legacy` = all notes, writing and now. It is used only by the redirect generator.
- Remove the `post` and `tagList` collections, `tags.njk` and `post.njk`.
- Add an `isoDate` filter (UTC, `YYYY-MM-DD`).
- Add a passthrough copy that maps `src/assets` to `/assets`.

## 4. Pages and layouts

| File | Responsibility |
|---|---|
| `base.njk` | HTML shell, `<title>`, meta description, canonical (`site.url` + page URL), basic OG tags, font links, `site.css`, header nav with `aria-current` on the active section, `<main>`, footer. |
| `note.njk` | Cover (or a placeholder tile), `h1` title, mono meta rows `by:` / `categories:` / `finished:`, then the body. Never outputs the rating. |
| `article.njk` | `h1`, mono ISO date, body at 65ch. Used by writing and now. |
| `card.njk` | One `<li>` in the notes grid: a link wrapping the cover or tile, title, author, `#categories` (plain text, not links), and the summary. Carries `data-finished`, `data-title` (lowercased) and `data-rating` (0 if missing). |
| `entry-list.njk` | A row list of `date` + `title` + optional `description`, shared by the homepage, `/writing/` and `/now/`. |
| `redirect-page.njk` | A stub page (see §5). |

**Pages:**
- **`/` (homepage):**
  - the intro, using the user's own text
  - the 4 most recent notes (`title – author`, finished date) with a link to all notes
  - the 3 most recent writing posts, with a link to all writing
  - the latest now update, with a link to previous ones
- **`/notes/`:** an `h1` "Book Notes", sort buttons (`date read / title / rating`) and the card grid (`repeat(auto-fill, minmax(160px, 1fr))`).
- **`/writing/`:** an `h1` and an entry list, newest first.
- **`/now/`:** an `h1`, a one-line description, the "latest" entry and a "previously" list.
- **`/404.html`:** a minimal not-found page with the nav.

**Sort (`notes-sort.js`, about 35 lines, loaded with `defer` on `/notes/` only):**
- **Without JavaScript:** the controls render with `hidden`, and the server order is finished date, newest first.
- **Controls:** the script unhides them and reads `?sort=` (`finished` | `title` | `rating`, anything else falls back to `finished`).
- **Ordering:** it re-appends the existing `<li>` nodes in a stable order. Directions are finished newest first, title A–Z, and rating highest first.
- **State:** it marks the active button with `aria-pressed` and writes `?sort=` via `history.replaceState`. The parameter is omitted for the default order.

## 5. URLs and redirects

- **New URLs:** a page's slug is its file name (`page.fileSlug`). Trailing slashes are kept.
- **Old URLs:** the old URL was `/posts/<fileSlug>/`.
  - `src/redirects/posts.njk` paginates `collections.legacy` and writes `/posts/{{ legacySlug or fileSlug }}/index.html`, pointing at `item.url`.
  - `src/redirects/tags.njk` paginates `_data/legacyTags.json` (`books→/notes/`, `writing→/writing/`, `now→/now/`) and writes `/tags/<from>/index.html`.
- **Stub page:** contains `noindex`, a canonical link to `https://xydinesh.com<to>`, a `meta refresh` with delay 0, a `location.replace` that keeps the query and hash, and a plain link as a fallback.
- **Rename:** `exterme-ownership.md` becomes `extreme-ownership.md`, with `legacySlug: exterme-ownership`. No other files are renamed.
- **Collisions:** Eleventy's duplicate-permalink check catches a redirect colliding with a real page.

## 6. Visual system (`src/assets/css/site.css`)

**Tokens on `:root`:**
- `--bg: #fff`
- `--fg: #161616`
- `--muted: #5f5f5f` (≥ 4.5:1 on white)
- `--rule: #e8e8e8`
- `--accent: #d6452f`, for rules, the blockquote border and hover
- `--accent-text: #c93f29`, for small accent text such as tags and meta labels. `#d6452f` is about 4.4:1 on white, just under AA. Check `#c93f29` with a contrast checker during implementation.
- `--font-body: "IBM Plex Sans", system-ui, sans-serif`
- `--font-mono: "IBM Plex Mono", ui-monospace, monospace`
- `--measure: 65ch`, a spacing scale `--s1`…`--s5`, `--cover-ratio: 2/3`

**Base text:** body 17–18px, line-height about 1.6.

**Primitives:**
- `.wrap`, `.prose`, `.grid`
- `.meta`: mono, small, muted
- `.tag`: mono, lowercase, with a `::before` `#` in accent-text
- `.cover`: aspect ratio, `object-fit: cover`, background colour as a fallback
- `.tile`: the typographic placeholder for a missing cover
- `mark`
- `:focus-visible` outlines and a `prefers-reduced-motion` guard

**Fonts:** Google Fonts with `display=swap` and preconnect. Plex Sans 400/500/600 and Plex Mono 400.

The reference look is the style-C mockups in `.superpowers/brainstorm/*/content/visual-style.html` and `pages.html`. These files are local only and not committed.

## 7. Covers

`scripts/fetch-covers.js` (`npm run covers`) uses Node 22's built-in fetch and no dependencies. For each note that has an `isbn` but no cover file:
- It downloads `https://covers.openlibrary.org/b/isbn/<isbn>-L.jpg?default=false` to `src/assets/covers/<fileSlug>.jpg`.
- It fails loudly on a 404 or on a response under 1 KB.

The script is run by hand, and the images are committed. The site build never touches the network.

## 8. Migration (14 posts: 8 notes, 2 writing, 4 now)

1. Build the current site and record every `/posts/*/` and `/tags/*/` URL in `scripts/legacy-urls.txt`.
2. `git mv` each post into its section folder, rename `exterme-ownership.md`, and move or rename the scaffolds.
3. Remove `layout` and `tags` from every post.
4. Remove the hand-typed first line where it matches `Month, YYYY` or `Month YYYY`.
5. For notes, copy `date` into a quoted `finished` and delete `date`.
6. Audit headings. There should be no body `h1` (`february25.md`'s `# Stockholm` becomes `##`) and no skipped levels.
7. Fill `author` and `isbn` (via Open Library search) and draft `categories`. Flag uncertain values in the PR description instead of guessing.
8. Run `npm run covers`.
9. Draft candidate one-liners for `summary`, pulled from each post, and mark them for the user to rewrite.

**Supplied by the user:**
- final `summary` text
- real `finished` dates (the seeded value is the date the post was written)
- `rating` values from 1 to 10
- approval of categories and ISBN editions
- the homepage intro
- one-line `description` values for writing and now posts (optional)

## 9. Verification

**Scripts:**
- `npm run build` runs `eleventy`.
- `npm test` runs `npm run build && node scripts/check.js`.
- `gray-matter` is the only new devDependency.

**Hard failures in `scripts/check.js`:**
1. Each URL in `legacy-urls.txt` has a built `index.html` containing a meta refresh, and the page it points to exists.
2. Every note has all required fields with valid types:
   - `finished` is a real `YYYY-MM-DD` date
   - `summary` is 140 characters or less
   - `categories` is non-empty and lowercase
   - `isbn` is 13 digits
   - `rating`, if present, is an integer from 1 to 10
   - a cover file exists for every `isbn`
3. No post declares `tags` or `layout`.
4. Every internal `href="/…"` and `src="/…"` in `build/**/*.html` resolves to a file or `<dir>/index.html`.

Also do a manual browser check of the homepage, `/notes/` (each sort, and with JS disabled), a note page, `/writing/`, `/now/`, a redirect, 404, and phone width.

## 10. CI (`.github/workflows/static.yml`)

- **Actions:** `actions/checkout@v4`, and `actions/setup-node@v4` with Node 22 and `cache: npm`.
- **Install and test:** `npm ci`, then `npm test`, before `upload-pages-artifact`.
- **Node version:** add `"engines": { "node": ">=22" }` to `package.json`.
- **`.gitignore`:** add `build/` and `.superpowers/`.

## 11. Build order (each step leaves the site working)

1. `legacy-urls.txt` and `check.js`.
2. Folders, directory data, permalinks, redirect templates, `base.njk`, nav, `site.css`, `article.njk`.
3. Note front matter, the covers script and images, `note.njk`, `card.njk`, `/notes/`.
4. Sort JS.
5. Homepage, `/writing/`, `/now/`, 404.
6. CI update.

## 12. Out of scope

Category filter and category pages, dark mode, RSS, self-hosted fonts,
image optimisation (eleventy-img), Nat's fixed review template for notes,
buy links, About page, and maturity stages in the style of a digital garden.
