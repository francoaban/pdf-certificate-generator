import assert from 'node:assert/strict'
import { test } from 'vitest'
import { generateBulkPdf, generateCertificate, generateZip } from './pdfGenerator.js'

test('cancels individual and batch generation before preparing resources', async () => {
  const controller = new AbortController()
  controller.abort()

  await assert.rejects(
    generateCertificate({ nombre: 'Ana' }, {}, { signal: controller.signal }),
    { name: 'AbortError' },
  )
  await assert.rejects(
    generateBulkPdf([{ nombre: 'Ana' }], {}, { signal: controller.signal }),
    { name: 'AbortError' },
  )
  await assert.rejects(
    generateZip([{ nombre: 'Ana' }], {}, { signal: controller.signal }),
    { name: 'AbortError' },
  )
})
