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
