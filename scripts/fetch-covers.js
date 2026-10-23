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
