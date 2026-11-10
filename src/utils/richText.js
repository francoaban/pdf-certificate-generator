const BOLD_MARKER = '**'
const BOLD_PATTERN = /\*\*([\s\S]+?)\*\*/g
const STANDARD_FONTS = new Set([
  'helvetica',
  'times',
  'courier',
  'symbol',
  'zapfdingbats',
])
export const SYNTHETIC_BOLD_OFFSET = 0.18
const POINTS_TO_MM = 0.352778

export function hasBoldMarkup(text) {
  return typeof text === 'string' && text.includes(BOLD_MARKER)
}

export function parseBoldText(text) {
  const source = String(text ?? '')
  if (!source) return []
  if (!source.includes(BOLD_MARKER)) return [{ text: source, bold: false }]

  const segments = []
  let cursor = 0
  let match
  BOLD_PATTERN.lastIndex = 0

  while ((match = BOLD_PATTERN.exec(source)) !== null) {
    if (match.index > cursor) {
      segments.push({ text: source.slice(cursor, match.index), bold: false })
    }
    if (match[1]) segments.push({ text: match[1], bold: true })
    cursor = match.index + match[0].length
  }

  if (cursor < source.length) {
    segments.push({ text: source.slice(cursor), bold: false })
  }

  return segments.length ? segments : [{ text: source, bold: false }]
}

export function stripBoldMarkup(text) {
  return parseBoldText(text)
    .map((segment) => segment.text)
    .join('')
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

export function needsSyntheticBold(font, style = 'normal', bold = false) {
  return !isStandardFont(font) && (bold || String(style).includes('bold'))
}

function segmentWidth(doc, text, charSpace = 0) {
  if (!text) return 0
  return doc.getTextWidth(text) + (charSpace ? charSpace * POINTS_TO_MM * text.length : 0)
}

function applySegmentFont(doc, font, style, bold) {
  const boldStyle = isStandardFont(font) && bold
    ? style === 'italic' || style === 'bolditalic'
      ? 'bolditalic'
      : 'bold'
    : safeFontStyle(font, style)
  doc.setFont(font, boldStyle)
}

function drawSegment(doc, font, style, bold, text, x, y) {
  applySegmentFont(doc, font, style, bold)
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
  const segments = parseBoldText(text)
  if (!segments.length) return size

  const measure = () =>
    segments.reduce((total, segment) => {
      applySegmentFont(doc, font, style, segment.bold)
      return total + segmentWidth(doc, segment.text, charSpace)
    }, 0)

  let finalSize = size
  doc.setFontSize(finalSize)
  if (maxWidth) {
    while (finalSize > minSize && measure() > maxWidth) {
      finalSize = Math.max(minSize, Math.round((finalSize - 0.5) * 10) / 10)
      doc.setFontSize(finalSize)
    }
  }

  doc.setTextColor(color[0], color[1], color[2])
  if (charSpace) doc.setCharSpace(charSpace)

  const totalWidth = measure()
  let cursor =
    align === 'center'
      ? x - totalWidth / 2
      : align === 'right'
        ? x - totalWidth
        : x

  for (const segment of segments) {
    if (!segment.text) continue
    drawSegment(doc, font, style, segment.bold, segment.text, cursor, y)
    cursor += segmentWidth(doc, segment.text, charSpace)
  }

  if (charSpace) doc.setCharSpace(0)
  return finalSize
}

function tokenizeRichText(text) {
  const tokens = []
  for (const segment of parseBoldText(text)) {
    const parts = segment.text.split(/(\r?\n|[ \t]+)/)
    for (const part of parts) {
      if (!part) continue
      if (/^\r?\n$/.test(part)) {
        tokens.push({ type: 'break' })
      } else if (/^[ \t]+$/.test(part)) {
        tokens.push({ type: 'space', text: part, bold: false })
      } else {
        tokens.push({ type: 'word', text: part, bold: segment.bold })
      }
    }
  }
  return tokens
}

function measureToken(doc, token, font, style) {
  if (token.type === 'break') return 0
  applySegmentFont(doc, font, style, token.bold)
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
      (previous.bold === token.bold || previousIsSpace || tokenIsSpace)
    ) {
      previous.text += token.text
      previous.bold = tokenIsSpace ? previous.bold : token.bold
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
    applySegmentFont(doc, font, style, token.bold)
    return total + segmentWidth(doc, token.text)
  }, 0)

  let cursor =
    align === 'center'
      ? x - totalWidth / 2
      : align === 'right'
        ? x - totalWidth
        : x

  for (const token of tokens) {
    applySegmentFont(doc, font, style, token.bold)
    drawSegment(doc, font, style, token.bold, token.text, cursor, y)
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
