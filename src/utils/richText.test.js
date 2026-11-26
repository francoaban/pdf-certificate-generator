import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  drawRichText,
  drawRichWrappedText,
  hasBoldMarkup,
  hasRichTextMarkup,
  needsSyntheticBold,
  parseBoldText,
  parseRichText,
  resolveFontStyle,
  stripBoldMarkup,
  stripRichTextMarkup,
} from './richText.js'

function createFakeDoc() {
  const calls = []
  return {
    calls,
    setFont: (...args) => calls.push(['setFont', ...args]),
    setFontSize: (...args) => calls.push(['setFontSize', ...args]),
    setTextColor: (...args) => calls.push(['setTextColor', ...args]),
    setCharSpace: (...args) => calls.push(['setCharSpace', ...args]),
    getTextWidth: (text) => String(text).length,
    text: (text, x, y, options) => calls.push(['text', text, x, y, options]),
  }
}

test('rich text: parses bold markers and leaves unmatched markers intact', () => {
  assert.equal(hasBoldMarkup('Hola **mundo**'), true)
  assert.equal(hasBoldMarkup('Hola mundo'), false)
  assert.deepEqual(parseBoldText('Hola **mundo**'), [
    { text: 'Hola ', bold: false },
    { text: 'mundo', bold: true },
  ])
  assert.deepEqual(parseBoldText('**abierto'), [
    { text: '**abierto', bold: false },
  ])
  assert.equal(stripBoldMarkup('Hola **mundo**'), 'Hola mundo')
})

test('rich text: parses bold, italic and combined markers separately', () => {
  assert.equal(hasRichTextMarkup('Hola *mundo*'), true)
  assert.equal(hasRichTextMarkup('Hola mundo'), false)
  assert.equal(hasRichTextMarkup('2 * 3'), false)

  assert.deepEqual(parseRichText('Hola **mundo** y *mundo*'), [
    { text: 'Hola ', bold: false, italic: false },
    { text: 'mundo', bold: true, italic: false },
    { text: ' y ', bold: false, italic: false },
    { text: 'mundo', bold: false, italic: true },
  ])
  assert.deepEqual(parseRichText('***todo***'), [
    { text: 'todo', bold: true, italic: true },
  ])
  assert.deepEqual(parseRichText('**negrita *cursiva* negrita**'), [
    { text: 'negrita ', bold: true, italic: false },
    { text: 'cursiva', bold: true, italic: true },
    { text: ' negrita', bold: true, italic: false },
  ])
  assert.deepEqual(parseRichText('*abierto'), [
    { text: '*abierto', bold: false, italic: false },
  ])
  assert.equal(
    stripRichTextMarkup('**negrita** y *cursiva*'),
    'negrita y cursiva',
  )
})

test('rich text: draws italic segments using the italic font variant', () => {
  const doc = createFakeDoc()
  drawRichText(doc, 'Hola *mundo*', 10, 20, {
    size: 12,
    font: 'times',
    style: 'normal',
    align: 'left',
  })

  const textCalls = doc.calls.filter((call) => call[0] === 'text')
  assert.deepEqual(
    textCalls.map((call) => call[1]),
    ['Hola ', 'mundo'],
  )
  assert.ok(
    doc.calls.some(
      (call) => call[0] === 'setFont' && call[1] === 'times' && call[2] === 'italic',
    ),
  )
})

test('rich text: combines bold and italic into the bolditalic variant', () => {
  const doc = createFakeDoc()
  drawRichText(doc, '***mundo***', 10, 20, {
    size: 12,
    font: 'times',
    style: 'normal',
    align: 'left',
  })

  assert.ok(
    doc.calls.some(
      (call) =>
        call[0] === 'setFont' && call[1] === 'times' && call[2] === 'bolditalic',
    ),
  )
  assert.equal(resolveFontStyle('times', 'italic', true, false), 'bolditalic')
  assert.equal(resolveFontStyle('times', 'bold', false, true), 'bolditalic')
  assert.equal(resolveFontStyle('GreatVibes', 'normal', false, true), 'normal')
})

test('rich text: wrapped text keeps bold and italic spans', () => {
  const doc = createFakeDoc()
  drawRichWrappedText(doc, '**Negrita** y *cursiva*', 10, 20, {
    width: 100,
    size: 12,
    font: 'times',
    align: 'left',
  })

  const textCalls = doc.calls.filter((call) => call[0] === 'text')
  assert.deepEqual(
    textCalls.map((call) => call[1]),
    ['Negrita ', 'y ', 'cursiva'],
  )
  assert.ok(
    doc.calls.some(
      (call) => call[0] === 'setFont' && call[1] === 'times' && call[2] === 'bold',
    ),
  )
  assert.ok(
    doc.calls.some(
      (call) => call[0] === 'setFont' && call[1] === 'times' && call[2] === 'italic',
    ),
  )
})

test('rich text: draws bold segments using the bold font variant', () => {
  const doc = createFakeDoc()
  drawRichText(doc, 'Hola **mundo**', 10, 20, {
    size: 12,
    font: 'times',
    style: 'normal',
    align: 'left',
  })

  const textCalls = doc.calls.filter((call) => call[0] === 'text')
  assert.deepEqual(
    textCalls.map((call) => call[1]),
    ['Hola ', 'mundo'],
  )
  assert.ok(
    doc.calls.some(
      (call) => call[0] === 'setFont' && call[1] === 'times' && call[2] === 'bold',
    ),
  )
})

test('rich text: measures letter spacing in document units when centering', () => {
  const doc = createFakeDoc()
  drawRichText(doc, 'A **B**', 0, 20, {
    size: 12,
    font: 'times',
    style: 'normal',
    align: 'center',
    charSpace: 2,
  })

  const textCalls = doc.calls.filter((call) => call[0] === 'text')
  assert.deepEqual(
    textCalls.map((call) => [call[1], call[2]]),
    [
      ['A ', -3.5],
      ['B', 2.5],
    ],
  )
})

test('rich text: simulates bold for custom TTF fonts that only have a normal style', () => {
  const doc = createFakeDoc()
  drawRichText(doc, '**Hola**', 10, 20, {
    size: 12,
    font: 'GreatVibes',
    style: 'normal',
    align: 'left',
  })

  assert.equal(needsSyntheticBold('GreatVibes', 'normal', true), true)
  assert.equal(needsSyntheticBold('times', 'normal', true), false)
  assert.equal(
    doc.calls.filter((call) => call[0] === 'text' && call[1] === 'Hola').length,
    2,
  )
  assert.ok(
    doc.calls.every(
      (call) =>
        call[0] !== 'setFont' || call[1] !== 'GreatVibes' || call[2] === 'normal',
    ),
  )
})
