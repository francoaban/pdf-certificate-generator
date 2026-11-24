export const TEXT_ALIGNMENTS = [
  { id: 'auto', label: 'Automática' },
  { id: 'left', label: 'Izquierda' },
  { id: 'center', label: 'Centro' },
  { id: 'right', label: 'Derecha' },
]

export const TEXT_ALIGNMENT_IDS = new Set(
  TEXT_ALIGNMENTS.map(({ id }) => id),
)

/** Resuelve `auto` o un valor inválido al comportamiento del estilo. */
export function resolveAlignment(value, fallback) {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value
  }
  return fallback
}
