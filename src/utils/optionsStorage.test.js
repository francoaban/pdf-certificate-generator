import assert from 'node:assert/strict'
import { afterEach, test, vi } from 'vitest'
import { DEFAULT_OPTIONS } from '../certificates/defaults.js'
import {
  migrateLegacyOptions,
  readOptions,
  saveOptions,
} from './optionsStorage.js'

const STORAGE_KEY = 'certificados:options:v1'

function stubStorage(initial = {}) {
  const store = new Map(Object.entries(initial))
  vi.stubGlobal('localStorage', {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  })
  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
})

test('migrates legacy location keys without losing current values', () => {
  assert.deepEqual(
    migrateLegacyOptions({ contry: 'Uruguay', locations: 'Montevideo', title: 'Curso' }),
    { country: 'Uruguay', city: 'Montevideo', title: 'Curso' },
  )
  assert.deepEqual(
    migrateLegacyOptions({ country: 'Chile', city: 'Santiago', contry: 'Uruguay' }),
    { country: 'Chile', city: 'Santiago' },
  )
})

test('reads legacy options and merges defaults', () => {
  const store = stubStorage({
    [STORAGE_KEY]: JSON.stringify({ contry: 'Uruguay', locations: 'Montevideo', title: 'Curso' }),
  })
  const { options, error } = readOptions()

  assert.equal(error, null)
  assert.equal(options.country, 'Uruguay')
  assert.equal(options.city, 'Montevideo')
  assert.equal(options.title, 'Curso')
  assert.equal(options.style, DEFAULT_OPTIONS.style)
  assert.ok(store.size > 0)
})

test('keeps assets in localStorage when they were not stored in IndexedDB', async () => {
  const store = stubStorage()
  const customLogo = { dataUrl: 'data:image/png;base64,AAA', ratio: 1 }

  await saveOptions(
    { ...DEFAULT_OPTIONS, customLogo },
    { saveAssets: false, assetsStored: false },
  )

  const saved = JSON.parse(store.get(STORAGE_KEY))
  assert.deepEqual(saved.customLogo, customLogo)
})

test('treats the background image as an asset like the logo', async () => {
  const store = stubStorage()
  const imageBackground = {
    dataUrl: 'data:image/jpeg;base64,AAA',
    ratio: 1.5,
    name: 'fondo.jpg',
  }

  await saveOptions(
    { ...DEFAULT_OPTIONS, imageBackground },
    { saveAssets: false, assetsStored: true },
  )

  const saved = JSON.parse(store.get(STORAGE_KEY))
  assert.equal(Object.hasOwn(saved, 'imageBackground'), false)
})

test('removes assets from localStorage only when they are safe in IndexedDB', async () => {
  const store = stubStorage()
  const customLogo = { dataUrl: 'data:image/png;base64,AAA', ratio: 1 }

  await saveOptions(
    { ...DEFAULT_OPTIONS, customLogo },
    { saveAssets: false, assetsStored: true },
  )

  const saved = JSON.parse(store.get(STORAGE_KEY))
  assert.equal(Object.hasOwn(saved, 'customLogo'), false)
})

test('keeps assets in localStorage if writing them to IndexedDB fails', async () => {
  const store = stubStorage()
  const customLogo = { dataUrl: 'data:image/png;base64,AAA', ratio: 1 }
  vi.stubGlobal('indexedDB', undefined)

  await assert.rejects(
    saveOptions({ ...DEFAULT_OPTIONS, customLogo }, { saveAssets: true }),
    /IndexedDB/i,
  )

  const saved = JSON.parse(store.get(STORAGE_KEY))
  assert.deepEqual(saved.customLogo, customLogo)
})

test('sanitizes corrupted saved options instead of breaking the app', () => {
  stubStorage({
    [STORAGE_KEY]: JSON.stringify({
      title: 42,
      style: 'inexistente',
      useLogo: 'false',
      imageBackground: 'javascript:alert(1)',
      customLogo: { dataUrl: 'javascript:alert(1)' },
    }),
  })

  const { options, error } = readOptions()

  assert.equal(options.title, DEFAULT_OPTIONS.title)
  assert.equal(options.style, DEFAULT_OPTIONS.style)
  assert.equal(options.useLogo, false)
  assert.equal(options.imageBackground, null)
  assert.equal(options.customLogo, null)
  assert.match(error.message, /corrigieron/i)
})
