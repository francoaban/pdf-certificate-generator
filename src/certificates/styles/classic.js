import { resolveNameFont, resolveTextFont } from '../fonts.js'
import {
  PAGE_WIDTH,
  composeDateLine,
  drawCenteredText,
  drawCertificateLogo,
  drawDiamond,
  drawSignature,
  drawText,
  drawWrappedText,
  scaleFont,
} from '../shared.js'

const INK = [27, 42, 74]
const GOLD = [169, 133, 58]
const GOLD_SOFT = [201, 176, 112]
const MUTED = [122, 115, 104]

/**
 * Estilo 1 — Clásico dorado.
 * Marco ornamental, tipografía serif y nombre en Great Vibes.
 */
export const classicStyle = {
  id: 'clasico',
  name: 'Clásico dorado',
  description: 'Marco dorado, texto serif y caligrafía Great Vibes por defecto.',
  background: 'backgrounds/clasico.svg',
  fonts: {
    script: { family: 'GreatVibes', file: 'fonts/GreatVibes-Regular.ttf' },
  },

  draw(doc, { options, view, logo }) {
    const centerX = PAGE_WIDTH / 2
    const scale = (value, field) => scaleFont(value, options, field)

    drawCertificateLogo(doc, logo)

    drawCenteredText(doc, options.title, 50, {
      size: scale(31, 'titleSize'),
      font: resolveTextFont(options.titleFont, 'times'),
      style: 'bold',
      color: INK,
      charSpace: scale(2.6, 'titleSize'),
      maxWidth: 250,
    })

    drawCenteredText(doc, options.subtitle, 59, {
      size: scale(9.5, 'subtitleSize'),
      font: resolveTextFont(options.subtitleFont, 'helvetica'),
      color: GOLD,
      charSpace: scale(2.1, 'subtitleSize'),
      maxWidth: 240,
    })

    doc.setDrawColor(...GOLD_SOFT)
    doc.setLineWidth(0.35)
    doc.line(centerX - 42, 65, centerX + 42, 65)
    drawDiamond(doc, centerX, 65, 2.1, GOLD)

    drawCenteredText(doc, options.preText, 81, {
      size: scale(13, 'preTextSize'),
      font: 'times',
      style: 'italic',
      color: MUTED,
      maxWidth: 230,
    })

    drawCenteredText(doc, view.fullName, 103, {
      size: scale(44, 'nameSize'),
      font: resolveNameFont(options.nameFont, 'GreatVibes'),
      style: 'normal',
      color: INK,
      maxWidth: 220,
      minSize: 26,
    })

    if (view.docLine) {
      drawCenteredText(doc, view.docLine, 115.5, {
        size: scale(9, 'documentSize'),
        font: 'helvetica',
        color: MUTED,
        charSpace: scale(0.5, 'documentSize'),
        maxWidth: 200,
      })
    }

    doc.setDrawColor(...GOLD)
    doc.setLineWidth(0.3)
    doc.line(centerX - 75, 121, centerX + 75, 121)
    drawDiamond(doc, centerX, 121, 1.6, GOLD)

    const bodyEnd = drawWrappedText(doc, options.bodyText, centerX, 135.5, {
      width: 186,
      size: scale(11.2, 'bodySize'),
      font: resolveTextFont(options.bodyFont, 'times'),
      color: MUTED,
      lineHeight: 1.5,
    })

    const dateY = bodyEnd + 5.5
    drawText(doc, composeDateLine(options), PAGE_WIDTH - 30, dateY, {
      size: scale(9, 'dateSize'),
      font: 'times',
      style: 'italic',
      color: MUTED,
      align: 'right',
      maxWidth: 120,
    })

    const signatureY = Math.max(167, dateY + 10)

    drawSignature(doc, {
      centerX: 76,
      y: signatureY,
      width: 62,
      text: options.signatureLeft,
      lineColor: GOLD_SOFT,
      textColor: INK,
      font: 'times',
      style: 'italic',
      fontSize: scale(11.5, 'signatureSize'),
      image: options.signatureLeftImage,
    })

    drawSignature(doc, {
      centerX: 221,
      y: signatureY,
      width: 62,
      text: options.signatureRight,
      lineColor: GOLD_SOFT,
      textColor: INK,
      font: 'times',
      style: 'italic',
      fontSize: scale(11.5, 'signatureSize'),
      image: options.signatureRightImage,
    })
  },
}
