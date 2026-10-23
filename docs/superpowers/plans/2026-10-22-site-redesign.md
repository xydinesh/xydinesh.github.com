# xydinesh.com Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild xydinesh.com on Nat Eliason's structure: top nav, a sortable cover grid of book notes, and a `finished:` header on each note. It uses the style-C look (IBM Plex, mono metadata, one vermilion accent), and every old URL keeps working.

**Architecture:** Posts move from `src/posts/` into the section folders `src/notes/`, `src/writing/` and `src/now/`. Each folder has a directory data file that sets layout, section tag and permalink. Paginated templates generate a redirect stub for every old `/posts/<slug>/` and `/tags/<tag>/` URL. Covers are downloaded once from Open Library by a manual script and committed, so the build never touches the network. A single hand-written `site.css` replaces Pico. A ~60-line vanilla script adds sort controls over server-rendered cards.

**Tech Stack:** Eleventy 3.1 (CommonJS, Nunjucks), markdown-it + markdown-it-anchor (existing), Node 22, `gray-matter` (devDependency, for the scripts only), `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-22-site-redesign-design.md`

## Global Constraints

- Node `>=22` (`engines` in package.json; CI `node-version: 22`).
- No new runtime dependencies. `gray-matter` is the only new devDependency.
- The site build makes no network requests. Covers come from `npm run covers`, which is run by hand.
- Canonical site URL: `https://xydinesh.com`. Nav name: `Dinesh Weerapura`. Nav links: `notes`, `writing`, `now`. No About link.
- Section URLs are `/notes/<fileSlug>/`, `/writing/<fileSlug>/` and `/now/<fileSlug>/`. Old `/posts/<slug>/` and `/tags/<tag>/` URLs must redirect.
- Posts never declare `layout` or `tags`. Directory data sets both. Topical labels go in `categories`.
- Note fields:
  - `finished`: a quoted `"YYYY-MM-DD"` string.
  - `summary`: at most 140 characters.
  - `categories`: 1–3 lowercase-hyphenated strings.
  - `isbn`: a quoted 13-digit string.
  - `rating`: optional integer 1–10.
- `rating` is never rendered as visible text. It only appears in a `data-rating` attribute on `/notes/`.
- Dates display as ISO `YYYY-MM-DD` everywhere.
- Colors: `--accent: #d6452f` (rules, borders, hover) and `--accent-text: #c93f29` (small accent text, 4.97:1 on white). Body background `#fff`. No dark mode.
- Fonts: IBM Plex Sans 400/500/600 and IBM Plex Mono 400 from Google Fonts with `display=swap`.
- Phone width: 16px side gutter, no horizontal scroll at 320px.

## Review Focus

1. **A note whose cover file is missing** (new book, `npm run covers` not run yet, or Open Library 404). The card and note header show a typographic tile, not a broken image. Pinned in Task 5, Step 6.
2. **An old deep link with an anchor**, e.g. `/posts/principles-life/#section-2`. It lands on `/notes/principles-life/#section-2`, keeping the anchor. Pinned by the `location.hash` assertion in `check.js` (Task 1) and exercised in Task 2, Step 14.
3. **`/notes/?sort=<garbage>` or JavaScript disabled.** Visitors get the default newest-first order and see no dead controls. Pinned by the `parseSort` tests (Task 6) and the `hidden` check in Task 5, Step 5.
4. **The private rating leaking into visible text** on a note page or card. Pinned by the grep in Task 5, Step 7.
5. **A 320px-wide phone.** No horizontal scroll, two-column grid, nav wraps cleanly. Pinned by the manual check in Task 3, Step 4 and Task 5, Step 8.

---

## File Structure

| Path | Responsibility | Task |
|---|---|---|
| `.gitignore` | Add `build/`, `.superpowers/` | 1 |
| `package.json` | Scripts `clean`/`build`/`test`/`covers`, `engines`, `gray-matter` devDep | 1, 6, 7 |
| `scripts/legacy-urls.txt` | Golden list of every pre-redesign URL | 1 |
| `scripts/check.js` | Post-build checks: `redirects`, `links`, `content` | 1 |
| `.eleventy.js` | Filters (`isoDate`, `newestFirst`, `head`, `skip`), collections (`notesByFinished`, `legacy`), passthrough | 2 |
| `src/_data/site.js` | Site name, URL, author, description, nav sections | 2 |
| `src/_data/legacyTags.json` | Old tag page → new section URL | 2 |
| `src/notes/notes.11tydata.js` | Notes layout, tag, permalink, computed `description` and `coverUrl` | 2 |
| `src/writing/writing.11tydata.js`, `src/now/now.11tydata.js` | Section layout, tag, permalink | 2 |
| `src/_includes/base.njk` | HTML shell, head meta, nav, footer | 2 |
| `src/_includes/article.njk` | Writing/now page: h1, ISO date, prose | 2 |
| `src/_includes/note.njk` | Book note page: cover, h1, by/categories/finished, prose | 2 (temp), 4 |
| `src/_includes/entry-list.njk` | `entryList(entries, withDescription)` macro: dated rows | 2 |
| `src/_includes/card.njk` | One notes-grid card | 5 |
| `src/_includes/redirect-page.njk` | Redirect stub HTML | 2 |
| `src/redirects/posts.njk`, `src/redirects/tags.njk` | Paginated redirect generators | 2 |
| `src/index.njk`, `src/writing.njk`, `src/now.njk`, `src/404.njk` | Homepage and section indexes | 2 |
| `src/notes.njk` | Notes index (temporary list in Task 2, grid in Task 5) | 2, 5 |
| `src/assets/css/site.css` | All styles | 3 |
| `scripts/fetch-covers.js` | Download missing covers from Open Library | 4 |
| `src/assets/covers/<slug>.jpg` | Committed cover images | 4 |
| `src/assets/js/notes-sort.js` | Sort logic and DOM wiring | 6 |
| `tests/notes-sort.test.js` | Unit tests for sort logic | 6 |
| `.github/workflows/static.yml` | Node 22, `npm ci`, `npm test` | 7 |
| Deleted: `src/posts/`, `src/tags.njk`, `src/_includes/post.njk` | | 2 |

All commands run from the repo root: `/home/xydinesh/.herdr/worktrees/xydinesh.github.com/new-design`.

---

### Task 1: Verification harness

**Files:**
- Modify: `.gitignore`, `package.json`
- Create: `scripts/legacy-urls.txt`, `scripts/check.js`

**Interfaces:**
- Produces:
  - `npm run build`: cleans `build/` and runs Eleventy.
  - `npm test`: build, then `node scripts/check.js`.
  - `node scripts/check.js [redirects] [links] [content]`: runs the named checks, or all of them if none are named. Exits 0 on pass and 1 on failures, printing `✓ <name>` or `✗ <name> (n)` followed by `  - <message>` lines.

- [ ] **Step 1: Ignore build output and mockups**

Append to `.gitignore`:

```
# Eleventy output and brainstorming mockups
build/
.superpowers/
```

- [ ] **Step 2: Capture every pre-redesign URL (must run before any file moves)**

```bash
node -e "require('fs').rmSync('build',{recursive:true,force:true})" && npx @11ty/eleventy --quiet
find build/posts build/tags -name index.html | sed 's|^build||; s|index.html$||' | sort > scripts/legacy-urls.txt
cat scripts/legacy-urls.txt
```

Expected: exactly these 18 lines:

```
/posts/courage-tobe-disliked/
/posts/december25/
/posts/deepwork/
/posts/dont-believe-everything/
/posts/exterme-ownership/
/posts/february25/
/posts/january26/
/posts/joy-of-competent-beginner/
/posts/november25/
/posts/principles-life/
/posts/show-your-work/
/posts/useful-not-true/
/posts/what-do-you-want-out-of-life/
/posts/writing/
/tags/books/
/tags/now/
/tags/taglist/
/tags/writing/
```

