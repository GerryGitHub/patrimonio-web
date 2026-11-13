/**
 * Normaliza texto para búsquedas locales.
 *
 * <p>Quita acentos, unifica mayúsculas y recorta espacios para que «Acción» y
 * «accion» se consideren equivalentes al filtrar listados.</p>
 */
export function normalizarTexto(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim();
}
