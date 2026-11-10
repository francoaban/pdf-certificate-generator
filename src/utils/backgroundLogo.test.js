import assert from 'node:assert/strict'
import { test } from 'vitest'
import { fitLogoWatermark } from './backgroundLogo.js'

const PAGE_WIDTH = 297
const PAGE_HEIGHT = 210

const closeTo = (actual, expected, epsilon = 1e-9) => {
  assert.ok(
    Math.abs(actual - expected) < epsilon,
    `Expected ${actual} to be close to ${expected}`,
  )
}

test('logo watermark: wide logo occupies one third of the width and is centered', () => {
  const box = fitLogoWatermark(4, PAGE_WIDTH, PAGE_HEIGHT)
  closeTo(box.width, 99)
  closeTo(box.height, 24.75)
  closeTo(box.x, 99)
  closeTo(box.y, (PAGE_HEIGHT - 24.75) / 2)
})

test('logo watermark: square logo remains centered', () => {
  const box = fitLogoWatermark(1, PAGE_WIDTH, PAGE_HEIGHT)
  closeTo(box.width, 99)
  closeTo(box.height, 99)
  closeTo(box.x, 99)
  closeTo(box.y, (PAGE_HEIGHT - 99) / 2)
})

test('logo watermark: tall logo is capped by height', () => {
  const box = fitLogoWatermark(0.5, PAGE_WIDTH, PAGE_HEIGHT)
  closeTo(box.width, 63)
  closeTo(box.height, 126)
  closeTo(box.x, (PAGE_WIDTH - 63) / 2)
  closeTo(box.y, (PAGE_HEIGHT - 126) / 2)
})

test('logo watermark: invalid ratio falls back to a square', () => {
  const box = fitLogoWatermark(Number.NaN, PAGE_WIDTH, PAGE_HEIGHT)
  closeTo(box.width, 99)
  closeTo(box.height, 99)
})
