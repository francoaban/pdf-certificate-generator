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

const FOREST = [61, 74, 53]
const INK = [90, 98, 80]
const SAGE = [111, 127, 90]
const SAGE_LIGHT = [176, 188, 155]
const LINE = [183, 192, 166]

/**
 * Estilo 4 — Botánico.
 * Fondo marfil con hojas de salvia y nombre en Parisienne.
 */
export const botanicalStyle = {
  id: 'botanico',
  name: 'Botánico',
  description: 'Fondo marfil con hojas de salvia y caligrafía Parisienne por defecto.',
  background: 'backgrounds/botanico.svg',
  fonts: {
    script: { family: 'Parisienne', file: 'fonts/Parisienne-Regular.ttf' },
  },

  draw(doc, { options, view, logo }) {
    const centerX = PAGE_WIDTH / 2
    const scale = (value, field) => scaleFont(value, options, field)

    drawCertificateLogo(doc, logo)

    drawCenteredText(doc, options.title, 52, {
      size: scale(30, 'titleSize'),
      font: resolveTextFont(options.titleFont, 'times'),
      style: 'bold',
      color: FOREST,
      charSpace: scale(2.4, 'titleSize'),
      maxWidth: 250,
    })

    drawCenteredText(doc, options.subtitle, 60.5, {
      size: scale(9, 'subtitleSize'),
      font: resolveTextFont(options.subtitleFont, 'helvetica'),
      color: SAGE,
      charSpace: scale(2.2, 'subtitleSize'),
      maxWidth: 240,
    })

    doc.setDrawColor(...SAGE_LIGHT)
    doc.setLineWidth(0.35)
    doc.line(centerX - 42, 66.5, centerX + 42, 66.5)
    drawDiamond(doc, centerX, 66.5, 1.9, SAGE)
    doc.setFillColor(...SAGE_LIGHT)
    doc.circle(centerX - 46, 66.5, 1.1, 'F')
    doc.circle(centerX + 46, 66.5, 1.1, 'F')

    drawCenteredText(doc, options.preText, 82, {
      size: scale(12.5, 'preTextSize'),
      font: 'times',
      style: 'italic',
      color: INK,
      maxWidth: 230,
    })

    drawCenteredText(doc, view.fullName, 104, {
      size: scale(47, 'nameSize'),
      font: resolveNameFont(options.nameFont, 'Parisienne'),
      style: 'normal',
      color: FOREST,
      maxWidth: 215,
      minSize: 26,
    })

    if (view.docLine) {
      drawCenteredText(doc, view.docLine, 116, {
        size: scale(9, 'documentSize'),
        font: 'helvetica',
        color: SAGE,
        charSpace: scale(0.4, 'documentSize'),
        maxWidth: 200,
      })
    }

    doc.setDrawColor(...LINE)
    doc.setLineWidth(0.3)
    doc.line(centerX - 70, 121.5, centerX + 70, 121.5)

    const bodyEnd = drawWrappedText(doc, options.bodyText, centerX, 136, {
      width: 184,
      size: scale(11, 'bodySize'),
      font: resolveTextFont(options.bodyFont, 'times'),
      color: INK,
      lineHeight: 1.5,
    })

    const dateY = bodyEnd + 5.5
    drawText(doc, composeDateLine(options), PAGE_WIDTH - 30, dateY, {
      size: scale(9, 'dateSize'),
      font: 'times',
      style: 'italic',
      color: SAGE,
      align: 'right',
      maxWidth: 120,
    })

    const signatureY = Math.max(SIGNATURE_BASELINE_Y, dateY + 10)

    drawSignature(doc, {
      centerX: 80,
      y: signatureY,
      width: 58,
      text: options.signatureLeft,
      lineColor: LINE,
      textColor: FOREST,
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
      lineColor: LINE,
      textColor: FOREST,
      font: 'times',
      style: 'italic',
      fontSize: scale(11, 'signatureSize'),
      image: options.signatureRightImage,
    })
  },
}
