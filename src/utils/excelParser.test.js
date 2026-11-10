import assert from 'node:assert/strict'
import { test } from 'vitest'
import * as XLSX from 'xlsx'
import { parseSheet, readWorkbook } from './excelParser.js'

function csvFile(bytes, name = 'participantes.csv') {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  return {
    name,
    type: 'text/csv',
    arrayBuffer: async () => buffer,
  }
}

test('reads an Excel Spanish CSV without BOM encoded as Windows-1252', async () => {
  const bytes = Uint8Array.from([
    78, 111, 109, 98, 114, 101, 44, 65, 112, 101, 108, 108, 105, 100, 111, 13, 10,
    77, 97, 114, 237, 97, 44, 80, 233, 114, 101, 122, 13, 10,
  ])
  const workbook = await readWorkbook(csvFile(bytes))
  const sheet = parseSheet(workbook, workbook.SheetNames[0])

  assert.equal(sheet.records[0].nombre, 'María')
  assert.equal(sheet.records[0].apellido, 'Pérez')
})

test('reads UTF-8 CSV without BOM without damaging accents', async () => {
  const bytes = new TextEncoder().encode('Nombre,Apellido\r\nMaría,Pérez\r\n')
  const workbook = await readWorkbook(csvFile(bytes))
  const sheet = parseSheet(workbook, workbook.SheetNames[0])

  assert.equal(sheet.records[0].nombre, 'María')
  assert.equal(sheet.records[0].apellido, 'Pérez')
})

test('reads per-row certificate metadata and creates unique codes', async () => {
  const bytes = new TextEncoder().encode(
    'Nombre,Apellido,Curso,Horas,Fecha,Instructor,Código\r\nAna,Sur,Primeros auxilios,12,2026-10-12,Lucía,\r\nLeo,Mar,Excel,8,2026-10-13,Tomás,\r\n',
  )
  const workbook = await readWorkbook(csvFile(bytes))
  const sheet = parseSheet(workbook, workbook.SheetNames[0])

  assert.equal(sheet.records[0].curso, 'Primeros auxilios')
  assert.equal(sheet.records[0].horas, '12')
  assert.equal(sheet.records[0].fecha, '12 de octubre de 2026')
  assert.equal(sheet.records[0].instructor, 'Lucía')
  assert.match(sheet.records[0].codigo, /^CERT-[0-9A-F-]{36}$/)
  assert.notEqual(sheet.records[0].codigo, sheet.records[1].codigo)
  assert.equal(sheet.columns.courseKey, 'Curso')
  assert.equal(sheet.columns.codeKey, 'Código')
})

test('does not confuse a course name column with the participant name', async () => {
  const bytes = new TextEncoder().encode(
    'Nombre del curso,Nombre del participante,Apellido\r\nExcel,Ana,Sur\r\n',
  )
  const workbook = await readWorkbook(csvFile(bytes))
  const sheet = parseSheet(workbook, workbook.SheetNames[0])

  assert.equal(sheet.columns.courseKey, 'Nombre del curso')
  assert.equal(sheet.columns.nameKey, 'Nombre del participante')
  assert.equal(sheet.records[0].curso, 'Excel')
  assert.equal(sheet.records[0].nombre, 'Ana')
})

test('keeps duplicate certificate codes so the table can flag and fix them', async () => {
  const bytes = new TextEncoder().encode(
    'Nombre,Apellido,Código\r\nAna,Sur,cert-1\r\nLeo,Mar,CERT-1\r\n',
  )
  const workbook = await readWorkbook(csvFile(bytes))
  const sheet = parseSheet(workbook, workbook.SheetNames[0])

  assert.equal(sheet.records.length, 2)
  assert.equal(sheet.records[0].codigo, 'cert-1')
  assert.equal(sheet.records[1].codigo, 'CERT-1')
})

test('reads per-row fields from an Excel workbook', async () => {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Nombre', 'Apellido', 'Curso', 'Horas', 'Fecha', 'Instructor', 'Código'],
    ['Ana', 'Sur', 'Primeros auxilios', 12, '2026-10-12', 'Lucía', 'CERT-A'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificados')
  const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  const file = {
    name: 'certificados.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    arrayBuffer: async () => bytes,
  }
  const result = await readWorkbook(file)
  const sheet = parseSheet(result, result.SheetNames[0])

  assert.equal(sheet.records[0].curso, 'Primeros auxilios')
  assert.equal(sheet.records[0].horas, '12')
  assert.equal(sheet.records[0].fecha, '12 de octubre de 2026')
  assert.equal(sheet.records[0].instructor, 'Lucía')
  assert.equal(sheet.records[0].codigo, 'CERT-A')
})
