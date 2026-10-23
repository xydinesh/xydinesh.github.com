#!/usr/bin/env node
// Post-build checks for xydinesh.com.
// Usage: node scripts/check.js [redirects] [links] [content]   (no args = all)
const fs = require("node:fs");
const path = require("node:path");
const matter = require("gray-matter");
const { isDraft } = require("./drafts.js");

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
  const drafts = [];
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

      if (isDraft(data)) {
        drafts.push(`src/${section}/${file}`);
        continue;
      }

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
  if (drafts.length) console.log(`  skipped ${drafts.length} draft(s): ${drafts.join(", ")}`);
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
