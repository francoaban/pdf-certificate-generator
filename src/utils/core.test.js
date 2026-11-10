import assert from 'node:assert/strict'
import { test } from 'vitest'
import {
  cleanDocument,
  formatDocument,
  guessDocType,
  validateDocument,
} from './documents.js'
import { applyCase, normalizeText } from './text.js'
import {
  allocateUniqueFileName,
  buildFileName,
  generateCertificateCode,
  resolveRecord,
} from './records.js'

test('documents: normalizes identifiers and validates DNI and passport', () => {
  assert.equal(cleanDocument('D.N.I. 12.345.678'), '12345678')
  assert.equal(cleanDocument('ab-123 456', 'PASAPORTE'), 'AB123456')
  assert.equal(formatDocument('12345678', 'DNI'), '12.345.678')
  assert.deepEqual(validateDocument('12345678', 'DNI'), {
    valid: true,
    empty: false,
    message: '',
  })
  assert.equal(validateDocument('123', 'DNI').valid, false)
  assert.equal(guessDocType('AB123456'), 'PASAPORTE')
})

test('documents: does not guess foreign DNI from a numeric range', () => {
  assert.equal(guessDocType('93456789'), 'DNI')
  assert.equal(guessDocType('12345678'), 'DNI')
})

test('text: normalizes accents and applies Spanish title casing', () => {
  assert.equal(normalizeText('  María-Pérez  '), 'maria perez')
  assert.equal(applyCase('  juan   pérez de la cruz ', 'title'), 'Juan Pérez de la Cruz')
  assert.equal(applyCase('María', 'upper'), 'MARÍA')
})

test('records: resolves display values and formats safe filenames', () => {
  const record = {
    nombre: 'María',
    apellido: 'Pérez',
    docNumber: '12345678',
    curso: 'Primeros auxilios',
    horas: '12',
    fecha: '8 de noviembre',
    instructor: 'Ana',
    codigo: 'CERT-123',
  }
  const view = resolveRecord(record, { caseMode: 'upper' })

  assert.equal(view.fullName, 'MARÍA PÉREZ')
  assert.equal(view.docLine, 'DNI N° 12.345.678')
  const hiddenDocument = resolveRecord(record, { showDocument: false })
  assert.equal(hiddenDocument.docLine, '')
  assert.equal(hiddenDocument.docDisplay, '12.345.678')
  assert.equal(view.course, 'Primeros auxilios')
  assert.equal(view.code, 'CERT-123')
  assert.equal(buildFileName(view, record), 'Certificado_MARÍA_PÉREZ')
})

test('records: generates secure unique certificate code format', () => {
  assert.match(generateCertificateCode(), /^CERT-[0-9A-F]{8}(?:-[0-9A-F]{4}){3}-[0-9A-F]{12}$/)
})

test('records: falls back from unknown document types and keeps generated codes stable', () => {
  const record = {
    nombre: 'Ana',
    apellido: 'Sur',
    docNumber: '12345678',
    docType: 'NO_EXISTE',
  }

  const first = resolveRecord(record, { defaultDocType: 'TAMPOCO' })
  const second = resolveRecord(record, { defaultDocType: 'TAMPOCO' })

  assert.equal(first.docType, 'DNI')
  assert.equal(first.docLine, 'DNI N° 12.345.678')
  assert.equal(first.code, second.code)
})

test('records: normalizes spreadsheet dates for the certificate', () => {
  const view = resolveRecord(
    { nombre: 'Ana', apellido: 'Sur', fecha: '2026-10-12' },
    {},
  )
  assert.equal(view.date, '12 de octubre de 2026')
})

test('records: allocates unique ZIP names without overwriting existing suffixes', () => {
  const used = new Set()
  assert.equal(allocateUniqueFileName('Certificado_Perez_2', used), 'Certificado_Perez_2')
  assert.equal(allocateUniqueFileName('Certificado_Perez', used), 'Certificado_Perez')
  assert.equal(allocateUniqueFileName('Certificado_Perez', used), 'Certificado_Perez_3')
  assert.equal(allocateUniqueFileName('certificado_perez_3', used), 'certificado_perez_3_2')
})
