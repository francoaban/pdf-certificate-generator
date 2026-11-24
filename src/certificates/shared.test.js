import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  LOGO_HEIGHT_RATIO,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  drawAlignedText,
  drawCertificateLogo,
  drawDateAndLocation,
  getFontScale,
  getSafeTextLeft,
  scaleFont,
} from './shared.js'
import { resolveAlignment } from './alignment.js'

test('shared: places the certificate logo top-left at 30% of the page height', () => {
  const calls = []
  const doc = {
    addImage: (...args) => calls.push(args),
  }

  const box = drawCertificateLogo(doc, { dataUrl: 'logo.png', ratio: 1 })

  assert.equal(LOGO_HEIGHT_RATIO, 0.3)
  assert.equal(box.y, 10)
  assert.equal(box.x, 14)
  assert.equal(box.height, PAGE_HEIGHT * 0.3)
  assert.equal(box.width, PAGE_HEIGHT * 0.3)
  assert.equal(calls.length, 1)
})

test('shared: scales each certificate text independently', () => {
  assert.equal(getFontScale({ titleSize: 100 }, 'titleSize'), 1)
  assert.equal(getFontScale({ titleSize: 120 }, 'titleSize'), 1.2)
  assert.equal(getFontScale({ titleSize: 200 }, 'titleSize'), 1.5)
  assert.equal(getFontScale({ titleSize: 120 }, 'bodySize'), 1)
  assert.equal(getFontScale({}, 'bodySize'), 1)
  assert.equal(scaleFont(10, { titleSize: 110 }, 'titleSize'), 11)
  assert.equal(scaleFont(10, { titleSize: 110 }, 'bodySize'), 10)
  assert.equal(scaleFont(10, {}), 10)
})

function recordingDoc() {
  const calls = []
  return {
    calls,
    setFont() {},
    setFontSize() {},
    setTextColor() {},
    setCharSpace() {},
    getTextWidth() {
      return 10
    },
    text(text, x, y, options) {
      calls.push({ text, x, y, options })
    },
  }
}

test('shared: resolves auto alignment to the style fallback', () => {
  assert.equal(resolveAlignment('auto', 'left'), 'left')
  assert.equal(resolveAlignment('center', 'left'), 'center')
  assert.equal(resolveAlignment('right', 'center'), 'right')
  assert.equal(resolveAlignment('justify', 'left'), 'left')
})

test('shared: moves left-aligned text after the logo and clamps it', () => {
  assert.equal(getSafeTextLeft(null, 23.5, 273.5), 23.5)
  assert.equal(
    getSafeTextLeft({ x: 14, width: 63 }, 23.5, 273.5),
    89,
  )
  assert.equal(
    getSafeTextLeft({ x: 200, width: 100 }, 23.5, 273.5),
    213.5,
  )
})

test('shared: aligns title text to the left, center or right of its range', () => {
  const doc = recordingDoc()

  drawAlignedText(doc, 'Título', 50, {
    alignment: 'left',
    fallback: 'center',
    left: 20,
    right: 200,
  })
  drawAlignedText(doc, 'Título', 50, {
    alignment: 'auto',
    fallback: 'center',
    left: 20,
    right: 200,
  })
  drawAlignedText(doc, 'Título', 50, {
    alignment: 'right',
    fallback: 'center',
    left: 20,
    right: 200,
  })

  assert.deepEqual(
    doc.calls.map(({ x, options }) => [x, options.align]),
    [
      [20, 'left'],
      [110, 'center'],
      [200, 'right'],
    ],
  )
})

test('shared: positions letter-spaced text without relying on jsPDF align', () => {
  const doc = recordingDoc()

  drawAlignedText(doc, 'ABCDE', 50, {
    alignment: 'center',
    left: 0,
    right: 200,
    charSpace: 2,
  })
  drawAlignedText(doc, 'ABCDE', 50, {
    alignment: 'right',
    left: 0,
    right: 200,
    charSpace: 2,
  })

  // getTextWidth simulado: 10; 4 espacios de 2 mm => ancho visible 18.
  assert.deepEqual(
    doc.calls.map(({ x, options }) => [x, options.align]),
    [
      [91, 'left'],
      [182, 'left'],
    ],
  )
})

test('shared: draws location and date on separate lines when alignments differ', () => {
  const doc = recordingDoc()
  const result = drawDateAndLocation(
    doc,
    {
      city: 'Jujuy',
      showCity: true,
      showProvince: false,
      showCountry: false,
      date: '2026-10-12',
      locationAlign: 'left',
      dateAlign: 'right',
    },
    { y: 100, size: 10 },
  )

  assert.equal(result.lines, 2)
  assert.equal(doc.calls[0].text, 'Jujuy')
  assert.equal(doc.calls[0].x, 30)
  assert.equal(doc.calls[0].options.align, 'left')
  assert.equal(doc.calls[1].x, PAGE_WIDTH - 30)
  assert.equal(doc.calls[1].options.align, 'right')
  assert.ok(result.endY > 100)
})

test('shared: joins location and date when they share an alignment', () => {
  const doc = recordingDoc()
  const result = drawDateAndLocation(
    doc,
    {
      city: 'Jujuy',
      showCity: true,
      showProvince: false,
      showCountry: false,
      date: '2026-10-12',
      locationAlign: 'center',
      dateAlign: 'center',
    },
    { y: 100, size: 10 },
  )

  assert.equal(result.lines, 1)
  assert.match(doc.calls[0].text, /^Jujuy · /)
  assert.equal(doc.calls[0].x, PAGE_WIDTH / 2)
  assert.equal(doc.calls[0].options.align, 'center')
})

test('shared: draws only the date when there is no location', () => {
  const doc = recordingDoc()
  const result = drawDateAndLocation(
    doc,
    {
      showCity: false,
      showProvince: false,
      showCountry: false,
      date: '2026-10-12',
      locationAlign: 'left',
      dateAlign: 'right',
    },
    { y: 100, size: 10 },
  )

  assert.equal(result.lines, 1)
  assert.doesNotMatch(doc.calls[0].text, /Jujuy/)
  assert.equal(doc.calls[0].x, PAGE_WIDTH - 30)
  assert.equal(doc.calls[0].options.align, 'right')
})
