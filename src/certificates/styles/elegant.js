import { resolveNameFont, resolveTextFont } from '../fonts.js'
import {
  PAGE_WIDTH,
  SIGNATURE_BASELINE_Y,
  composeDateLine,
  drawCenteredText,
  drawCertificateLogo,
  drawDiamond,
  drawSignature,
  drawText,
  drawWrappedText,
  scaleFont,
} from '../shared.js'

const IVORY = [245, 234, 208]
const SOFT = [206, 196, 175]
const GOLD = [212, 175, 106]
const GOLD_DIM = [150, 128, 80]

/**
 * Estilo 3 — Elegante.
 * Fondo azul profundo, detalles dorados y nombre en Pinyon Script.
 */
export const elegantStyle = {
  id: 'elegante',
  name: 'Elegante',
  description: 'Fondo azul profundo, ornamentos dorados y caligrafía Pinyon Script por defecto.',
  background: 'backgrounds/elegante.svg',
  fonts: {
    script: { family: 'PinyonScript', file: 'fonts/PinyonScript-Regular.ttf' },
  },

  draw(doc, { options, view, logo }) {
    const centerX = PAGE_WIDTH / 2
    const scale = (value, field) => scaleFont(value, options, field)

    drawCertificateLogo(doc, logo)

    drawCenteredText(doc, options.title, 50, {
      size: scale(30, 'titleSize'),
      font: resolveTextFont(options.titleFont, 'times'),
      style: 'bold',
      color: IVORY,
      charSpace: scale(3, 'titleSize'),
      maxWidth: 250,
    })

    drawCenteredText(doc, options.subtitle, 58.5, {
      size: scale(8.8, 'subtitleSize'),
      font: resolveTextFont(options.subtitleFont, 'helvetica'),
      color: GOLD,
      charSpace: scale(2.6, 'subtitleSize'),
      maxWidth: 240,
    })

    doc.setDrawColor(...GOLD_DIM)
    doc.setLineWidth(0.3)
    doc.line(centerX - 35, 65, centerX + 35, 65)
    drawDiamond(doc, centerX, 65, 1.8, GOLD)

    drawCenteredText(doc, options.preText, 81, {
      size: scale(12, 'preTextSize'),
      font: 'times',
      style: 'italic',
      color: SOFT,
      maxWidth: 230,
    })

    drawCenteredText(doc, view.fullName, 103, {
      size: scale(47, 'nameSize'),
      font: resolveNameFont(options.nameFont, 'PinyonScript'),
      style: 'normal',
      color: GOLD,
      maxWidth: 215,
      minSize: 26,
    })

    if (view.docLine) {
      drawCenteredText(doc, view.docLine, 115.5, {
        size: scale(8.6, 'documentSize'),
        font: 'helvetica',
        color: SOFT,
        charSpace: scale(0.4, 'documentSize'),
        maxWidth: 200,
      })
    }

    doc.setDrawColor(...GOLD_DIM)
    doc.setLineWidth(0.3)
    doc.line(centerX - 90, 121, centerX + 90, 121)

    const bodyEnd = drawWrappedText(doc, options.bodyText, centerX, 135.5, {
      width: 184,
      size: scale(10.4, 'bodySize'),
      font: resolveTextFont(options.bodyFont, 'times'),
      color: SOFT,
      lineHeight: 1.5,
    })

    const dateY = bodyEnd + 5.5
    drawText(doc, composeDateLine(options), PAGE_WIDTH - 30, dateY, {
      size: scale(8.6, 'dateSize'),
      font: 'times',
      style: 'italic',
      color: [198, 177, 132],
      align: 'right',
      maxWidth: 120,
    })

    const signatureY = Math.max(SIGNATURE_BASELINE_Y, dateY + 10)

    drawSignature(doc, {
      centerX: 80,
      y: signatureY,
      width: 58,
      text: options.signatureLeft,
      lineColor: GOLD_DIM,
      textColor: IVORY,
      font: 'times',
      style: 'italic',
      fontSize: scale(11, 'signatureSize'),
      image: options.signatureLeftImage,
    })

    drawSignature(doc, {
      centerX: 217,
      y: signatureY,
      width: 58,
      text: options.signatureRight,
      lineColor: GOLD_DIM,
      textColor: IVORY,
      font: 'times',
      style: 'italic',
      fontSize: scale(11, 'signatureSize'),
      image: options.signatureRightImage,
    })
  },
}