- [ ] **Step 3: Add scripts and the devDependency**

```bash
npm install --save-dev gray-matter@^4.0.3
```

Then set the `scripts` block in `package.json` to:

```json
  "scripts": {
    "start": "eleventy --serve",
    "clean": "node -e \"require('fs').rmSync('build',{recursive:true,force:true})\"",
    "build": "npm run clean && eleventy",
    "test": "npm run build && node scripts/check.js",
    "covers": "node scripts/fetch-covers.js"
  },
```

- [ ] **Step 4: Write `scripts/check.js`**

```js
#!/usr/bin/env node
// Post-build checks for xydinesh.com.
// Usage: node scripts/check.js [redirects] [links] [content]   (no args = all)
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const ROOT = path.join(__dirname, "..");
const BUILD = path.join(ROOT, "build");
const SRC = path.join(ROOT, "src");
const SECTIONS = ["notes", "writing", "now"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const CATEGORY = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// "/notes/x/" -> build/notes/x/index.html, "/assets/a.css" -> build/assets/a.css
function builtFile(urlPath) {
  const clean = decodeURI(urlPath.split(/[?#]/)[0]);
  const direct = path.join(BUILD, clean);
  if (clean.endsWith("/")) return path.join(direct, "index.html");
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  return path.join(direct, "index.html");
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const p = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(p) : [p];
  });
}

function isRealDate(s) {
  return ISO.test(s) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
}

function checkRedirects() {
  const errors = [];
  const urls = fs
    .readFileSync(path.join(__dirname, "legacy-urls.txt"), "utf8")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const url of urls) {
    const file = builtFile(url);
    if (!fs.existsSync(file)) {
      errors.push(`${url}: no page built`);
      continue;
    }
    const html = fs.readFileSync(file, "utf8");
    const m = html.match(/http-equiv="refresh" content="0; url=([^"]+)"/);
    if (!m) {
      errors.push(`${url}: not a redirect page`);
      continue;
    }
    if (!html.includes("location.hash")) errors.push(`${url}: redirect drops the #anchor`);
    if (!fs.existsSync(builtFile(m[1]))) errors.push(`${url}: redirects to ${m[1]}, which does not exist`);
  }
  return errors;
}

function checkLinks() {
  const errors = [];
  for (const file of walk(BUILD).filter((f) => f.endsWith(".html"))) {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const target = m[1];
      if (target.startsWith("//")) continue;
      if (!fs.existsSync(builtFile(target))) {
        errors.push(`${path.relative(BUILD, file)}: broken link ${target}`);
      }
    }
  }
  return errors;
}

function checkContent() {
  const errors = [];
  let noteCount = 0;
  for (const section of SECTIONS) {
    const dir = path.join(SRC, section);
    if (!fs.existsSync(dir)) {
      errors.push(`src/${section}/ is missing`);
      continue;
    }
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const slug = path.basename(file, ".md");
      const { data } = matter.read(path.join(dir, file));
      const err = (msg) => errors.push(`src/${section}/${file}: ${msg}`);

      if ("tags" in data) err("must not declare tags (directory data sets them)");
      if ("layout" in data) err("must not declare layout (directory data sets it)");
      if (typeof data.title !== "string" || !data.title.trim()) err("title is required");
      if (section !== "notes") {
        if (!data.date) err("date is required");
        continue;
      }

      noteCount++;
      if (typeof data.author !== "string" || !data.author.trim()) err("author is required");
      if (typeof data.finished !== "string" || !isRealDate(data.finished)) {
        err(`finished must be a quoted "YYYY-MM-DD" date, got ${JSON.stringify(data.finished)}`);
      }
      if (typeof data.summary !== "string" || !data.summary.trim()) err("summary is required");
      else if (data.summary.length > 140) err(`summary is ${data.summary.length} chars (max 140)`);
      if (!Array.isArray(data.categories) || data.categories.length < 1 || data.categories.length > 3) {
        err("categories must list 1-3 entries");
      } else {
        for (const c of data.categories) {
          if (typeof c !== "string" || !CATEGORY.test(c)) err(`category ${JSON.stringify(c)} must be lowercase-hyphenated`);
        }
      }
      if (typeof data.isbn !== "string" || !/^\d{13}$/.test(data.isbn)) {
        err("isbn must be a quoted 13-digit string");
      } else if (!fs.existsSync(path.join(SRC, "assets", "covers", `${slug}.jpg`))) {
        err("cover missing: run npm run covers");
      }
      if ("rating" in data && !(Number.isInteger(data.rating) && data.rating >= 1 && data.rating <= 10)) {
        err("rating must be an integer 1-10");
      }
    }
  }
  if (noteCount === 0) errors.push("no notes found in src/notes/");
  return errors;
}

const CHECKS = { redirects: checkRedirects, links: checkLinks, content: checkContent };
const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(CHECKS);
let failures = 0;
for (const name of names) {
  const fn = CHECKS[name];
  if (!fn) {
    console.error(`unknown check: ${name} (expected one of ${Object.keys(CHECKS).join(", ")})`);
    process.exit(2);
  }
  if (name !== "content" && !fs.existsSync(BUILD)) {
    console.error("build/ is missing: run npm run build first");
    process.exit(2);
  }
  const errors = fn();
  if (errors.length) {
    failures += errors.length;
    console.error(`✗ ${name} (${errors.length})`);
    for (const e of errors) console.error(`  - ${e}`);
  } else {
    console.log(`✓ ${name}`);
  }
}
process.exit(failures ? 1 : 0);
```

- [ ] **Step 5: Run it against the current site to confirm it fails (red)**

Run: `npm test`
Expected: exit code 1.
- `✗ redirects (18)`, with every line reading `not a redirect page`.
- `✓ links`.
- `✗ content`, with `src/notes/ is missing`, `src/writing/ is missing`, `src/now/ is missing` and `no notes found in src/notes/`.

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json package-lock.json scripts/legacy-urls.txt scripts/check.js
git commit -m "Add post-build checks and capture legacy URLs"
```

---

### Task 2: Sections, URLs and redirects

**Files:**
- Move: `src/posts/*.md` → `src/notes/`, `src/writing/`, `src/now/`; `src/posts/book-template` → `src/notes/_template.md.txt`; `src/posts/now_template` → `src/now/_template.md.txt`
- Modify: `.eleventy.js`, `src/index.njk`, `src/_includes/base.njk`
- Create:
  - data: `src/_data/site.js`, `src/_data/legacyTags.json`
  - directory data: `src/notes/notes.11tydata.js`, `src/writing/writing.11tydata.js`, `src/now/now.11tydata.js`
  - layouts and includes: `src/_includes/article.njk`, `src/_includes/note.njk`, `src/_includes/entry-list.njk`, `src/_includes/redirect-page.njk`
  - redirect generators: `src/redirects/posts.njk`, `src/redirects/tags.njk`
  - pages: `src/notes.njk`, `src/writing.njk`, `src/now.njk`, `src/404.njk`
- Delete: `src/tags.njk`, `src/_includes/post.njk`

