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
