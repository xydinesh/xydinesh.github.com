module.exports = {
  layout: "article.njk",
  tags: ["now"],
  eleventyComputed: {
    permalink: (data) => `/now/${data.page.fileSlug}/`,
  },
};