**Interfaces:**
- Consumes: `node scripts/check.js redirects links` (Task 1).
- Produces:
  - **Filters:**
    - `isoDate(value)`: Date or string to `"YYYY-MM-DD"`.
    - `newestFirst(arr)`: reversed copy.
    - `head(arr, n)`, `skip(arr, n)`.
  - **Collections:**
    - `collections.notesByFinished`: newest finished first; falls back to the date if a note has no `finished`.
    - `collections.legacy`.
    - `collections.notes`, `collections.writing`, `collections.now`.
  - **Data:**
    - `site.name`, `site.url`, `site.author`, `site.description`.
    - `site.sections`: `[{label, url}]`.
  - **Computed data on notes:**
    - `coverUrl`: `"/assets/covers/<slug>.jpg"` or `null`.
    - `description`: equals `summary`.
  - **Macro:** `entryList(entries, withDescription)` from `entry-list.njk`.

- [ ] **Step 1: Move posts into section folders**

```bash
mkdir -p src/notes src/writing src/now
for f in courage-tobe-disliked deepwork dont-believe-everything principles-life show-your-work useful-not-true what-do-you-want-out-of-life; do git mv src/posts/$f.md src/notes/$f.md; done
git mv src/posts/exterme-ownership.md src/notes/extreme-ownership.md
for f in joy-of-competent-beginner writing; do git mv src/posts/$f.md src/writing/$f.md; done
for f in december25 february25 january26 november25; do git mv src/posts/$f.md src/now/$f.md; done
git mv src/posts/book-template src/notes/_template.md.txt
git mv src/posts/now_template src/now/_template.md.txt
git rm -q src/tags.njk src/_includes/post.njk
ls src/posts 2>/dev/null && echo "src/posts not empty!" || echo "src/posts gone"
```

Expected: `src/posts gone`.

- [ ] **Step 2: Strip `layout`/`tags`, drop the hand-typed month line, fix heading levels**

```bash
sed -i -E '/^(layout|tags):/d' src/notes/*.md src/writing/*.md src/now/*.md src/notes/_template.md.txt src/now/_template.md.txt
node -e '
const fs = require("fs");
for (const f of process.argv.slice(1)) {
  const s = fs.readFileSync(f, "utf8");
  const m = s.match(/^(---\n[\s\S]*?\n---\n)([\s\S]*)$/);
  const body = m[2].replace(/^\s*[A-Z][a-z]+,? \d{4}[ \t]*\n+/, "");
  fs.writeFileSync(f, m[1] + "\n" + body);
}' src/notes/*.md src/writing/*.md src/now/*.md src/notes/_template.md.txt src/now/_template.md.txt
# february25: body starts with "# Stockholm" -> demote every heading one level
sed -i -E 's/^(#{1,5}) /\1# /' src/now/february25.md
# deepwork: body jumps straight to ### -> promote to ##
sed -i -E 's/^### /## /' src/notes/deepwork.md
```

Then add `legacySlug` to `src/notes/extreme-ownership.md`'s front matter, after `date:`:

```yaml
legacySlug: "exterme-ownership"
```

Verify:

```bash
grep -lE '^(layout|tags):' src/notes/*.md src/writing/*.md src/now/*.md || echo "no layout/tags left"
for f in src/notes/*.md src/writing/*.md src/now/*.md; do awk 'BEGIN{fm=0} /^---$/{fm++; next} fm>=2 && NF{print FILENAME": "$0; exit}' "$f"; done | grep -E ': [A-Z][a-z]+,? [0-9]{4}$' || echo "no month lines left"
grep -nE '^# ' src/notes/*.md src/writing/*.md src/now/*.md || echo "no body h1"
```

Expected: `no layout/tags left`, `no month lines left`, `no body h1`.

- [ ] **Step 3: Replace `.eleventy.js`**

```js
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

// Date objects and "YYYY-MM-DD..." strings both become "YYYY-MM-DD" (UTC).
function isoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

module.exports = function (eleventyConfig) {
  const md = new markdownIt({
    html: true,
  }).use(markdownItAnchor);

  eleventyConfig.setLibrary("md", md);

  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("newestFirst", (arr) => [...arr].reverse());
  eleventyConfig.addFilter("head", (arr, n) => arr.slice(0, n));
  eleventyConfig.addFilter("skip", (arr, n) => arr.slice(n));

  // Notes are ordered by the date the book was finished, never by `date`.
  eleventyConfig.addCollection("notesByFinished", function (collectionApi) {
    const key = (item) => item.data.finished || isoDate(item.date);
    return collectionApi
      .getFilteredByTag("notes")
      .sort((a, b) => key(b).localeCompare(key(a)));
  });

  // Everything that used to live under /posts/, for the redirect generator.
  eleventyConfig.addCollection("legacy", function (collectionApi) {
    return collectionApi.getFilteredByGlob([
      "src/notes/*.md",
      "src/writing/*.md",
      "src/now/*.md",
    ]);
  });

  return {
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "build",
    },
  };
};
```

- [ ] **Step 4: Site data**

`src/_data/site.js`:

```js
module.exports = {
  name: "Dinesh Weerapura",
  author: "Dinesh Weerapura",
  url: "https://xydinesh.com",
  description: "Book notes, writing and monthly now updates from Dinesh Weerapura.",
  sections: [
    { label: "notes", url: "/notes/" },
    { label: "writing", url: "/writing/" },
    { label: "now", url: "/now/" },
  ],
};
```

`src/_data/legacyTags.json`:

```json
[
  { "from": "books", "to": "/notes/" },
  { "from": "writing", "to": "/writing/" },
  { "from": "now", "to": "/now/" },
  { "from": "taglist", "to": "/" }
]
```

- [ ] **Step 5: Directory data files**

`src/notes/notes.11tydata.js`:

```js
const fs = require("node:fs");
const path = require("node:path");

module.exports = {
  layout: "note.njk",
  tags: ["notes"],
  eleventyComputed: {
    permalink: (data) => `/notes/${data.page.fileSlug}/`,
    description: (data) => data.summary,
    // Covers are a file-name convention, not a front-matter field.
    coverUrl: (data) => {
      const rel = `assets/covers/${data.page.fileSlug}.jpg`;
      return fs.existsSync(path.join(__dirname, "..", rel)) ? `/${rel}` : null;
    },
  },
};
```

`src/writing/writing.11tydata.js`:

```js
module.exports = {
  layout: "article.njk",
  tags: ["writing"],
  eleventyComputed: {
    permalink: (data) => `/writing/${data.page.fileSlug}/`,
  },
};
```

`src/now/now.11tydata.js`:

```js
module.exports = {
  layout: "article.njk",
  tags: ["now"],
  eleventyComputed: {
    permalink: (data) => `/now/${data.page.fileSlug}/`,
  },
};
```

- [ ] **Step 6: Replace `src/_includes/base.njk`**

```njk
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% if title and title != site.name %}{{ title }} – {% endif %}{{ site.name }}</title>
  <meta name="description" content="{{ description or site.description }}">
  <link rel="canonical" href="{{ site.url }}{{ page.url }}">
  <meta property="og:title" content="{{ title or site.name }}">
  <meta property="og:description" content="{{ description or site.description }}">
  <meta property="og:url" content="{{ site.url }}{{ page.url }}">
  {% if coverUrl %}<meta property="og:image" content="{{ site.url }}{{ coverUrl }}">{% endif %}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
  <header class="site-header">
    <div class="wrap nav">
      <a class="site-name" href="/">{{ site.name }}</a>
      <nav aria-label="Sections">
        {%- for s in site.sections %}
        <a href="{{ s.url }}"{% if page.url == s.url %} aria-current="page"{% elif page.url.indexOf(s.url) == 0 %} aria-current="true"{% endif %}>{{ s.label }}</a>
        {%- endfor %}
      </nav>
    </div>
  </header>
  <main class="wrap">
    {% block content %}{{ content | safe }}{% endblock %}
  </main>
  <footer class="site-footer wrap meta">© {{ site.author }}</footer>
</body>
</html>
```

