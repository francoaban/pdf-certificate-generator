const MARKER_RE = /\*+/g
const RICH_TEXT_PAIR_RE = /\*\*\*[\s\S]+?\*\*\*|\*\*[\s\S]+?\*\*|\*[\s\S]+?\*/
const STANDARD_FONTS = new Set([
  'helvetica',
  'times',
  'courier',
  'symbol',
  'zapfdingbats',
])
export const SYNTHETIC_BOLD_OFFSET = 0.18

export function hasBoldMarkup(text) {
  return typeof text === 'string' && text.includes('**')
}

export function hasRichTextMarkup(text) {
  return typeof text === 'string' && RICH_TEXT_PAIR_RE.test(text)
}

function markerFlags(length) {
  if (length >= 3) return { bold: true, italic: true }
  if (length === 2) return { bold: true, italic: false }
  return { bold: false, italic: true }
}

function findClosingMarker(source, from, length) {
  MARKER_RE.lastIndex = from
  let match
  while ((match = MARKER_RE.exec(source)) !== null) {
    if (match[0].length === length) return match.index
  }
  return -1
}

function mergeSegments(segments) {
  const merged = []
  for (const segment of segments) {
    if (!segment.text) continue
    const previous = merged[merged.length - 1]
    if (
      previous &&
      previous.bold === segment.bold &&
      previous.italic === segment.italic
    ) {
      previous.text += segment.text
    } else {
      merged.push({ ...segment })
    }
  }
  return merged
}

function parseRichSource(source, inherited) {
  const segments = []
  let cursor = 0

  while (cursor < source.length) {
    MARKER_RE.lastIndex = cursor
    const open = MARKER_RE.exec(source)
    if (!open) break

    const marker = open[0]
    const openIndex = open.index
    if (openIndex > cursor) {
      segments.push({
        text: source.slice(cursor, openIndex),
        bold: inherited.bold,
        italic: inherited.italic,
      })
    }

    const closeIndex = findClosingMarker(
      source,
      openIndex + marker.length,
      marker.length,
    )

    if (closeIndex === -1) {
      // Marcador sin cierre: se conserva como texto literal.
      segments.push({
        text: marker,
        bold: inherited.bold,
        italic: inherited.italic,
      })
      cursor = openIndex + marker.length
      continue
    }

    const flags = markerFlags(marker.length)
    const innerInherited = {
      bold: inherited.bold || flags.bold,
      italic: inherited.italic || flags.italic,
    }
    const inner = source.slice(openIndex + marker.length, closeIndex)
    segments.push(...parseRichSource(inner, innerInherited))
    cursor = closeIndex + marker.length
  }

  if (cursor < source.length) {
    segments.push({
      text: source.slice(cursor),
      bold: inherited.bold,
      italic: inherited.italic,
    })
  }

  return segments
}

/**
 * Convierte el texto con marcadores en segmentos con formato.
 * `**negrita**`, `*cursiva*` y `***negrita y cursiva***` se pueden combinar.
 */
export function parseRichText(text) {
  const source = String(text ?? '')
  if (!source) return []
  if (!source.includes('*')) {
    return [{ text: source, bold: false, italic: false }]
  }

  const segments = mergeSegments(
    parseRichSource(source, { bold: false, italic: false }),
  )
  return segments.length
    ? segments
    : [{ text: source, bold: false, italic: false }]
}

/** Compatibilidad: devuelve solo la información de negrita. */
export function parseBoldText(text) {
  return parseRichText(text).map(({ text: value, bold }) => ({
    text: value,
    bold,
  }))
}

export function stripRichTextMarkup(text) {
  return parseRichText(text)
    .map((segment) => segment.text)
    .join('')
}

/** Compatibilidad con el nombre anterior. */
export function stripBoldMarkup(text) {
  return stripRichTextMarkup(text)
}

export function isStandardFont(font = '') {
  return STANDARD_FONTS.has(String(font).toLowerCase())
}

/**
 * Las fuentes TTF personalizadas solo están registradas en estilo normal.
 * Para evitar errores de jsPDF, se usa normal y se simula la negrita.
 */
export function safeFontStyle(font, style = 'normal') {
  if (isStandardFont(font)) return style
  return 'normal'
}

function combineFontStyle(style, bold, italic) {
  const base = String(style || 'normal')
  const wantBold = base.includes('bold') || bold
  const wantItalic = base.includes('italic') || italic
  if (wantBold && wantItalic) return 'bolditalic'
  if (wantBold) return 'bold'
  if (wantItalic) return 'italic'
  return 'normal'
}

/**
 * Resuelve el estilo de un segmento. Las fuentes estándar admiten negrita,
 * cursiva y ambas; las TTF personalizadas conservan su estilo normal.
 */
export function resolveFontStyle(
  font,
  style = 'normal',
  bold = false,
  italic = false,
) {
  if (!isStandardFont(font)) return 'normal'
  return combineFontStyle(style, bold, italic)
}

export function needsSyntheticBold(font, style = 'normal', bold = false) {
  return !isStandardFont(font) && (bold || String(style).includes('bold'))
}

function segmentWidth(doc, text, charSpace = 0) {
  if (!text) return 0
  return doc.getTextWidth(text) + (charSpace ? charSpace * text.length : 0)
}

function applySegmentFont(doc, font, style, bold, italic) {
  doc.setFont(font, resolveFontStyle(font, style, bold, italic))
}

function drawSegment(doc, font, style, bold, italic, text, x, y) {
  applySegmentFont(doc, font, style, bold, italic)
  doc.text(text, x, y, { align: 'left' })
  if (needsSyntheticBold(font, style, bold)) {
    doc.text(text, x + SYNTHETIC_BOLD_OFFSET, y, { align: 'left' })
  }
}

