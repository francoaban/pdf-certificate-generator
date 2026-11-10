import { describe, expect, it, vi } from 'vitest'
import { regenerateDuplicateCodes } from './codes'

describe('regenerateDuplicateCodes', () => {
  it('replaces duplicate codes without changing unique or empty codes', () => {
    const records = [
      { id: 1, codigo: ' DUP ' },
      { id: 2, codigo: 'dup' },
      { id: 3, codigo: 'unique' },
      { id: 4, codigo: '' },
    ]
    const createCode = vi
      .fn()
      .mockReturnValueOnce('DUP')
      .mockReturnValueOnce('NEW-1')
      .mockReturnValueOnce('NEW-2')

    const result = regenerateDuplicateCodes(records, createCode)

    expect(result.map((record) => record.codigo)).toEqual([
      'NEW-1',
      'NEW-2',
      'unique',
      '',
    ])
    expect(records[0].codigo).toBe(' DUP ')
  })

  it('does not rewrite existing codes when there are no duplicates', () => {
    const records = [{ id: 1, codigo: 'one' }, { id: 2, codigo: '' }]
    const createCode = vi.fn()

    expect(regenerateDuplicateCodes(records, createCode)).toEqual(records)
    expect(createCode).not.toHaveBeenCalled()
  })
})
