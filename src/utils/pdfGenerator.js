import { jsPDF } from 'jspdf'
import { loadDefaultLogo } from './logo'
import { allocateUniqueFileName, resolveRecord, buildFileName } from './records'
import { normalizeOptions } from './optionsSchema'
import { fitBackground } from './backgroundLayout'
import { BACKGROUND_LOGO_OPACITY, fitLogoWatermark } from './backgroundLogo'
import { loadBackground } from './backgroundLoader'
import { DEFAULT_OPTIONS, getCurrentDate } from '../certificates/defaults'
import { getFontEntries } from '../certificates/fonts'
import { getStyle } from '../certificates/styles/index'
import { stripBoldMarkup } from './richText'
import {
  applyFonts,
  composePlaceLine,
  drawCenteredText,
  drawWrappedText,
  prepareFonts,
} from '../certificates/shared'

export { DEFAULT_OPTIONS }

const W = 297
const H = 210
const QR_SIZE = 16
const QR_RIGHT_MARGIN = 20
const QR_BOTTOM_MARGIN = 22

/* ---------- Preparación de recursos (se cachea entre certificados) ---------- */
async function prepare(options) {
  const opts = normalizeOptions(options).options
  const style = getStyle(opts.style)
  const backgroundSource =
    opts.showImageBackground && opts.imageBackground
      ? opts.imageBackground
      : opts.background || style.background

  const [logo, background, fonts] = await Promise.all([
    opts.useLogo
      ? opts.customLogo || loadDefaultLogo().catch(() => null)
      : Promise.resolve(null),
    opts.useBackground === false
      ? Promise.resolve(null)
      : backgroundSource
        ? loadBackground(backgroundSource, {
            primaryColor: opts.primaryColor,
            secondaryColor: opts.secondaryColor,
            scale: 1.5,
            maxWidth: 1900,
            mime: 'image/jpeg',
            quality: 0.92,
          })
        : Promise.resolve(null),
    prepareFonts(
      getFontEntries(style.fonts, opts.nameFont, [
        opts.titleFont,
        opts.subtitleFont,
        opts.bodyFont,
      ]),
    ),
  ])

  return { opts, style, logo, background, fonts }
}

/* ---------- Documento ---------- */
function createDoc({ background, fonts, logo, opts }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
  applyFonts(doc, fonts)
  addBackground(doc, background, opts?.backgroundFit)
  addBackgroundLogo(doc, logo, opts)
  return doc
}

function addBackground(doc, background, fit = 'cover') {
  if (!background) return
  const box = fitBackground(background.width, background.height, W, H, fit)
  doc.addImage(
    background.dataUrl,
    'JPEG',
    box.x,
    box.y,
    box.width,
    box.height,
    'bg',
    'FAST',
  )
}

function addBackgroundLogo(doc, logo, opts) {
  if (!opts?.backgroundFromLogo || !opts.customLogo || !logo) return

  const ratio =
    logo.ratio || (logo.width && logo.height ? logo.width / logo.height : 1)
  const box = fitLogoWatermark(ratio, W, H)

  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: BACKGROUND_LOGO_OPACITY }))
  doc.addImage(
    logo.dataUrl,
    'PNG',
    box.x,
    box.y,
    box.width,
    box.height,
    'background-logo',
    'FAST',
  )
  doc.restoreGraphicsState()
}

const QR_CACHE = new Map()
let qrModulePromise = null

function getQrModule() {
  qrModulePromise ??= import('qrcode').then((module) => module.default ?? module)
  return qrModulePromise
}

async function getQrDataUrl(payload) {
  const cached = QR_CACHE.get(payload)
  if (cached) return cached

  const promise = (async () => {
    const QRCode = await getQrModule()
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 192,
    })
  })()
  QR_CACHE.set(payload, promise)
  if (QR_CACHE.size > 500) {
    const oldest = QR_CACHE.keys().next().value
    QR_CACHE.delete(oldest)
  }
  try {
    return await promise
  } catch (error) {
    QR_CACHE.delete(payload)
    throw error
  }
}

function throwIfAborted(signal) {
  if (!signal?.aborted) return
  const error = new Error('Generación cancelada.')
  error.name = 'AbortError'
  throw error
}

function assertRecords(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('No hay registros para generar.')
  }
}