- [ ] **Step 7: Layouts and includes**

`src/_includes/article.njk`:

```njk
{% extends "base.njk" %}

{% block content %}
<article>
  <header class="article-header">
    <h1>{{ title }}</h1>
    <p class="meta">{{ page.date | isoDate }}</p>
  </header>
  <div class="prose">{{ content | safe }}</div>
</article>
{% endblock %}
```

`src/_includes/note.njk`. This is a temporary version, replaced in Task 4 once notes have their book fields:

```njk
{% extends "article.njk" %}
```

`src/_includes/entry-list.njk`:

```njk
{% macro entryList(entries, withDescription) %}
<ul class="rows">
  {%- for e in entries %}
  <li>
    <span class="meta row-date">{{ (e.data.finished or e.date) | isoDate }}</span>
    <span class="row-main">
      <a href="{{ e.url }}">{{ e.data.title }}</a>{% if e.data.author %} <span class="muted">– {{ e.data.author }}</span>{% endif %}
      {%- if withDescription and e.data.description %}
      <span class="row-desc">{{ e.data.description }}</span>
      {%- endif %}
    </span>
  </li>
  {%- endfor %}
</ul>
{% endmacro %}
```

`src/_includes/redirect-page.njk`:

```njk
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{{ site.url }}{{ to }}">
  <script>location.replace({{ to | dump | safe }} + location.search + location.hash);</script>
  <meta http-equiv="refresh" content="0; url={{ to }}">
</head>
<body>
  <p>This page has moved to <a href="{{ to }}">{{ site.url }}{{ to }}</a>.</p>
</body>
</html>
```

- [ ] **Step 8: Redirect generators**

`src/redirects/posts.njk`:

```njk
---
pagination:
  data: collections.legacy
  size: 1
  alias: item
permalink: "/posts/{{ item.data.legacySlug or item.page.fileSlug }}/index.html"
eleventyExcludeFromCollections: true
---
{% set to = item.url %}{% include "redirect-page.njk" %}
```

`src/redirects/tags.njk`:

```njk
---
pagination:
  data: legacyTags
  size: 1
  alias: item
permalink: "/tags/{{ item.from }}/index.html"
eleventyExcludeFromCollections: true
---
{% set to = item.to %}{% include "redirect-page.njk" %}
```

- [ ] **Step 9: Homepage**

Replace `src/index.njk`. The intro is a **draft for the user to rewrite**, and the final summary says so:

```njk
---
title: "Dinesh Weerapura"
layout: "base.njk"
---
{% from "entry-list.njk" import entryList %}
<section class="home-intro prose">
  <h1>Hi, I'm Dinesh.</h1>
  <p>After eight years at Salesforce I started <a href="https://yakadalabs.com">Yakada Labs</a>, where I build custom AI solutions. Here I keep notes on the books I read, the occasional essay, and a monthly update on what I'm focused on now.</p>
</section>

<section>
  <div class="section-head"><h2>recent notes</h2><a href="/notes/">all notes →</a></div>
  {{ entryList(collections.notesByFinished | head(4), false) }}
</section>

<section>
  <div class="section-head"><h2>writing</h2><a href="/writing/">all writing →</a></div>
  {{ entryList(collections.writing | newestFirst | head(3), true) }}
</section>

<section>
  <div class="section-head"><h2>now</h2><a href="/now/">previous →</a></div>
  {{ entryList(collections.now | newestFirst | head(1), true) }}
</section>
```

- [ ] **Step 10: Section index pages and 404**

`src/notes.njk`. This is a temporary list, replaced by the grid in Task 5:

```njk
---
title: "Book Notes"
layout: "base.njk"
permalink: "/notes/"
description: "Notes and highlights from books I've read."
---
{% from "entry-list.njk" import entryList %}
<h1>Book Notes</h1>
{{ entryList(collections.notesByFinished, false) }}
```

`src/writing.njk`:

```njk
---
title: "Writing"
layout: "base.njk"
permalink: "/writing/"
description: "Essays and longer thoughts."
---
{% from "entry-list.njk" import entryList %}
<h1>Writing</h1>
{{ entryList(collections.writing | newestFirst, true) }}
```

`src/now.njk`:

```njk
---
title: "Now"
layout: "base.njk"
permalink: "/now/"
description: "What I'm focused on, updated every month or so."
---
{% from "entry-list.njk" import entryList %}
{% set nows = collections.now | newestFirst %}
<h1>Now</h1>
<p class="page-intro">What I'm focused on, updated every month or so.</p>
<div class="section-head"><h2>latest</h2></div>
{{ entryList(nows | head(1), true) }}
<div class="section-head"><h2>previously</h2></div>
{{ entryList(nows | skip(1), false) }}
```

`src/404.njk`:

```njk
---
title: "Not found"
layout: "base.njk"
permalink: "/404.html"
eleventyExcludeFromCollections: true
---
<h1>Not found</h1>
<p class="page-intro">That page doesn't exist. Try <a href="/notes/">notes</a>, <a href="/writing/">writing</a> or <a href="/now/">now</a>.</p>
```

- [ ] **Step 11: Add a placeholder stylesheet so links resolve**

Create `src/assets/css/site.css` containing only:

```css
/* Filled in by Task 3. */
```

- [ ] **Step 12: Run the redirect and link checks (green)**

Run: `npm run build && node scripts/check.js redirects links`
Expected:
- The build finishes with no Eleventy errors.
- `✓ redirects`
- `✓ links`

If redirects fail with "redirects to undefined", `item.url` is not populated in the pagination. Use `{% set to = item.page.url %}` in `posts.njk` instead.

- [ ] **Step 13: Check the built URLs**

```bash
find build -name index.html | sed 's|^build||' | sort
grep -o 'url=[^"]*' build/posts/exterme-ownership/index.html build/tags/books/index.html build/tags/taglist/index.html
```

Expected:
- The list includes `/notes/<8 slugs>/`, `/writing/<2>/`, `/now/<4>/`, `/notes/`, `/writing/`, `/now/`, `/` and the 18 legacy paths.
- The grep prints `url=/notes/extreme-ownership/`, `url=/notes/` and `url=/`.

- [ ] **Step 14: Anchor survives a redirect (Review Focus 2)**

Run `npm start`. Open `http://localhost:8080/posts/principles-life/#section-2` in a browser.
Expected: the address bar shows `/notes/principles-life/#section-2`, scrolled to section 2. Stop the server.

- [ ] **Step 15: Commit**

```bash
git add -A src .eleventy.js
git commit -m "Move posts into notes/writing/now sections with redirects from old URLs"
```

---

### Task 3: Visual system (style C)

**Files:**
- Modify: `src/assets/css/site.css`

**Interfaces:**
- Consumes: the class names used by Task 2's templates and Task 4/5/6's templates.
  - Layout: `.wrap`, `.nav`, `.site-name`, `.site-header`, `.site-footer`, `.prose`, `.page-intro`, `.home-intro`, `.section-head`, `.article-header`
  - Rows and metadata: `.rows`, `.row-date`, `.row-main`, `.row-desc`, `.meta`, `.muted`, `.tag`
  - Notes grid: `.notes-head`, `.sort`, `.grid`, `.card`, `.card-title`, `.card-author`, `.card-summary`, `.tags`
  - Covers and note header: `.cover`, `.tile`, `.note-header`, `.note-meta`
- Produces: the token names listed in the spec, §6.

- [ ] **Step 1: Write `src/assets/css/site.css`**

