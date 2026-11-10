import { generateCertificateCode } from '../../../utils/records'

const normalizeCode = (code) => String(code ?? '').trim().toLocaleLowerCase('es')

export function regenerateDuplicateCodes(records, createCode = generateCertificateCode) {
  const counts = new Map()
  for (const record of records) {
    const code = normalizeCode(record.codigo)
    if (code) counts.set(code, (counts.get(code) || 0) + 1)
  }

  const used = new Set(counts.keys())
  return records.map((record) => {
    const code = normalizeCode(record.codigo)
    if (!code || counts.get(code) <= 1) return record

    let nextCode
    let normalizedNextCode
    do {
      nextCode = createCode()
      normalizedNextCode = normalizeCode(nextCode)
    } while (!normalizedNextCode || used.has(normalizedNextCode))

    used.add(normalizedNextCode)
    return { ...record, codigo: nextCode }
  })
}
