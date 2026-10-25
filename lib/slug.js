// =============================================================================
// lib/slug.js  –  v0.2.0
// Prevod textu na bezpečný tvar do adresy (URL): bez diakritiky, malé písmená,
// pomlčky namiesto medzier.  "Ekranoplán Lun" -> "ekranoplan-lun"
// =============================================================================

export function slugify(text) {
  return String(text)
    .replace(/[łŁ]/g, 'l')
    .replace(/[đĐ]/g, 'd')
    .replace(/[øØ]/g, 'o')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Platný názov priečinka/súboru v obsahu: malé písmená, číslice, pomlčky. */
export function isValidSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