async function drawCertificate(doc, record, opts, style, logo, signal) {
  throwIfAborted(signal)
  const certificateOptions = {
    ...opts,
    date: record.fecha || opts.date || getCurrentDate(),
  }
  const view = resolveRecord(record, certificateOptions)

  doc.setProperties({
    title: `${stripBoldMarkup(opts.title) || 'Certificado'} - ${view.fullName}`,
    subject: stripBoldMarkup(opts.subtitle || ''),
    author: composePlaceLine(certificateOptions),
    creator: 'Generador de certificados (jsPDF)',
    keywords: [stripBoldMarkup(opts.title), view.fullName, view.docDisplay]
      .filter(Boolean)
      .join(', '),
  })

  style.draw(doc, { options: certificateOptions, view, logo })

  const details = [
    view.course && `Curso: ${view.course}`,
    view.hours && `Horas: ${view.hours}`,
    view.instructor && `Instructor: ${view.instructor}`,
  ].filter(Boolean)
  if (details.length) {
    drawCenteredText(doc, details.join(' · '), 129, {
      size: 16,
      minSize: 12,
      maxWidth: 225,
      font: 'helvetica',
      color: [90, 98, 105],
    })
  }

  if (certificateOptions.showVerificationQr !== false) {
    const payload = JSON.stringify({
      type: 'certificados-verification',
      version: 1,
      code: view.code,
      name: view.fullName,
      course: view.course || undefined,
      hours: view.hours || undefined,
      instructor: view.instructor || undefined,
      date: view.date || certificateOptions.date,
    })
    const qr = await getQrDataUrl(payload)
    throwIfAborted(signal)
    const qrX = W - QR_RIGHT_MARGIN - QR_SIZE
    const qrY = H - QR_BOTTOM_MARGIN - QR_SIZE
    doc.addImage(qr, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE, `verification-${view.code}`, 'FAST')
    drawWrappedText(doc, view.code, qrX + QR_SIZE / 2, qrY + QR_SIZE + 3, {
      width: 26,
      size: 12,
      font: 'helvetica',
      align: 'center',
      color: [80, 80, 80],
      lineHeight: 1.1,
      maxLines: 2,
    })
  }
  return view
}

/* ---------- Utilidades ---------- */
const newPage = (doc, context) => {
  doc.addPage('a4', 'landscape')
  addBackground(doc, context.background, context.opts?.backgroundFit)
  addBackgroundLogo(doc, context.logo, context.opts)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

const tick = () => new Promise((res) => setTimeout(res))

function batchConfig(config) {
  return typeof config === 'function' ? { onProgress: config } : config || {}
}

/* ---------- API pública ---------- */

/** URL (blob) de un PDF de una página, para la vista previa. */
export async function buildPreviewUrl(record, options = {}) {
  const ctx = await prepare(options)
  const doc = createDoc(ctx)
  await drawCertificate(doc, record, ctx.opts, ctx.style, ctx.logo)
  return URL.createObjectURL(doc.output('blob'))
}

export async function generateCertificate(record, options = {}, config = {}) {
  if (!record || (!String(record.nombre ?? '').trim() && !String(record.apellido ?? '').trim())) {
    throw new Error('El registro no tiene nombre ni apellido.')
  }
  const { signal } = batchConfig(config)
  throwIfAborted(signal)
  const ctx = await prepare(options)
  throwIfAborted(signal)
  const doc = createDoc(ctx)
  const view = await drawCertificate(doc, record, ctx.opts, ctx.style, ctx.logo, signal)
  throwIfAborted(signal)
  const name = buildFileName(view, record, ctx.opts.fileNameFormat)
  doc.save(`${name}.pdf`)
}

/** Un solo PDF con una página por registro. */
export async function generateBulkPdf(records, options = {}, config = {}) {
  assertRecords(records)
  const { onProgress, signal } = batchConfig(config)
  throwIfAborted(signal)
  const ctx = await prepare(options)
  const doc = createDoc(ctx)

  for (let i = 0; i < records.length; i++) {
    throwIfAborted(signal)
    const record = records[i]
    if (i > 0) newPage(doc, ctx)
    await drawCertificate(doc, record, ctx.opts, ctx.style, ctx.logo, signal)
    onProgress?.(i + 1, records.length)
    if (i % 5 === 4) await tick()
  }

  throwIfAborted(signal)
  doc.save('Certificados.pdf')
}

/**
 * ZIP con un PDF por registro.
 * Acepta `{ onProgress, signal }` o, por compatibilidad, un callback de progreso.
 */
export async function generateZip(records, options = {}, config = {}) {
  assertRecords(records)
  const { onProgress, signal } = batchConfig(config)
  throwIfAborted(signal)
  const ctx = await prepare(options)
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  const used = new Set()

  for (let i = 0; i < records.length; i++) {
    throwIfAborted(signal)
    const record = records[i]
    const doc = createDoc(ctx)
    const view = await drawCertificate(doc, record, ctx.opts, ctx.style, ctx.logo, signal)

    const base = allocateUniqueFileName(
      buildFileName(view, record, ctx.opts.fileNameFormat),
      used,
    )

    zip.file(`${base}.pdf`, doc.output('arraybuffer'))
    onProgress?.(i + 1, records.length)
    if (i % 5 === 4) await tick()
  }

  throwIfAborted(signal)
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  throwIfAborted(signal)
  downloadBlob(blob, 'Certificados.zip')
}