```css
/* xydinesh.com — style C: calm minimal, IBM Plex, one vermilion accent. */
:root {
  --bg: #fff;
  --fg: #161616;
  --muted: #5f5f5f;      /* 6.4:1 on white */
  --rule: #e8e8e8;
  --accent: #d6452f;     /* rules, borders, hover */
  --accent-text: #c93f29; /* small accent text, 4.97:1 on white */
  --tint: #fbeae6;
  --tile: #f6f4f2;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --measure: 65ch;
  --wide: 960px;
  --s1: 0.25rem;
  --s2: 0.5rem;
  --s3: 1rem;
  --s4: 2rem;
  --s5: 4rem;
  --cover-ratio: 2 / 3;
}

*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.6;
}
img { max-width: 100%; height: auto; }
a { color: var(--accent-text); text-decoration-thickness: 1px; text-underline-offset: 2px; }
a:hover { color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* Layout */
.wrap { max-width: var(--wide); margin: 0 auto; padding-left: var(--s3); padding-right: var(--s3); }
@media (min-width: 640px) {
  .wrap { padding-left: var(--s4); padding-right: var(--s4); }
}
.site-header { border-bottom: 1px solid var(--rule); }
.nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: baseline;
  gap: var(--s2) var(--s3);
  padding-top: var(--s3);
  padding-bottom: var(--s3);
}
.site-name { font-weight: 600; color: var(--fg); text-decoration: none; }
.nav nav { display: flex; gap: var(--s3); }
.nav nav a { color: var(--muted); text-decoration: none; font-size: 0.9375rem; }
.nav nav a:hover, .nav nav a[aria-current] { color: var(--accent-text); }
main.wrap { padding-top: var(--s4); padding-bottom: var(--s5); }
.site-footer { border-top: 1px solid var(--rule); padding-top: var(--s3); padding-bottom: var(--s4); }

/* Type */
h1, h2, h3, h4 { line-height: 1.25; font-weight: 600; margin: var(--s4) 0 var(--s2); }
h1 { font-size: 2rem; margin-top: 0; letter-spacing: -0.01em; }
h2 { font-size: 1.375rem; }
h3 { font-size: 1.125rem; }
h4 { font-size: 1rem; }
.meta { font-family: var(--font-mono); font-size: 0.8125rem; color: var(--muted); }
.muted { color: var(--muted); }
.tag { margin-right: var(--s2); white-space: nowrap; }
.tag::before { content: "#"; color: var(--accent-text); }

/* Long-form text */
.prose { max-width: var(--measure); }
.prose p, .prose ul, .prose ol, .prose blockquote, .prose table { margin: 0 0 var(--s3); }
.prose ul, .prose ol { padding-left: 1.25rem; }
.prose li { margin-bottom: var(--s1); }
.prose li > ul, .prose li > ol { margin: var(--s1) 0 0; }
.prose blockquote { margin-left: 0; padding-left: var(--s3); border-left: 2px solid var(--accent); color: #3d3d3d; }
.prose mark { background: var(--tint); color: inherit; padding: 0 0.15em; }
.prose code { font-family: var(--font-mono); font-size: 0.9em; }
.prose hr { border: 0; border-top: 1px solid var(--rule); margin: var(--s4) 0; }
.prose table { border-collapse: collapse; }
.prose th, .prose td { border-bottom: 1px solid var(--rule); padding: var(--s1) var(--s2); text-align: left; }
.page-intro { max-width: var(--measure); color: var(--muted); margin: 0 0 var(--s4); }
.home-intro p { font-size: 1.125rem; }
.article-header { margin-bottom: var(--s4); }
.article-header h1 { margin-bottom: var(--s1); }
.article-header .meta { margin: 0; }

/* Dated row lists (home, writing, now) */
.section-head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--s3); margin: var(--s4) 0 var(--s2); max-width: var(--measure); }
.section-head h2 { font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 400; color: var(--muted); margin: 0; }
.section-head a { font-family: var(--font-mono); font-size: 0.8125rem; text-decoration: none; }
.rows { list-style: none; padding: 0; margin: 0; max-width: var(--measure); }
.rows li { display: grid; grid-template-columns: 6.5rem 1fr; gap: var(--s3); padding: var(--s2) 0; border-bottom: 1px dashed var(--rule); }
.row-date { padding-top: 0.15rem; }
.row-main a { color: var(--fg); text-decoration: none; font-weight: 500; }
.row-main a:hover { color: var(--accent-text); }
.row-desc { display: block; color: var(--muted); font-size: 0.9375rem; }
@media (max-width: 480px) {
  .rows li { grid-template-columns: 1fr; gap: 0; }
}

/* Covers */
.cover { display: block; width: 100%; aspect-ratio: var(--cover-ratio); object-fit: cover; background: var(--tile); border: 1px solid var(--rule); }
.cover.tile {
  display: flex;
  align-items: flex-end;
  padding: var(--s3);
  border-top: 3px solid var(--accent);
  font-weight: 600;
  font-size: 0.9375rem;
  line-height: 1.25;
  color: var(--fg);
  overflow: hidden;
}

/* Notes index */
.notes-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: var(--s2) var(--s3); margin-bottom: var(--s4); }
.notes-head h1 { margin: 0; }
.sort { display: flex; flex-wrap: wrap; gap: var(--s2); align-items: baseline; }
.sort button {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--muted);
  background: none;
  border: 1px solid var(--rule);
  border-radius: 4px;
  padding: 0.2rem 0.55rem;
  cursor: pointer;
}
.sort button:hover { color: var(--accent-text); }
.sort button[aria-pressed="true"] { color: var(--accent-text); border-color: var(--accent); }
.grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: var(--s4); }
@media (max-width: 480px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s4) var(--s3); }
}
.card a { display: block; color: inherit; text-decoration: none; }
.card a:hover .card-title { color: var(--accent-text); }
.card-title { font-size: 1rem; margin: var(--s2) 0 0; }
.card-author { margin: 0 0 var(--s1); }
.card .tags { margin: 0 0 var(--s1); }
.card-summary { margin: 0; font-size: 0.9375rem; line-height: 1.5; color: #3d3d3d; }

/* Note page header */
.note-header { display: grid; grid-template-columns: 9rem 1fr; gap: var(--s4); align-items: start; margin-bottom: var(--s4); padding-bottom: var(--s4); border-bottom: 1px solid var(--rule); max-width: var(--measure); }
.note-header h1 { margin-bottom: var(--s2); }
.note-meta { display: grid; grid-template-columns: max-content 1fr; gap: 0 var(--s2); margin: 0; line-height: 1.9; }
.note-meta dt { color: var(--accent-text); }
.note-meta dd { margin: 0; }
@media (max-width: 480px) {
  .note-header { grid-template-columns: 6rem 1fr; gap: var(--s3); }
  .note-header h1 { font-size: 1.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  * { scroll-behavior: auto !important; transition: none !important; }
}
```

- [ ] **Step 2: Build and run the link check**

Run: `npm run build && node scripts/check.js redirects links`
Expected: `✓ redirects` and `✓ links`.

- [ ] **Step 3: Compare desktop views with the mockup**

Run `npm start` and open `http://localhost:8080/`, `/writing/`, `/now/` and `/now/february25/`. Compare against the style-C mockup in `.superpowers/brainstorm/*/content/pages.html`.

Expected:
- Plex fonts load.
- Nav shows "Dinesh Weerapura" on the left and notes/writing/now on the right, with the current section in red-orange.
- Mono ISO dates, dashed row separators.
- February's former `# Stockholm` renders as an `h2` under the page `h1`.

- [ ] **Step 4: Phone width (Review Focus 5)**

In browser devtools, set the viewport to 320×640 and visit the same pages.

