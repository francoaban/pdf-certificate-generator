import assert from 'node:assert/strict'
import { test } from 'vitest'
import QRCode from 'qrcode'

test('generates QR PNG data locally without a network service', async () => {
  const dataUrl = await QRCode.toDataURL(
    JSON.stringify({ type: 'certificados-verification', code: 'CERT-TEST' }),
    { errorCorrectionLevel: 'M', margin: 1, width: 192 },
  )

  assert.match(dataUrl, /^data:image\/png;base64,/)
})
