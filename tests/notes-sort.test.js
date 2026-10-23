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

test("ties fall back to newest finished, whatever order the cards are currently in", () => {
  const afterTitleSort = sortItems(items, "title");
  assert.deepEqual(titles(sortItems(afterTitleSort, "rating")), [
    "principles (life)", "extreme ownership", "deep work", "show your work",
  ]);
  const unrated = items.map((x) => li(x.dataset.title, x.dataset.finished, 0));
  assert.deepEqual(titles(sortItems(sortItems(unrated, "title"), "rating")), [
    "principles (life)", "show your work", "extreme ownership", "deep work",
  ]);
});