export function drawRichText(
  doc,
  text,
  x,
  y,
  {
    size = 12,
    font = 'times',
    style = 'normal',
    color = [0, 0, 0],
    align = 'left',
    charSpace = 0,
    maxWidth,
    minSize = 8,
  } = {},
) {
  const segments = parseRichText(text)
  if (!segments.length) return size

  const measure = () =>
    segments.reduce((total, segment) => {
      applySegmentFont(doc, font, style, segment.bold, segment.italic)
      return total + segmentWidth(doc, segment.text, charSpace)
    }, 0)
  const measureVisible = () => {
    const width = measure()
    return width && charSpace ? width - charSpace : width
  }

  let finalSize = size
  doc.setFontSize(finalSize)
  if (maxWidth) {
    while (finalSize > minSize && measureVisible() > maxWidth) {
      finalSize = Math.max(minSize, Math.round((finalSize - 0.5) * 10) / 10)
      doc.setFontSize(finalSize)
    }
  }

  doc.setTextColor(color[0], color[1], color[2])
  if (charSpace) doc.setCharSpace(charSpace)

  const totalWidth = measureVisible()
  let cursor =
    align === 'center'
      ? x - totalWidth / 2
      : align === 'right'
        ? x - totalWidth
        : x

  for (const segment of segments) {
    if (!segment.text) continue
    drawSegment(
      doc,
      font,
      style,
      segment.bold,
      segment.italic,
      segment.text,
      cursor,
      y,
    )
    cursor += segmentWidth(doc, segment.text, charSpace)
  }

  if (charSpace) doc.setCharSpace(0)
  return finalSize
}

function tokenizeRichText(text) {
  const tokens = []
  for (const segment of parseRichText(text)) {
    const parts = segment.text.split(/(\r?\n|[ \t]+)/)
    for (const part of parts) {
      if (!part) continue
      if (/^\r?\n$/.test(part)) {
        tokens.push({ type: 'break' })
      } else if (/^[ \t]+$/.test(part)) {
        tokens.push({
          type: 'space',
          text: part,
          bold: segment.bold,
          italic: segment.italic,
        })
      } else {
        tokens.push({
          type: 'word',
          text: part,
          bold: segment.bold,
          italic: segment.italic,
        })
      }
    }
  }
  return tokens
}

function measureToken(doc, token, font, style) {
  if (token.type === 'break') return 0
  applySegmentFont(doc, font, style, token.bold, token.italic)
  return segmentWidth(doc, token.text)
}

function buildRichLines(doc, text, width, { font, style, size }) {
  const tokens = tokenizeRichText(text)
  const lines = []
  let line = []
  let lineWidth = 0
  let pendingSpace = ''

  const flush = () => {
    lines.push(line)
    line = []
    lineWidth = 0
  }

  doc.setFontSize(size)

  for (const token of tokens) {
    if (token.type === 'break') {
      flush()
      pendingSpace = ''
      continue
    }

    if (token.type === 'space') {
      pendingSpace += token.text
      continue
    }

    const spaceWidth = pendingSpace
      ? measureToken(doc, { type: 'space', text: pendingSpace, bold: false }, font, style)
      : 0
    const wordWidth = measureToken(doc, token, font, style)

    if (line.length && lineWidth + spaceWidth + wordWidth > width) {
      flush()
      pendingSpace = ''
    }

    if (line.length && pendingSpace) {
      line.push({ type: 'space', text: pendingSpace, bold: false })
      lineWidth += spaceWidth
    }

    line.push(token)
    lineWidth += wordWidth
    pendingSpace = ''
  }

  if (line.length || !lines.length) lines.push(line)
  return lines
}

function mergeLineTokens(line) {
  const merged = []
  for (const token of line) {
    if (!token.text) continue
    const previous = merged[merged.length - 1]
    const previousIsSpace = previous?.type === 'space'
    const tokenIsSpace = token.type === 'space'

    if (
      previous &&
      ((previous.bold === token.bold && previous.italic === token.italic) ||
        previousIsSpace ||
        tokenIsSpace)
    ) {
      previous.text += token.text
      previous.bold = tokenIsSpace ? previous.bold : token.bold
      previous.italic = tokenIsSpace ? previous.italic : token.italic
      previous.type = previousIsSpace && !tokenIsSpace ? token.type : previous.type
    } else {
      merged.push({ ...token })
    }
  }
  return merged
}

function drawRichLine(doc, line, x, y, { font, style, align }) {
  const tokens = mergeLineTokens(line)
  const totalWidth = tokens.reduce((total, token) => {
    applySegmentFont(doc, font, style, token.bold, token.italic)
    return total + segmentWidth(doc, token.text)
  }, 0)

  let cursor =
    align === 'center'
      ? x - totalWidth / 2
      : align === 'right'
        ? x - totalWidth
        : x

  for (const token of tokens) {
    drawSegment(
      doc,
      font,
      style,
      token.bold,
      token.italic,
      token.text,
      cursor,
      y,
    )
    cursor += segmentWidth(doc, token.text)
  }
}

export function drawRichWrappedText(
  doc,
  text,
  x,
  y,
  {
    width = 180,
    size = 11,
    font = 'times',
    style = 'normal',
    color = [0, 0, 0],
    align = 'center',
    lineHeight = 1.45,
    maxLines,
  } = {},
) {
  if (!text) return y

  let lines = buildRichLines(doc, text, width, { font, style, size })
  if (maxLines) lines = lines.slice(0, maxLines)

  doc.setFontSize(size)
  doc.setTextColor(color[0], color[1], color[2])

  const lineStep = size * 0.352778 * lineHeight
  lines.forEach((line, index) => {
    drawRichLine(doc, line, x, y + index * lineStep, { font, style, align })
  })

  return y + lines.length * lineStep
}
