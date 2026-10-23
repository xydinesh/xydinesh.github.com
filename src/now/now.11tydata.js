const { isUnpublished } = require("../../scripts/drafts.js");

module.exports = {
  layout: "article.njk",
  tags: ["now"],
  eleventyComputed: {
    eleventyExcludeFromCollections: (data) => (isUnpublished(data) ? true : undefined),
    permalink: (data) => (isUnpublished(data) ? false : `/now/${data.page.fileSlug}/`),
  },
};
