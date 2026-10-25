// =============================================================================
// lib/transforms.js  –  v0.2.0
// Úpravy hotového HTML tesne pred zápisom na disk:
//   1. tabuľky sa obalia posuvným kontajnerom (na mobile nepretečú cez okraj),
//   2. HTML sa minifikuje (len pri `npm run build`, nie pri `npm start`).
// =============================================================================
import { minify } from 'html-minifier-terser';

const isHtml = (page) => Boolean(page?.outputPath && String(page.outputPath).endsWith('.html'));

export function wrapTables(html) {
  return html
    .replace(/<table(\s|>)/g, '<div class="table-wrap" tabindex="0"><table$1')
    .replace(/<\/table>/g, '</table></div>');
}

export function registerTransforms(eleventyConfig) {
  eleventyConfig.addTransform('wrapTables', function (content) {
    return isHtml(this.page) ? wrapTables(content) : content;
  });

  eleventyConfig.addTransform('minifyHtml', async function (content) {
    if (!isHtml(this.page)) return content;
    if (process.env.ELEVENTY_RUN_MODE === 'serve') return content;
    return minify(content, {
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      decodeEntities: true,
      useShortDoctype: true,
    });
  });
}
