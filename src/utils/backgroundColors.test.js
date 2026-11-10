import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  BACKGROUND_PALETTES,
  colorizeBackgroundSvg,
  getBackgroundPalette,
  mixColor,
  recolorFloralPixels,
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

test('background colors: recolors red floral pixels and keeps white paper', () => {
  const data = new Uint8ClampedArray([
    168, 56, 55, 255, // rojo del fondo floral
    255, 255, 255, 255, // papel blanco
    32, 120, 80, 255, // otro color decorativo
    0, 0, 0, 0, // píxel transparente
    255, 253, 253, 255, // ruido casi blanco
  ])

  recolorFloralPixels(data, '#2563eb')

  assert.ok(data[2] > data[0], 'el rojo debe convertirse en azul')
  assert.deepEqual([...data.slice(4, 7)], [255, 255, 255])
  assert.deepEqual([...data.slice(8, 11)], [32, 120, 80])
  assert.deepEqual([...data.slice(12, 15)], [0, 0, 0])
  assert.deepEqual([...data.slice(16, 19)], [255, 253, 253])
})
