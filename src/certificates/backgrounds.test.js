import assert from 'node:assert/strict'
import { test } from 'vitest'
import { BACKGROUND_PRESETS } from './backgrounds.js'
import { CERTIFICATE_STYLES } from './styles/index.js'

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
  assert.equal(floral.recolor, 'bitmap')
  assert.equal(floral.primaryOnly, true)
  assert.match(floral.palette.primary, /^#[0-9a-f]{6}$/)

  for (const preset of BACKGROUND_PRESETS) {
    if (!preset.palette) continue
    assert.match(preset.palette.primary, /^#[0-9a-f]{6}$/)
    assert.match(preset.palette.secondary, /^#[0-9a-f]{6}$/)
  }
})
