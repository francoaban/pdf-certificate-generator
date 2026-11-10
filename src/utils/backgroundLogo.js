export const BACKGROUND_LOGO_WIDTH_FRACTION = 1 / 3
export const BACKGROUND_LOGO_MAX_HEIGHT_FRACTION = 0.6
export const BACKGROUND_LOGO_OPACITY = 0.18

/**
 * Calcula el rectángulo de la marca de agua del logo.
 *
 * Intenta que el logo ocupe un tercio del ancho de la página, centrado. Si por
 * su proporción supera el 60 % del alto, se reduce para no invadir los textos.
 */
export function fitLogoWatermark(
  logoRatio,
  pageWidth,
  pageHeight,
  {
    widthFraction = BACKGROUND_LOGO_WIDTH_FRACTION,
    maxHeightFraction = BACKGROUND_LOGO_MAX_HEIGHT_FRACTION,
  } = {},
) {
  const ratio = Number.isFinite(logoRatio) && logoRatio > 0 ? logoRatio : 1
  const maxWidth = pageWidth * widthFraction
  const maxHeight = pageHeight * maxHeightFraction

  let width = maxWidth
  let height = width / ratio
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }

  return {
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    width,
    height,
  }
}
