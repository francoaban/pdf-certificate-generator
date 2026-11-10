import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  DEFAULT_NAME_FONT,
  NAME_FONTS,
  getFontEntries,
  resolveNameFont,
  resolveTextFont,
} from './fonts.js'

test('fonts: resolves automatic and explicit name fonts', () => {
  assert.equal(DEFAULT_NAME_FONT, 'auto')
  assert.equal(resolveNameFont('auto', 'GreatVibes'), 'GreatVibes')
  assert.equal(resolveNameFont('parisienne', 'GreatVibes'), 'Parisienne')
  assert.equal(resolveNameFont('serif', 'Sacramento'), 'times')
  assert.equal(resolveNameFont('sans', 'Sacramento'), 'helvetica')
  assert.equal(resolveNameFont('no-existe', 'PinyonScript'), 'PinyonScript')
})

test('fonts: prepares the selected font without duplicating the style font', () => {
  const styleFonts = {
    script: { family: 'GreatVibes', file: 'fonts/GreatVibes-Regular.ttf' },
  }

  assert.deepEqual(getFontEntries(styleFonts, 'auto'), styleFonts)
  assert.deepEqual(getFontEntries(styleFonts, 'great-vibes'), {
    ...styleFonts,
    name: {
      id: 'great-vibes',
      label: 'Great Vibes',
      family: 'GreatVibes',
      file: 'fonts/GreatVibes-Regular.ttf',
    },
  })
  const builtIn = getFontEntries(styleFonts, 'serif')
  assert.equal(Object.hasOwn(builtIn, 'name'), false)
  assert.ok(NAME_FONTS.some((font) => font.id === 'sacramento' && font.file))
})

test('fonts: prepares independent title, subtitle and body font choices', () => {
  assert.equal(resolveTextFont('great-vibes', 'times'), 'GreatVibes')
  assert.equal(resolveTextFont('auto', 'helvetica'), 'helvetica')

  const entries = getFontEntries({}, 'auto', [
    'great-vibes',
    'sacramento',
    'serif',
  ])
  assert.equal(entries.text0.family, 'GreatVibes')
  assert.equal(entries.text1.family, 'Sacramento')
  assert.equal(Object.hasOwn(entries, 'text2'), false)
})
