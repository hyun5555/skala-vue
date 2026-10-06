import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isStorageRecord,
  readStoredData,
  removeStoredData,
  saveStoredData,
} from '../src/services/browserStorage.js'

const useStorage = (t, methods) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, ...methods })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  })
}

const validate = (value) =>
  isStorageRecord(value) && typeof value.name === 'string' ? { name: value.name } : null

test('브라우저 저장소 getter 자체가 거부돼도 읽기·쓰기·삭제는 throw하지 않는다', (t) => {
  useStorage(t, {
    get() {
      throw new Error('SecurityError')
    },
  })
  const restored = readStoredData('test', validate, null)
  assert.equal(restored.data, null)
  assert.match(restored.error, /읽지 못/)
  assert.match(saveStoredData('test', { name: 'test' }), /저장하지 못/)
  assert.match(removeStoredData('test'), /삭제하지 못/)
})

test('손상 JSON 복구 중 삭제가 거부되면 기본값과 재등장 가능성을 알린다', (t) => {
  useStorage(t, {
    value: {
      getItem: () => '{broken',
      removeItem() {
        throw new Error('SecurityError')
      },
    },
  })
  const restored = readStoredData('test', validate, { name: 'default' })
  assert.deepEqual(restored.data, { name: 'default' })
  assert.match(restored.error, /삭제하지 못/)
  assert.match(restored.error, /다시 나타날/)
})

test('version 1만 복원하고 legacy 복원은 명시적으로 허용해야 한다', (t) => {
  let raw = JSON.stringify({ name: '몽이' })
  let removed = false
  useStorage(t, {
    value: {
      getItem: () => raw,
      removeItem: () => {
        removed = true
      },
    },
  })
  const legacy = readStoredData('test', validate, null, { allowLegacy: true })
  assert.deepEqual(legacy.data, { name: '몽이' })
  assert.equal(legacy.legacy, true)
  assert.equal(readStoredData('test', validate, null).data, null)
  assert.equal(removed, true)
  raw = JSON.stringify({ version: 1, data: { name: '몽이', token: 'test-only-token' } })
  assert.deepEqual(readStoredData('test', validate, null), {
    data: { name: '몽이' },
    error: '',
    legacy: false,
  })
  raw = JSON.stringify({ version: 2, data: { name: '몽이' } })
  removed = false
  const future = readStoredData('test', validate, null, { allowLegacy: true })
  assert.equal(future.data, null)
  assert.match(future.error, /버전을 지원하지/)
  assert.equal(removed, false)
})
