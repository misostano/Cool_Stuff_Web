// =============================================================================
// eleventy.config.js  –  v0.2.0
// Hlavné nastavenie generátora Eleventy. Vstup: src/, výstup: _site/.
// =============================================================================
import site from './src/_data/site.js';
import { log, resetLog, writeLog } from './lib/log.js';
import { createModel } from './lib/model.js';
import { registerCollections } from './lib/collections.js';
import { registerFilters } from './lib/filters.js';
import { registerTransforms } from './lib/transforms.js';

export default function (eleventyConfig) {
  const model = createModel(site);

  // Pri každom builde začíname s čistým modelom a čistým logom.
  eleventyConfig.on('eleventy.before', () => {
    model.reset();
    resetLog();
    log.info(`Začiatok buildu (režim: ${process.env.ELEVENTY_RUN_MODE || 'neznámy'}, adresa: ${site.url})`);
  });

  eleventyConfig.on('eleventy.after', ({ results }) => {
    const pages = Array.isArray(results) ? results.length : 0;
    log.info(`Zapísaných súborov: ${pages}`);
    const file = writeLog();
    console.log(`[web] Log buildu: ${file}`);
  });

  registerFilters(eleventyConfig, model, site);
  registerCollections(eleventyConfig, model);
  registerTransforms(eleventyConfig);

  // Súbory, ktoré sa len skopírujú (obrázky, ikona).
  eleventyConfig.addPassthroughCopy({ 'src/assets/img': 'assets/img' });
  eleventyConfig.addPassthroughCopy({ 'src/assets/favicon.svg': 'favicon.svg' });

  // CSS a JS sa vkladajú priamo do stránok, preto ich sledujeme pri `npm start`.
  eleventyConfig.addWatchTarget('src/assets/css/');
  eleventyConfig.addWatchTarget('src/assets/js/');
  eleventyConfig.addWatchTarget('src/_data/palette.js');

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['md', 'njk'],
    // V Markdowne sa nevyhodnocujú šablónové značky – môžete voľne písať { } aj {{ }}.
    markdownTemplateEngine: false,
    htmlTemplateEngine: 'njk',
  };
}
