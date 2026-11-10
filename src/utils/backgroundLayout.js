/**
 * Calcula el rectángulo donde se dibuja un fondo dentro de la página.
 *
 * - `cover`: llena la página y recorta el excedente.
 * - `contain`: muestra la imagen completa y deja márgenes.
 *
 * En ambos casos se conserva la relación de aspecto y el resultado queda
 * centrado. Si faltan dimensiones, se usa la página completa.
 */
export function fitBackground(
  imageWidth,
  imageHeight,
  pageWidth,
  pageHeight,
  fit = 'cover',
) {
  const fullPage = { x: 0, y: 0, width: pageWidth, height: pageHeight }
  const width = Number(imageWidth)
  const height = Number(imageHeight)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return fullPage
  }

  // Los fondos de los estilos son A4 a 1123×794, que difiere de 297×210 mm en
  // menos de 0,01 mm. Tratarlos como coincidencia evita recortes imperceptibles.
  if (Math.abs(width / height - pageWidth / pageHeight) < 0.001) {
    return fullPage
  }

  const scale =
    fit === 'contain'
      ? Math.min(pageWidth / width, pageHeight / height)
      : Math.max(pageWidth / width, pageHeight / height)

  const drawWidth = width * scale
  const drawHeight = height * scale

  return {
    x: (pageWidth - drawWidth) / 2,
    y: (pageHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  }
}
