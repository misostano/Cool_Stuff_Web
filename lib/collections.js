// =============================================================================
// lib/collections.js  –  v0.2.0
// Kolekcie, z ktorých Eleventy vytvára generované stránky:
//   langPages    – stránky za každý jazyk (tagy, kanál)
//   archivePages – strany archívu (stránkovanie po site.postsPerPage)
//   tagPages     – jedna stránka pre každý tag v každom jazyku
// =============================================================================

export function registerCollections(eleventyConfig, model) {
  eleventyConfig.addCollection('langPages', (api) => model.ensure(api).langPages);
  eleventyConfig.addCollection('archivePages', (api) => model.ensure(api).archivePages);
  eleventyConfig.addCollection('tagPages', (api) => model.ensure(api).tagPages);
}
