import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  LOGO_HEIGHT_RATIO,
  PAGE_HEIGHT,
  drawCertificateLogo,
  getFontScale,
  scaleFont,
} from './shared.js'

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
