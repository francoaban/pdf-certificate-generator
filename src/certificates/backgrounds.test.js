import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { BACKGROUND_PRESETS, findBackgroundPreset } from './backgrounds.js'
import { CERTIFICATE_STYLES } from './styles/index.js'
import { colorizeBackgroundSvg } from '../utils/backgroundColors.js'

test('backgrounds: presets include the generic, floral and style backgrounds', () => {
  assert.equal(BACKGROUND_PRESETS[0].id, 'generico')
  assert.ok(BACKGROUND_PRESETS.some((preset) => preset.id === 'rojo-floral'))

  const presetIds = new Set(BACKGROUND_PRESETS.map((preset) => preset.id))
  for (const style of CERTIFICATE_STYLES) {
    assert.ok(presetIds.has(style.id), `falta el fondo del estilo ${style.id}`)
  }

  const sources = BACKGROUND_PRESETS.map((preset) => preset.src)
  assert.equal(new Set(sources).size, sources.length)

  const floral = BACKGROUND_PRESETS.find((preset) => preset.id === 'rojo-floral')
  assert.equal(floral.src, 'backgrounds/rojo-floral.svg')
  assert.equal(floral.recolor, undefined)
  assert.equal(floral.primaryOnly, true)
  assert.match(floral.palette.primary, /^#[0-9a-f]{6}$/)

  for (const preset of BACKGROUND_PRESETS) {
    if (!preset.palette) continue
    assert.match(preset.palette.primary, /^#[0-9a-f]{6}$/)
    assert.match(preset.palette.secondary, /^#[0-9a-f]{6}$/)
  }
})

test('backgrounds: las configuraciones antiguas resuelven al preset actual', () => {
  const legacy = findBackgroundPreset('backgrounds/rojo-floral.png')

  assert.equal(legacy?.id, 'rojo-floral')
  assert.equal(legacy?.src, 'backgrounds/rojo-floral.svg')
  assert.equal(
    findBackgroundPreset('./backgrounds/rojo-floral.svg')?.id,
    'rojo-floral',
  )
  assert.equal(findBackgroundPreset('https://example.com/fondo.png'), null)
  assert.equal(findBackgroundPreset(null), null)
})

test('backgrounds: los SVG conservan el tamaño y los colores que usa el PDF', () => {
  for (const preset of BACKGROUND_PRESETS) {
    const svg = readFileSync(
      new URL(`../../public/${preset.src}`, import.meta.url),
      'utf8',
    )

    // loadImageAsset usa naturalWidth/naturalHeight para rasterizar el fondo.
    assert.match(svg, /viewBox="0 0 1123 794"/, preset.src)
    assert.match(svg, /width="1123"/, preset.src)
    assert.match(svg, /height="794"/, preset.src)
    assert.doesNotMatch(svg, /<image\b/, `${preset.src} debe seguir siendo vectorial`)
  }

  const floral = readFileSync(
    new URL('../../public/backgrounds/rojo-floral.svg', import.meta.url),
    'utf8',
  )
  const colorized = colorizeBackgroundSvg(floral, 'rojo-floral', '#2563eb', null)

  assert.match(colorized, /#2563eb/)
  assert.match(colorized, /#fff/)
  assert.doesNotMatch(
    colorized,
    /#a83837|#be6a69|#cf9291|#e1b9b9|#efdada|#f8eeee/,
  )
})
