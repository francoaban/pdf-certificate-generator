import { effectiveDocType, validateDocument } from './documents.js'

const codeKey = (record) => String(record?.codigo ?? '').trim().toLocaleLowerCase('es')

/**
 * Calcula los problemas por fila sin bloquear la importación:
 * - documento con formato dudoso,
 * - documento repetido,
 * - código de certificado repetido.
 */
export function computeIssues(records, { defaultDocType = 'auto' } = {}) {
  const issues = new Map()
  const docCounts = new Map()
  const codeCounts = new Map()

  records.forEach((record) => {
    if (record.docNumber) {
      const key = `${effectiveDocType(record, { defaultDocType })}:${record.docNumber}`
      docCounts.set(key, (docCounts.get(key) || 0) + 1)
    }
    const code = codeKey(record)
    if (code) codeCounts.set(code, (codeCounts.get(code) || 0) + 1)
  })

  records.forEach((record) => {
    const type = effectiveDocType(record, { defaultDocType })
    const check = validateDocument(record.docNumber, type)
    const duplicate =
      !!record.docNumber && docCounts.get(`${type}:${record.docNumber}`) > 1
    const code = codeKey(record)
    const codeDuplicate = !!code && codeCounts.get(code) > 1

    if (!check.valid || duplicate || codeDuplicate) {
      issues.set(record.id, {
        invalid: check.valid ? null : check.message,
        duplicate,
        codeDuplicate,
      })
    }
  })

  return issues
}
