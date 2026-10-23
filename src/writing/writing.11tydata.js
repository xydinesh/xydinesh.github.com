const { isUnpublished } = require("../../scripts/drafts.js");

module.exports = {
  layout: "article.njk",
  tags: ["writing"],
  eleventyComputed: {
    eleventyExcludeFromCollections: (data) => (isUnpublished(data) ? true : undefined),
    permalink: (data) => (isUnpublished(data) ? false : `/writing/${data.page.fileSlug}/`),
  },
};
