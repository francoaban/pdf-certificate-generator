import assert from 'node:assert/strict'
import { test } from 'vitest'
import { DEFAULT_OPTIONS } from '../defaults.js'
import { PAGE_WIDTH } from '../shared.js'
import { STYLES } from './index.js'

function recordingDoc() {
  const texts = []
  let charSpace = 0
  return {
    texts,
    setFont() {},
    setFontSize() {},
    setTextColor() {},
    setDrawColor() {},
    setFillColor() {},
    setLineWidth() {},
    setCharSpace(value) {
      charSpace = value
    },
    getTextWidth() {
      return 10
    },
    splitTextToSize(text) {
      return [String(text)]
    },
    text(text, x, y, options) {
      const value = String(text)
      const width =
        10 + (charSpace ? charSpace * Math.max(0, value.length - 1) : 0)
      let left = x
      if (options?.align === 'center') left = x - width / 2
      else if (options?.align === 'right') left = x - width
      texts.push({
        text: value,
        x,
        y,
        align: options?.align,
        left,
        center: left + width / 2,
        right: left + width,
      })
    },
    line() {},
    rect() {},
    circle() {},
    triangle() {},
    addImage() {},
  }
}

const view = { fullName: 'Ana Pérez', docLine: '' }

function drawStyle(style, overrides = {}, logo = null) {
  const doc = recordingDoc()
  style.draw(doc, {
    options: { ...DEFAULT_OPTIONS, date: '2026-10-12', ...overrides },
    view,
    logo,
  })
  return doc.texts
}

function findText(texts, text) {
  return texts.find((entry) => entry.text === text)
}

test('alignment: auto centers title and subtitle when no logo is used', () => {
  for (const style of STYLES) {
    const texts = drawStyle(style)
    const title = findText(texts, DEFAULT_OPTIONS.title)
    const subtitle = findText(texts, DEFAULT_OPTIONS.subtitle)

    assert.equal(title.center, PAGE_WIDTH / 2, style.id)
    assert.equal(subtitle.center, PAGE_WIDTH / 2, style.id)
  }
})

test('alignment: modern auto keeps the header left-aligned when a logo is used', () => {
  const logo = { dataUrl: 'data:image/png;base64,logo', ratio: 1 }
  const modern = STYLES.find((style) => style.id === 'moderno')
  const texts = drawStyle(modern, {}, logo)
  const title = findText(texts, DEFAULT_OPTIONS.title)
  const subtitle = findText(texts, DEFAULT_OPTIONS.subtitle)

  assert.equal(title.left, 89)
  assert.equal(subtitle.left, 89)
})

test('alignment: auto keeps location and date together on the right', () => {
  for (const style of STYLES) {
    const texts = drawStyle(style)
    const line = texts.find((entry) => entry.text.includes('2026'))

    assert.match(line.text, /San Salvador de Jujuy · /, style.id)
    assert.equal(line.align, 'right', style.id)
    assert.equal(line.x, 267, style.id)
  }
})

test('alignment: custom title and subtitle alignment applies to every style', () => {
  for (const style of STYLES) {
    const texts = drawStyle(style, {
      titleAlign: 'right',
      subtitleAlign: 'left',
    })
    const title = findText(texts, DEFAULT_OPTIONS.title)
    const subtitle = findText(texts, DEFAULT_OPTIONS.subtitle)
    const pageRight = PAGE_WIDTH - 30

    assert.equal(
      title.right,
      style.id === 'moderno' ? pageRight : pageRight + 6.5,
      style.id,
    )
    assert.equal(
      subtitle.left,
      style.id === 'moderno' ? 30 : PAGE_WIDTH / 2 - 120,
      style.id,
    )
  }
})

test('alignment: left-aligned titles keep clear of the logo', () => {
  const logo = { dataUrl: 'data:image/png;base64,logo', ratio: 1 }
  for (const style of STYLES) {
    const texts = drawStyle(
      style,
      { titleAlign: 'left', subtitleAlign: 'left' },
      logo,
    )
    const title = findText(texts, DEFAULT_OPTIONS.title)
    const subtitle = findText(texts, DEFAULT_OPTIONS.subtitle)

    assert.equal(title.left, 89, style.id)
    assert.equal(subtitle.left, 89, style.id)
  }
})

test('alignment: date and location share one custom alignment and one line', () => {
  for (const style of STYLES) {
    const texts = drawStyle(style, { dateLocationAlign: 'left' })
    const line = texts.find((entry) => entry.text.includes('2026'))

    assert.match(line.text, /San Salvador de Jujuy · /, style.id)
    assert.equal(line.align, 'left', style.id)
    assert.equal(line.x, 30, style.id)
  }
})
