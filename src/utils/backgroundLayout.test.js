import assert from 'node:assert/strict'
import { test } from 'vitest'
import { fitBackground } from './backgroundLayout.js'

const PAGE_WIDTH = 297
const PAGE_HEIGHT = 210

test('background layout: exact page ratio fills the page', () => {
  assert.deepEqual(
    fitBackground(1123, 794, PAGE_WIDTH, PAGE_HEIGHT),
    { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
  )
})

test('background layout: cover preserves ratio, fills the page and centers the crop', () => {
  const wide = fitBackground(2000, 1000, PAGE_WIDTH, PAGE_HEIGHT, 'cover')
  assert.equal(wide.width, 420)
  assert.equal(wide.height, PAGE_HEIGHT)
  assert.equal(wide.x, -61.5)
  assert.equal(wide.y, 0)

  const tall = fitBackground(1000, 2000, PAGE_WIDTH, PAGE_HEIGHT, 'cover')
  assert.equal(tall.width, PAGE_WIDTH)
  assert.equal(tall.height, 594)
  assert.equal(tall.x, 0)
  assert.equal(tall.y, -192)
})

test('background layout: contain shows the whole image with centered margins', () => {
  const wide = fitBackground(2000, 1000, PAGE_WIDTH, PAGE_HEIGHT, 'contain')
  assert.equal(wide.width, PAGE_WIDTH)
  assert.equal(wide.height, 148.5)
  assert.equal(wide.x, 0)
  assert.equal(wide.y, 30.75)

  const tall = fitBackground(1000, 2000, PAGE_WIDTH, PAGE_HEIGHT, 'contain')
  assert.equal(tall.width, 105)
  assert.equal(tall.height, PAGE_HEIGHT)
  assert.equal(tall.x, 96)
  assert.equal(tall.y, 0)
})

test('background layout: invalid dimensions fall back to the full page', () => {
  assert.deepEqual(
    fitBackground(0, 100, PAGE_WIDTH, PAGE_HEIGHT),
    { x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT },
  )
})