Expected:
- No horizontal scrollbar.
- 16px side padding.
- Nav wraps to two lines if needed.
- Rows stack the date above the title.

Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/assets/css/site.css
git commit -m "Add style C stylesheet and drop Pico"
```

---

### Task 4: Book note content model, covers and note page

**Files:**
- Modify: the 8 files in `src/notes/*.md` (front matter only), `src/notes/_template.md.txt`, `src/_includes/note.njk`
- Create: `scripts/fetch-covers.js`, `src/assets/covers/*.jpg` (8 images)

**Interfaces:**
- Consumes:
  - `coverUrl` and `description` (Task 2, `notes.11tydata.js`).
  - `isoDate`.
  - `node scripts/check.js content`.
- Produces:
  - Every note has `title`, `author`, `finished`, `summary`, `categories` and `isbn`, plus an optional `rating`, in the formats listed under Global Constraints.
  - `npm run covers` downloads any missing covers.

- [ ] **Step 1: Confirm the content check fails (red)**

Run: `node scripts/check.js content`
Expected: `✗ content` with 8 × `author is required`, `finished must be…`, `summary is required`, `categories must list 1-3 entries` and `isbn must be a quoted 13-digit string`.

- [ ] **Step 2: Rewrite the 8 note front matters**

Notes on the values:
- `finished` is seeded from each post's existing `date`, which is the date the post was written.
- `summary` and `categories` are drafts taken from each post, for the user to rewrite.
- ISBN editions were chosen because Open Library has a cover for them.
- `rating` is left out; the user adds it.

Run this one-off script. It keeps each body unchanged and replaces only the front matter:

```bash
node -e '
const fs = require("fs");
const notes = {
  "courage-tobe-disliked": { title: "Courage to be disliked", author: "Ichiro Kishimi & Fumitake Koga", finished: "2025-12-25", isbn: "9781501197277", categories: ["psychology", "self-acceptance"], summary: "Adlerian psychology as a dialogue: accept yourself, separate your tasks from others, and find the courage to change." },
  "deepwork": { title: "Deep Work", author: "Cal Newport", finished: "2025-11-25", isbn: "9781455586691", categories: ["productivity", "focus"], summary: "Long, uninterrupted focus is rare and valuable; build rules and rituals that protect it." },
  "dont-believe-everything": { title: "Don't believe everything you think", author: "Joseph Nguyen", finished: "2025-12-27", isbn: "9798986406503", categories: ["mindfulness", "psychology"], summary: "Suffering comes from thinking about our thoughts, not the thoughts themselves; practice non-thinking through the day." },
  "extreme-ownership": { title: "Extreme Ownership", author: "Jocko Willink & Leif Babin", finished: "2025-12-31", isbn: "9781250067050", categories: ["leadership", "management"], summary: "Leaders own everything in their world. Most useful when moving from individual contributor to manager.", legacySlug: "exterme-ownership" },
  "principles-life": { title: "Principles (Life)", author: "Ray Dalio", finished: "2026-01-25", isbn: "9781501124020", categories: ["decision-making", "life"], summary: "Treat problems as puzzles, embrace reality, and use a five-step process to turn mistakes into principles." },
  "show-your-work": { title: "Show your work", author: "Austin Kleon", finished: "2026-01-11", isbn: "9780761178972", categories: ["creativity", "sharing"], summary: "Share your process, not just the product: learn in public, teach what you know, and stick around." },
  "useful-not-true": { title: "Useful, not True", author: "Derek Sivers", finished: "2025-11-29", isbn: "9780473453046", categories: ["mindset", "beliefs"], summary: "Adopt the belief or perspective that helps you take action." },
  "what-do-you-want-out-of-life": { title: "What Do You Want Out of Life?", author: "Valerie Tiberius", finished: "2026-02-01", isbn: "9780691240695", categories: ["values", "philosophy"], summary: "Values are our most important goals; knowing them resolves the conflicts that stop us from moving forward." },
};
const q = (s) => JSON.stringify(s);
for (const [slug, n] of Object.entries(notes)) {
  const file = `src/notes/${slug}.md`;
  const body = fs.readFileSync(file, "utf8").replace(/^---\n[\s\S]*?\n---\n/, "");
  const fm = [
    "---",
    `title: ${q(n.title)}`,
    `author: ${q(n.author)}`,
    `finished: ${q(n.finished)}`,
    `summary: ${q(n.summary)}`,
    `categories: [${n.categories.join(", ")}]`,
    `isbn: ${q(n.isbn)}`,
    ...(n.legacySlug ? [`legacySlug: ${q(n.legacySlug)}`] : []),
    "---",
  ].join("\n");
  fs.writeFileSync(file, fm + "\n" + body);
}'
head -9 src/notes/extreme-ownership.md
```

Expected output (the body follows, unchanged):

```
---
title: "Extreme Ownership"
author: "Jocko Willink & Leif Babin"
finished: "2025-12-31"
summary: "Leaders own everything in their world. Most useful when moving from individual contributor to manager."
categories: [leadership, management]
isbn: "9781250067050"
legacySlug: "exterme-ownership"
---
```

- [ ] **Step 3: Update the book scaffold**

Replace `src/notes/_template.md.txt` with:

```markdown
---
title: "Book Title"
author: "Author Name"
finished: "YYYY-MM-DD"
summary: "One-sentence take, 140 characters max."
categories: [category-one, category-two]
isbn: "9780000000000"
rating: 7
---

Intro paragraph.

## Table of Contents
```

(To add a book: copy to `src/notes/<slug>.md`, fill in the fields, then run `npm run covers`.)

- [ ] **Step 4: Write `scripts/fetch-covers.js`**

```js
#!/usr/bin/env node
// Downloads missing book covers from Open Library into src/assets/covers/<slug>.jpg.
// Run by hand when adding a book (npm run covers), then commit the image.
// The site build never fetches covers.
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");

const NOTES_DIR = path.join(__dirname, "..", "src", "notes");
const COVERS_DIR = path.join(__dirname, "..", "src", "assets", "covers");

async function main() {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  let failed = false;
  for (const file of fs.readdirSync(NOTES_DIR).filter((f) => f.endsWith(".md"))) {
    const slug = path.basename(file, ".md");
    const { data } = matter.read(path.join(NOTES_DIR, file));
    const dest = path.join(COVERS_DIR, `${slug}.jpg`);
    if (!data.isbn || fs.existsSync(dest)) continue;

    const url = `https://covers.openlibrary.org/b/isbn/${data.isbn}-L.jpg?default=false`;
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!res.ok || buf.length < 1024) {
      console.error(`✗ ${slug}: no cover for ISBN ${data.isbn} (HTTP ${res.status}, ${buf.length} bytes)`);
      failed = true;
      continue;
    }
    fs.writeFileSync(dest, buf);
    console.log(`✓ ${slug} (${Math.round(buf.length / 1024)} KB)`);
  }
  if (failed) process.exitCode = 1;
}

main();
```

- [ ] **Step 5: Download the covers**

Run: `npm run covers && ls -la src/assets/covers`
Expected:
- 8 `✓` lines and exit 0.
- 8 `.jpg` files, each larger than 5 KB.

Running `npm run covers` again prints nothing, because existing files are skipped.

- [ ] **Step 6: Content check passes (green)**

Run: `node scripts/check.js content`
Expected: `✓ content`

- [ ] **Step 7: Prove the check rejects an unquoted date**

```bash
sed -i 's/^finished: "2025-11-25"/finished: 2025-11-25/' src/notes/deepwork.md
node scripts/check.js content; echo "exit=$?"
sed -i 's/^finished: 2025-11-25/finished: "2025-11-25"/' src/notes/deepwork.md
node scripts/check.js content
```

Expected:
- The first run prints `✗ content (1)` with `finished must be a quoted "YYYY-MM-DD" date`, then `exit=1`.
- The second run prints `✓ content`.

(Restore with `sed`, not `git checkout`: the front-matter rewrite from Step 2 is not committed yet, so checking the file out would lose it.)

- [ ] **Step 8: Replace `src/_includes/note.njk`**

```njk
{% extends "base.njk" %}

{% block content %}
<article>
  <header class="note-header">
    {% if coverUrl %}
    <img class="cover" src="{{ coverUrl }}" alt="" width="200" height="300">
    {% else %}
    <span class="cover tile" aria-hidden="true">{{ title }}</span>
    {% endif %}
    <div>
      <h1>{{ title }}</h1>
      <dl class="meta note-meta">
        <dt>by:</dt><dd>{{ author }}</dd>
        <dt>categories:</dt><dd>{% for c in categories %}<span class="tag">{{ c }}</span>{% endfor %}</dd>
        <dt>finished:</dt><dd>{{ finished | isoDate }}</dd>
      </dl>
    </div>
  </header>
  <div class="prose">{{ content | safe }}</div>
</article>
{% endblock %}
```

- [ ] **Step 9: Run every check (green)**

Run: `npm test`
Expected: `✓ redirects`, `✓ links`, `✓ content`, and exit 0.

Then run `npm start`, open `http://localhost:8080/notes/show-your-work/`, and compare it to the note-page mockup.

Expected:
- Cover on the left.
- `h1`.
- `by:`, `categories:` and `finished:` labels in red-orange mono.
- `#creativity #sharing`.
- `finished: 2026-01-11`.
- The body starts with the book link paragraph, with no "January, 2026" line.

Stop the server.

- [ ] **Step 10: Commit**

```bash
git add scripts/fetch-covers.js src/assets/covers src/notes src/_includes/note.njk
git commit -m "Add book note fields, Open Library covers and note page header"
```

---

### Task 5: Notes cover grid

**Files:**
- Create: `src/_includes/card.njk`
- Modify: `src/notes.njk`

**Interfaces:**
- Consumes:
  - `collections.notesByFinished`.
  - On each note: `note.data.coverUrl`, `.title`, `.author`, `.categories`, `.summary`, `.finished`, `.rating`.
  - The CSS classes from Task 3.
- Produces, used by the Task 6 script:
  - Element `#notes-grid` (a `<ul>`) whose `<li>` children carry:
    - `data-finished`: `"YYYY-MM-DD"`.
    - `data-title`: lowercased title.
    - `data-rating`: `"0"`–`"10"`, where `"0"` means no rating.
  - Element `#notes-sort` (rendered `hidden`), containing `button[data-sort="finished"|"title"|"rating"]` with `aria-pressed`.

- [ ] **Step 1: Write `src/_includes/card.njk`**

```njk
<li class="card" data-finished="{{ note.data.finished }}" data-title="{{ note.data.title | lower }}" data-rating="{{ note.data.rating or 0 }}">
  <a href="{{ note.url }}">
    {% if note.data.coverUrl %}
    <img class="cover" src="{{ note.data.coverUrl }}" alt="" width="200" height="300" loading="lazy">
    {% else %}
    <span class="cover tile" aria-hidden="true">{{ note.data.title }}</span>
    {% endif %}
    <h2 class="card-title">{{ note.data.title }}</h2>
  </a>
  <p class="meta card-author">{{ note.data.author }}</p>
  <p class="meta tags">{% for c in note.data.categories %}<span class="tag">{{ c }}</span>{% endfor %}</p>
  <p class="card-summary">{{ note.data.summary }}</p>
</li>
```

- [ ] **Step 2: Replace `src/notes.njk` with the grid**

```njk
---
title: "Book Notes"
layout: "base.njk"
permalink: "/notes/"
description: "Notes and highlights from books I've read."
---
<div class="notes-head">
  <h1>Book Notes</h1>
  <div class="sort" id="notes-sort" role="group" aria-label="Sort notes" hidden>
    <span class="meta">sort:</span>
    <button type="button" data-sort="finished" aria-pressed="true">date read</button>
    <button type="button" data-sort="title" aria-pressed="false">title</button>
    <button type="button" data-sort="rating" aria-pressed="false">rating</button>
  </div>
</div>
<ul class="grid" id="notes-grid">
  {%- for note in collections.notesByFinished %}
  {% include "card.njk" %}
  {%- endfor %}
</ul>
```

(The sort script tag is added in Task 6.)

- [ ] **Step 3: Build and run every check**

Run: `npm test`
Expected: `✓ redirects`, `✓ links` (which verifies every card's cover `src`) and `✓ content`.

- [ ] **Step 4: Card order and data attributes**

```bash
grep -o 'data-finished="[^"]*" data-title="[^"]*"' build/notes/index.html
```

Expected: 8 lines, newest first:

```
data-finished="2026-02-01" data-title="what do you want out of life?"
data-finished="2026-01-25" data-title="principles (life)"
data-finished="2026-01-11" data-title="show your work"
data-finished="2025-12-31" data-title="extreme ownership"
data-finished="2025-12-27" data-title="don't believe everything you think"
data-finished="2025-12-25" data-title="courage to be disliked"
data-finished="2025-11-29" data-title="useful, not true"
data-finished="2025-11-25" data-title="deep work"
```

(`'` may appear as `&#39;` because of autoescaping. Either is fine.)

- [ ] **Step 5: Sort controls are hidden without JS (Review Focus 3)**

```bash
grep -c 'id="notes-sort" role="group" aria-label="Sort notes" hidden' build/notes/index.html
```

Expected: `1`

- [ ] **Step 6: Missing cover renders a tile (Review Focus 1)**

```bash
mv src/assets/covers/deepwork.jpg src/assets/covers/deepwork.jpg.bak
npx @11ty/eleventy --quiet
grep -c 'cover tile' build/notes/index.html build/notes/deepwork/index.html
mv src/assets/covers/deepwork.jpg.bak src/assets/covers/deepwork.jpg
npm run build >/dev/null && grep -c 'cover tile' build/notes/index.html
```

Expected:
- `build/notes/index.html:1` and `build/notes/deepwork/index.html:1` while the cover is missing.
- `0` after it is restored.

- [ ] **Step 7: Rating never reaches visible text (Review Focus 4)**

Temporarily add `rating: 9` to `src/notes/deepwork.md` front matter, then:

```bash
npm run build >/dev/null
grep -c 'rating' build/notes/deepwork/index.html
grep -o 'data-rating="[^"]*"' build/notes/index.html | sort | uniq -c
sed 's/<[^>]*>//g' build/notes/index.html | grep -c '\b9\b'
```

Expected:
- `0`: the note page contains no "rating" at all.
- `1 data-rating="9"` and `7 data-rating="0"`.
- `0`: no visible text node is "9".

Then remove the temporary `rating: 9` line.

- [ ] **Step 8: Visual check against the mockup, desktop and 320px phone (Review Focus 5)**

Run `npm start` and open `http://localhost:8080/notes/`.

Expected on desktop:
- A 4-column cover grid at 960px.
- Each card shows title, author in mono, `#tags` with red `#`, and the summary.
- No sort buttons visible yet.

Expected at 320px wide:
- A 2-column grid.
- No horizontal scroll.

Stop the server.

- [ ] **Step 9: Commit**

```bash
git add src/_includes/card.njk src/notes.njk
git commit -m "Add notes cover grid"
```

---

### Task 6: Sort controls

**Files:**
- Create: `tests/notes-sort.test.js`, `src/assets/js/notes-sort.js`
- Modify: `src/notes.njk` (script tag), `package.json` (`test` script)

**Interfaces:**
- Consumes: `#notes-grid`, `#notes-sort` and the `data-*` attributes from Task 5.
- Produces, exported only under Node for tests:
  - `parseSort(search: string) → "finished" | "title" | "rating"`
  - `sortItems(items: Array<{dataset: {finished, title, rating}}>, key) → new sorted array`

- [ ] **Step 1: Write the failing tests**

`tests/notes-sort.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { parseSort, sortItems } = require("../src/assets/js/notes-sort.js");

const li = (title, finished, rating) => ({ dataset: { title, finished, rating: String(rating) } });
const items = [
  li("deep work", "2025-11-25", 7),
  li("principles (life)", "2026-01-25", 9),
  li("show your work", "2026-01-11", 0),
  li("extreme ownership", "2025-12-31", 9),
];
const titles = (xs) => xs.map((x) => x.dataset.title);

test("parseSort accepts known keys", () => {
  assert.equal(parseSort("?sort=title"), "title");
  assert.equal(parseSort("?sort=rating"), "rating");
  assert.equal(parseSort("?sort=finished"), "finished");
});

test("parseSort falls back to finished for missing or unknown values", () => {
  assert.equal(parseSort(""), "finished");
  assert.equal(parseSort("?sort="), "finished");
  assert.equal(parseSort("?sort=bogus"), "finished");
  assert.equal(parseSort("?sort=TITLE"), "finished");
  assert.equal(parseSort("?other=1"), "finished");
});

test("finished sorts newest first", () => {
  assert.deepEqual(titles(sortItems(items, "finished")), [
    "principles (life)", "show your work", "extreme ownership", "deep work",
  ]);
});

test("title sorts A to Z", () => {
  assert.deepEqual(titles(sortItems(items, "title")), [
    "deep work", "extreme ownership", "principles (life)", "show your work",
  ]);
});

test("rating sorts highest first, unrated last, ties keep input order", () => {
  assert.deepEqual(titles(sortItems(items, "rating")), [
    "principles (life)", "extreme ownership", "deep work", "show your work",
  ]);
});

test("sortItems does not mutate its input", () => {
  const before = titles(items);
  sortItems(items, "title");
  assert.deepEqual(titles(items), before);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test tests/`
Expected: FAIL with `Cannot find module '../src/assets/js/notes-sort.js'`.

- [ ] **Step 3: Write `src/assets/js/notes-sort.js`**

```js
// Sort controls for /notes/. The server renders cards newest-first and the
// controls hidden; this script reveals them, applies ?sort=, and keeps the URL in sync.
(function () {
  var KEYS = ["finished", "title", "rating"];
  var DEFAULT = "finished";

  function parseSort(search) {
    var value = new URLSearchParams(search).get("sort");
    return KEYS.indexOf(value) === -1 ? DEFAULT : value;
  }

  var COMPARE = {
    finished: function (a, b) { return b.dataset.finished.localeCompare(a.dataset.finished); },
    title: function (a, b) { return a.dataset.title.localeCompare(b.dataset.title); },
    rating: function (a, b) { return Number(b.dataset.rating) - Number(a.dataset.rating); },
  };

  // Array.prototype.sort is stable, so ties keep the server's order.
  function sortItems(items, key) {
    return items.slice().sort(COMPARE[key]);
  }

  function init() {
    var grid = document.getElementById("notes-grid");
    var controls = document.getElementById("notes-sort");
    if (!grid || !controls) return;
    var buttons = Array.prototype.slice.call(controls.querySelectorAll("button[data-sort]"));

    function apply(key, updateUrl) {
      sortItems(Array.prototype.slice.call(grid.children), key).forEach(function (li) {
        grid.appendChild(li);
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.sort === key));
      });
      if (updateUrl) {
        var url = new URL(window.location.href);
        if (key === DEFAULT) url.searchParams.delete("sort");
        else url.searchParams.set("sort", key);
        history.replaceState(null, "", url);
      }
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.dataset.sort, true); });
    });
    controls.hidden = false;
    apply(parseSort(window.location.search), false);
  }

  if (typeof module === "object" && module.exports) {
    module.exports = { parseSort: parseSort, sortItems: sortItems };
  } else {
    init();
  }
})();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test tests/`
Expected: `# pass 6`, `# fail 0`.

- [ ] **Step 5: Load the script on /notes/ and add the tests to `npm test`**

Append to the end of `src/notes.njk`:

```njk
<script src="/assets/js/notes-sort.js" defer></script>
```

Set the `test` script in `package.json` to:

```json
    "test": "npm run build && node scripts/check.js && node --test tests/",
```

Run: `npm test`
Expected: `✓ redirects`, `✓ links` (which confirms `/assets/js/notes-sort.js` is built), `✓ content`, `# pass 6`, and exit 0.

- [ ] **Step 6: Try it in the browser**

Run `npm start`. At `http://localhost:8080/notes/`:

| Action | Expected |
|---|---|
| Load the page | `sort: date read title rating` buttons are visible, and `date read` is highlighted |
| Click `title` | Cards reorder A–Z (Courage… first), and the URL becomes `/notes/?sort=title` |
| Click `rating` | Order is unchanged from date read (no ratings yet, so all ties), and the URL is `?sort=rating` |
| Click `date read` | Cards go back to newest first, and the URL is plain `/notes/` |
| Reload `/notes/?sort=title` | Opens sorted A–Z with `title` highlighted |
| Open `/notes/?sort=nonsense` | Default order, with `date read` highlighted |
| Disable JS in devtools and reload | No buttons, cards newest first |

Stop the server.

- [ ] **Step 7: Commit**

```bash
git add tests/notes-sort.test.js src/assets/js/notes-sort.js src/notes.njk package.json
git commit -m "Add client-side sort controls to the notes grid"
```

---

### Task 7: CI on Node 22 with checks

**Files:**
- Modify: `.github/workflows/static.yml`, `package.json`

**Interfaces:**
- Consumes: `npm test` (which builds into `build/`).

- [ ] **Step 1: Pin the Node version**

Add to `package.json` (top level, after `"license"`):

```json
  "engines": {
    "node": ">=22"
  },
```

- [ ] **Step 2: Replace the `build` job steps in `.github/workflows/static.yml`**

Replace the `steps:` list under `jobs.build` with:

```yaml
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build and check the site
        run: npm test
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          # Upload build directory
          path: 'build'
```

Leave the `on`, `permissions`, `concurrency` and `deploy` blocks unchanged.

- [ ] **Step 3: Verify locally the way CI will run**

```bash
rm -rf node_modules && npm ci && npm test
node -e "const y=require('fs').readFileSync('.github/workflows/static.yml','utf8'); for (const s of ['checkout@v4','setup-node@v4',\"node-version: '22'\",'npm ci','npm test']) console.log(y.includes(s) ? 'ok  ' : 'MISSING', s)"
```

Expected:
- `npm test` passes.
- Five `ok` lines.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/static.yml package.json
git commit -m "Run checks on Node 22 in the Pages workflow"
```

---

### Task 8: Local preview for user feedback

- [ ] **Step 1: Run the full suite one last time**

Run: `npm test`
Expected: all three checks `✓` and `# pass 6`.

- [ ] **Step 2: Serve the site**

Run `npm start` in the background and give the user `http://localhost:8080/`.

List what they should look at and the draft content they need to replace:
- Homepage intro.
- 8 `summary` one-liners.
- `categories`.
- `finished` dates, which are seeded from the date each post was written.
- ISBN editions.
- Book titles. These are kept as the user wrote them, e.g. "Courage to be disliked", not the published "The Courage to Be Disliked".
- Ratings, which are not set yet.
- Optional `description` lines for writing and now posts.
