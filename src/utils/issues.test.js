import assert from 'node:assert/strict'
import { test } from 'vitest'
import { computeIssues } from './issues.js'

const records = [
  { id: 1, docNumber: '12345678', docType: 'DNI', codigo: 'CERT-1' },
  { id: 2, docNumber: '12345678', docType: 'DNI', codigo: 'CERT-2' },
  { id: 3, docNumber: '123', docType: 'DNI', codigo: 'CERT-3' },
  { id: 4, docNumber: '', docType: null, codigo: 'cert-1' },
]

test('issues: reports duplicate documents, invalid documents and duplicate codes', () => {
  const issues = computeIssues(records, { defaultDocType: 'auto' })

  assert.equal(issues.get(1).duplicate, true)
  assert.equal(issues.get(2).duplicate, true)
  assert.match(issues.get(3).invalid, /dígitos/i)
  assert.equal(issues.get(4).codeDuplicate, true)
  assert.equal(issues.get(1).codeDuplicate, true)
})

test('issues: does not flag valid unique rows', () => {
  const issues = computeIssues(
    [{ id: 1, docNumber: '30123456', docType: 'DNI', codigo: 'CERT-A' }],
    { defaultDocType: 'auto' },
  )
  assert.equal(issues.size, 0)
})
