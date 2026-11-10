import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  drawRichText,
  hasBoldMarkup,
  needsSyntheticBold,
  parseBoldText,
  stripBoldMarkup,
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
