import assert from 'node:assert/strict'
import { test } from 'vitest'
import { DEFAULT_OPTIONS } from '../certificates/defaults.js'
import { normalizeOptions } from './optionsSchema.js'

test('schema: accepts valid options and fills missing values with defaults', () => {
  const { options, warnings } = normalizeOptions({ title: 'Curso', style: 'moderno' })
  assert.equal(options.title, 'Curso')
  assert.equal(options.style, 'moderno')
  assert.equal(options.city, DEFAULT_OPTIONS.city)
  assert.equal(
    normalizeOptions({ backgroundFromLogo: true }).options.backgroundFromLogo,
    true,
  )
  assert.deepEqual(warnings, [])
})

test('schema: strict mode rejects invalid enums, booleans and assets', () => {
  assert.throws(() => normalizeOptions({ style: 'inexistente' }, { strict: true }), /style/)
  assert.throws(
    () => normalizeOptions({ defaultDocType: 'NOPE' }, { strict: true }),
    /tipo de documento/i,
  )
  assert.throws(
    () => normalizeOptions({ showVerificationQr: 'sí' }, { strict: true }),
    /verdadera o falsa/i,
  )
  assert.throws(
    () => normalizeOptions({ backgroundFromLogo: 'sí' }, { strict: true }),
    /verdadera o falsa/i,
  )
  assert.throws(
    () => normalizeOptions({ customLogo: { url: 'x' } }, { strict: true }),
    /imagen válida/i,
  )
})

test('schema: tolerant mode sanitizes bad values instead of breaking the app', () => {
  const { options, warnings } = normalizeOptions({
    title: 42,
    useLogo: 'false',
    customLogo: { dataUrl: 'javascript:alert(1)' },
    imageBackground: 'javascript:alert(1)',
  })

  assert.equal(options.title, DEFAULT_OPTIONS.title)
  assert.equal(options.useLogo, false)
  assert.equal(options.customLogo, null)
  assert.equal(options.imageBackground, null)
  assert.ok(warnings.length >= 3)
})

test('schema: validates the font used for the participant name', () => {
  assert.equal(normalizeOptions({ nameFont: 'parisienne' }).options.nameFont, 'parisienne')
  assert.equal(
    normalizeOptions({ nameFont: 'inexistente' }).options.nameFont,
    DEFAULT_OPTIONS.nameFont,
  )
  assert.throws(
    () => normalizeOptions({ nameFont: 'inexistente' }, { strict: true }),
    /nameFont|fuente/i,
  )
})

test('schema: validates independent fonts for title, subtitle and body', () => {
  for (const field of ['titleFont', 'subtitleFont', 'bodyFont']) {
    assert.equal(normalizeOptions({ [field]: 'sacramento' }).options[field], 'sacramento')
    assert.equal(
      normalizeOptions({ [field]: 'inexistente' }).options[field],
      DEFAULT_OPTIONS[field],
    )
    assert.throws(
      () => normalizeOptions({ [field]: 'inexistente' }, { strict: true }),
      new RegExp(field, 'i'),
    )
  }
})

test('schema: validates each font size independently', () => {
  const fields = [
    'titleSize',
    'subtitleSize',
    'preTextSize',
    'nameSize',
    'bodySize',
    'dateSize',
    'signatureSize',
    'documentSize',
  ]

  for (const field of fields) {
    assert.equal(normalizeOptions({ [field]: 120 }).options[field], 120)
    assert.equal(normalizeOptions({ [field]: '125' }).options[field], 125)
    assert.equal(normalizeOptions({ [field]: 127 }).options[field], 127)
    assert.equal(normalizeOptions({ [field]: 200 }).options[field], 150)
    assert.equal(
      normalizeOptions({ [field]: 'abc' }).options[field],
      DEFAULT_OPTIONS[field],
    )
    assert.throws(
      () => normalizeOptions({ [field]: 200 }, { strict: true }),
      new RegExp(field, 'i'),
    )
    assert.throws(
      () => normalizeOptions({ [field]: 'abc' }, { strict: true }),
      new RegExp(field, 'i'),
    )
  }
})

test('schema: migrates the old global font scale to each text', () => {
  const { options } = normalizeOptions({ fontScale: 120 })
  assert.equal(options.titleSize, 120)
  assert.equal(options.bodySize, 120)
  assert.equal(options.signatureSize, 120)
})

test('schema: validates the background fit mode', () => {
  assert.equal(normalizeOptions({ backgroundFit: 'contain' }).options.backgroundFit, 'contain')
  assert.equal(
    normalizeOptions({ backgroundFit: 'inexistente' }).options.backgroundFit,
    DEFAULT_OPTIONS.backgroundFit,
  )
  assert.throws(
    () => normalizeOptions({ backgroundFit: 'inexistente' }, { strict: true }),
    /backgroundFit/i,
  )
})

test('schema: validates background colors as hexadecimal values', () => {
  assert.equal(
    normalizeOptions({ primaryColor: '#ABC' }).options.primaryColor,
    '#aabbcc',
  )
  assert.equal(
    normalizeOptions({ secondaryColor: '#123456' }).options.secondaryColor,
    '#123456',
  )
  assert.equal(normalizeOptions({ primaryColor: 'rojo' }).options.primaryColor, null)
  assert.throws(
    () => normalizeOptions({ secondaryColor: 'rojo' }, { strict: true }),
    /secondaryColor/,
  )
})

test('schema: only accepts safe image sources', () => {
  assert.equal(
    normalizeOptions({ imageBackground: 'backgrounds/clasico.svg' }).options.imageBackground,
    'backgrounds/clasico.svg',
  )
  assert.equal(
    normalizeOptions({ imageBackground: './backgrounds/clasico.svg' }).options.imageBackground,
    './backgrounds/clasico.svg',
  )
  assert.equal(
    normalizeOptions({ imageBackground: 'https://example.com/fondo.png' }).options
      .imageBackground,
    'https://example.com/fondo.png',
  )

  for (const url of [
    'http://example.com/fondo.png',
    'javascript:alert(1)',
    'file:///etc/passwd',
    '../secret.png',
    'data:text/html;base64,PHNjcmlwdD4=',
    '//example.com/fondo.png',
  ]) {
    assert.equal(
      normalizeOptions({ imageBackground: url }).options.imageBackground,
      null,
      url,
    )
  }
})

test('schema: accepts uploaded background assets and legacy URL strings', () => {
  const background = {
    dataUrl: 'data:image/jpeg;base64,AAAA',
    ratio: 1.5,
    name: 'fondo.jpg',
    width: 2400,
    height: 1600,
  }

  assert.deepEqual(
    normalizeOptions({ imageBackground: background }).options.imageBackground,
    background,
  )
  assert.equal(
    normalizeOptions({ imageBackground: 'backgrounds/clasico.svg' }).options
      .imageBackground,
    'backgrounds/clasico.svg',
  )
  assert.throws(
    () => normalizeOptions({ imageBackground: { name: 'sin imagen' } }, { strict: true }),
    /imagen válida/i,
  )
})

test('schema: validates data image URLs and drops unknown keys', () => {
  const signature = {
    dataUrl: 'data:image/png;base64,AAAA',
    ratio: 2,
    name: 'firma.png',
  }
  const { options } = normalizeOptions({
    signatureLeftImage: signature,
    extra: 'se descarta',
    __proto__: { polluted: true },
  })

  assert.deepEqual(options.signatureLeftImage, signature)
  assert.equal(Object.hasOwn(options, 'extra'), false)
  assert.equal(Object.hasOwn(options, 'polluted'), false)
})
