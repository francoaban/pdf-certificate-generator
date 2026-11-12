import { resolveNameFont, resolveTextFont } from '../fonts.js'
import {
  PAGE_WIDTH,
  SIGNATURE_BASELINE_Y,
  composeDateLine,
  drawCertificateLogo,
  drawSignature,
  drawText,
  drawWrappedText,
  scaleFont,
} from '../shared.js'

const NAVY = [18, 38, 63]
const TEAL = [47, 127, 122]
const GRAY = [95, 110, 124]
const LIGHT = [208, 218, 224]
const GOLD = [194, 162, 81]

/**
 * Estilo 2 — Moderno.
 * Composición alineada a la izquierda, tipografía sans y nombre en Sacramento.
 */
export const modernStyle = {
  id: 'moderno',
  name: 'Moderno',
  description: 'Diagramación alineada a la izquierda, azul/turquesa y caligrafía Sacramento por defecto.',
  background: 'backgrounds/moderno.svg',
  fonts: {
    script: { family: 'Sacramento', file: 'fonts/Sacramento-Regular.ttf' },
  },

  draw(doc, { options, view, logo }) {
    const left = 30
    const scale = (value, field) => scaleFont(value, options, field)
    const logoBox = drawCertificateLogo(doc, logo)
    // El logo puede duplicar su tamaño; si invade la cabecera, el título se
    // desplaza a su derecha para no quedar encima de la imagen.
    const headerLeft = Math.min(
      PAGE_WIDTH - 90,
      Math.max(left, logoBox ? logoBox.x + logoBox.width + 12 : left),
    )
    const headerWidth = Math.max(80, PAGE_WIDTH - 30 - headerLeft)

    drawText(doc, options.title, headerLeft, 54, {
      size: scale(32, 'titleSize'),
      font: resolveTextFont(options.titleFont, 'helvetica'),
      style: 'bold',
      color: NAVY,
      align: 'left',
      maxWidth: headerWidth,
    })

    drawText(doc, options.subtitle, headerLeft, 62, {
      size: scale(9, 'subtitleSize'),
      font: resolveTextFont(options.subtitleFont, 'helvetica'),
      style: 'bold',
      color: TEAL,
      align: 'left',
      charSpace: scale(2.2, 'subtitleSize'),
      maxWidth: headerWidth,
    })

    const lineEnd = headerLeft + Math.min(66, headerWidth)
    doc.setDrawColor(...TEAL)
    doc.setLineWidth(0.9)
    doc.line(headerLeft, 68, lineEnd, 68)
    doc.setFillColor(...GOLD)
    doc.rect(lineEnd, 66.8, 2.4, 2.4, 'F')

    drawText(doc, options.preText, left, 83, {
      size: scale(12, 'preTextSize'),
      font: 'helvetica',
      color: GRAY,
      align: 'left',
      maxWidth: 230,
    })

    drawText(doc, view.fullName, left, 104, {
      size: scale(46, 'nameSize'),
      font: resolveNameFont(options.nameFont, 'Sacramento'),
      style: 'normal',
      color: NAVY,
      align: 'left',
      maxWidth: 232,
      minSize: 26,
    })

    if (view.docLine) {
      drawText(doc, view.docLine, left, 116, {
        size: scale(9, 'documentSize'),
        font: 'helvetica',
        color: GRAY,
        align: 'left',
        charSpace: scale(0.4, 'documentSize'),
        maxWidth: 200,
      })
    }

    doc.setDrawColor(...LIGHT)
    doc.setLineWidth(0.5)
    doc.line(left, 122, 267, 122)

    const bodyEnd = drawWrappedText(doc, options.bodyText, left, 136, {
      width: 215,
      size: scale(10.6, 'bodySize'),
      font: resolveTextFont(options.bodyFont, 'helvetica'),
      color: GRAY,
      align: 'left',
      lineHeight: 1.55,
    })

    const dateY = bodyEnd + 5.5
    drawText(doc, composeDateLine(options), PAGE_WIDTH - 30, dateY, {
      size: scale(8.6, 'dateSize'),
      font: 'helvetica',
      color: GRAY,
      align: 'right',
      maxWidth: 120,
    })

    const signatureY = Math.max(SIGNATURE_BASELINE_Y, dateY + 10)

    drawSignature(doc, {
      centerX: 66,
      y: signatureY,
      width: 62,
      text: options.signatureLeft,
      lineColor: LIGHT,
      textColor: NAVY,
      font: 'helvetica',
      style: 'normal',
      fontSize: scale(10.5, 'signatureSize'),
      image: options.signatureLeftImage,
    })

    drawSignature(doc, {
      centerX: 231,
      y: signatureY,
      width: 62,
      text: options.signatureRight,
      lineColor: LIGHT,
      textColor: NAVY,
      font: 'helvetica',
      style: 'normal',
      fontSize: scale(10.5, 'signatureSize'),
      image: options.signatureRightImage,
    })
  },
}
