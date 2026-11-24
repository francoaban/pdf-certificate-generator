import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  BACKGROUND_PALETTES,
  colorizeBackgroundSvg,
  getBackgroundPalette,
  mixColor,
} from './backgroundColors.js'

test('background colors: replaces decorative colors and keeps the paper', () => {
  const svg =
    '<rect fill="#fbf6e9"/><path stroke="#c2a251"/><path fill="#e6d29a"/>'
  const colorized = colorizeBackgroundSvg(svg, 'clasico', '#ff0000', '#00ff00')

  assert.match(colorized, /#ff0000/)
  assert.match(colorized, /#00ff00/)
  assert.match(colorized, /#fbf6e9/)
  assert.doesNotMatch(colorized, /#c2a251/)
  assert.doesNotMatch(colorized, /#e6d29a/)
})

test('background colors: replacement is a single pass and does not cascade', () => {
  const svg = '<a fill="#c2a251"/><b fill="#e6d29a"/>'
  const colorized = colorizeBackgroundSvg(svg, 'clasico', '#e6d29a', '#00ff00')

  assert.match(colorized, /<a fill="#e6d29a"\/>/)
  assert.match(colorized, /<b fill="#00ff00"\/>/)
})

test('background colors: uses the palette default for a missing color', () => {
  const palette = getBackgroundPalette('moderno')
  const colorized = colorizeBackgroundSvg(
    '<path fill="#2f7f7a"/><path fill="#18324f"/>',
    'moderno',
    '#ff0000',
    null,
  )

  assert.equal(palette, BACKGROUND_PALETTES.moderno)
  assert.match(colorized, /#ff0000/)
  assert.match(colorized, new RegExp(palette.secondary))
  assert.doesNotMatch(colorized, new RegExp(palette.primary))
})

test('background colors: mixes colors towards a target', () => {
  assert.equal(mixColor('#000000', '#ffffff', 0.5), '#808080')
  assert.equal(mixColor('#ff0000', '#000000', 0), '#ff0000')
  assert.equal(mixColor('#ff0000', '#000000', 1), '#000000')
})

test('background colors: recolors floral bands and keeps white paper', () => {
  const svg =
    '<rect fill="#fff"/><path fill="#f8eeee"/><path fill="#be6a69"/><path fill="#a83837"/>'
  const colorized = colorizeBackgroundSvg(
    svg,
    'rojo-floral',
    '#2563eb',
    null,
  )

  assert.match(colorized, /#2563eb/)
  assert.match(colorized, new RegExp(mixColor('#2563eb', '#ffffff', 0.25)))
  assert.match(colorized, new RegExp(mixColor('#2563eb', '#ffffff', 0.915)))
  assert.match(colorized, /#fff/)
  assert.doesNotMatch(colorized, /#a83837|#be6a69|#f8eeee/)
})

test('background colors: floral palette keeps exact tinted bands by default', () => {
  const svg =
    '<path fill="#f8eeee"/><path fill="#be6a69"/><path fill="#a83837"/>'
  const colorized = colorizeBackgroundSvg(
    svg,
    'rojo-floral',
    BACKGROUND_PALETTES['rojo-floral'].primary,
    null,
  )

  assert.match(colorized, /#f8eeee/)
  assert.match(colorized, /#be6a69/)
  assert.match(colorized, /#a83837/)
})
