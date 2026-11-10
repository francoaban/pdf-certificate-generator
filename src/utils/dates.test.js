import assert from 'node:assert/strict'
import { test } from 'vitest'
import { normalizeDate } from './dates.js'

test('dates: formats ISO, Spanish and Excel serial values', () => {
  assert.equal(normalizeDate('2026-10-12'), '12 de octubre de 2026')
  assert.equal(normalizeDate('12/10/2026'), '12 de octubre de 2026')
  assert.equal(normalizeDate('12-10-2026'), '12 de octubre de 2026')
  assert.equal(normalizeDate('2026/10/12'), '12 de octubre de 2026')
  assert.equal(normalizeDate('46300'), '5 de octubre de 2026')
  assert.equal(normalizeDate(46300), '5 de octubre de 2026')
})

test('dates: keeps human-readable or unknown values untouched', () => {
  assert.equal(normalizeDate('8 de noviembre de 2026'), '8 de noviembre de 2026')
  assert.equal(normalizeDate('fecha a confirmar'), 'fecha a confirmar')
  assert.equal(normalizeDate(''), '')
  assert.equal(normalizeDate(null), '')
})

test('dates: rejects impossible calendar dates instead of inventing one', () => {
  assert.equal(normalizeDate('31/02/2026'), '31/02/2026')
  assert.equal(normalizeDate('2026-13-01'), '2026-13-01')
})

test('dates: does not treat short numbers as Excel serials', () => {
  assert.equal(normalizeDate('2026'), '2026')
  assert.equal(normalizeDate('12'), '12')
})
