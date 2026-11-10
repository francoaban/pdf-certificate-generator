import assert from 'node:assert/strict'
import { test } from 'vitest'
import { DEFAULT_OPTIONS } from '../certificates/defaults.js'
import { readConfiguration } from './configuration.js'

const jsonFile = (data) => ({ text: async () => JSON.stringify(data) })

test('imports app-exported config including IndexedDB assets', async () => {
  const signature = { dataUrl: 'data:image/png;base64,abc', ratio: 2, name: 'firma.png' }
  const options = await readConfiguration(
    jsonFile({
      format: 'certificados-config',
      version: 1,
      options: { title: 'Curso', signatureLeftImage: signature },
    }),
  )

  assert.equal(options.title, 'Curso')
  assert.deepEqual(options.signatureLeftImage, signature)
  assert.equal(options.showVerificationQr, DEFAULT_OPTIONS.showVerificationQr)
})

test('imports compatible plain options JSON', async () => {
  const options = await readConfiguration(jsonFile({ title: 'Importado', country: 'Uruguay' }))

  assert.equal(options.title, 'Importado')
  assert.equal(options.country, 'Uruguay')
})

test('migrates legacy location keys when importing configuration', async () => {
  const options = await readConfiguration(jsonFile({ contry: 'Uruguay', locations: 'Montevideo' }))

  assert.equal(options.country, 'Uruguay')
  assert.equal(options.city, 'Montevideo')
})

test('migrates the old global font scale when importing configuration', async () => {
  const options = await readConfiguration(jsonFile({ fontScale: 120 }))

  assert.equal(options.titleSize, 120)
  assert.equal(options.bodySize, 120)
  assert.equal(options.dateSize, 120)
})

test('rejects an unknown default document type', async () => {
  await assert.rejects(
    readConfiguration(jsonFile({ defaultDocType: 'NO_EXISTE' })),
    /tipo de documento/i,
  )
})

test('rejects malformed configuration assets', async () => {
  await assert.rejects(
    readConfiguration(jsonFile({ signatureRightImage: { ratio: 2 } })),
    /imagen válida/i,
  )
})

test('rejects an unknown style and keeps known options only', async () => {
  await assert.rejects(
    readConfiguration(jsonFile({ style: 'inexistente' })),
    /style/i,
  )

  const options = await readConfiguration(
    jsonFile({ title: 'Curso', extra: 'ignorada' }),
  )
  assert.equal(options.title, 'Curso')
  assert.equal(Object.hasOwn(options, 'extra'), false)
})

test('imports an uploaded background asset', async () => {
  const options = await readConfiguration(
    jsonFile({
      imageBackground: {
        dataUrl: 'data:image/jpeg;base64,AAAA',
        ratio: 1.5,
        name: 'fondo.jpg',
      },
      showImageBackground: true,
    }),
  )
  assert.equal(options.imageBackground.name, 'fondo.jpg')
  assert.equal(options.showImageBackground, true)
})

test('rejects unsafe background sources and future config versions', async () => {
  await assert.rejects(
    readConfiguration(jsonFile({ imageBackground: 'http://example.com/fondo.png' })),
    /HTTPS|imagen local/i,
  )
  await assert.rejects(
    readConfiguration(
      jsonFile({ format: 'certificados-config', version: 99, options: { title: 'X' } }),
    ),
    /versión/i,
  )
})

test('rejects configuration files that are too large', async () => {
  await assert.rejects(
    readConfiguration({
      size: 40 * 1024 * 1024,
      text: async () => '{}',
    }),
    /límite/i,
  )
})
