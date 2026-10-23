module.exports = {
  layout: "article.njk",
  tags: ["writing"],
  eleventyComputed: {
    permalink: (data) => `/writing/${data.page.fileSlug}/`,
  },
};
