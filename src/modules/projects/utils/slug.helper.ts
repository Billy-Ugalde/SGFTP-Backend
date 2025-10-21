/**
 * Genera un slug a partir de un texto
 * Convierte a minúsculas, reemplaza espacios y caracteres especiales
 * @param text - Texto a convertir en slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Reemplazar caracteres con acentos
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Reemplazar espacios y guiones bajos con guiones
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-')
    // Eliminar caracteres especiales
    .replace(/[^\w\-]+/g, '')
    // Reemplazar múltiples guiones con uno solo
    .replace(/\-\-+/g, '-')
    // Eliminar guiones al inicio y al final
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Genera un slug único agregando un sufijo numérico si es necesario
 * @param baseSlug - Slug base
 * @param existingSlugs - Array de slugs existentes
 * @returns Slug único
 */
export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  // Mientras el slug exista, agregar un sufijo numérico
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
