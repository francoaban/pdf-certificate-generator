import { botanicalStyle } from './botanical.js'
import { classicStyle } from './classic.js'
import { elegantStyle } from './elegant.js'
import { modernStyle } from './modern.js'

export const STYLES = [classicStyle, modernStyle, elegantStyle, botanicalStyle]

const STYLE_MAP = new Map(STYLES.map((style) => [style.id, style]))

/** Devuelve el estilo pedido; si no existe usa el clásico. */
export function getStyle(styleId) {
  return STYLE_MAP.get(styleId) || classicStyle
}

/** Metadatos listos para poblar un selector en la interfaz. */
export const CERTIFICATE_STYLES = STYLES.map(({ id, name, description, background }) => ({
  id,
  name,
  description,
  background,
}))
