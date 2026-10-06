import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import {
  emptyPetProfile,
  usePetProfileStore,
  validatePetProfile,
} from '../src/stores/petProfileStore.js'

const profile = () => ({ ...emptyPetProfile(), name: '몽이', breedName: 'Poodle' })
const useStorage = (t, initial = {}, methods = {}) => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  const items = new Map(Object.entries(initial))
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => items.set(key, value),
      removeItem: (key) => items.delete(key),
      ...methods,
    },
  })
  t.after(() => {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous)
    else delete globalThis.localStorage
  })
  return items
}

test('기존 프로필을 복원하고 토큰·좌표를 제외한 version 1 형식으로 이관한다', (t) => {
  const items = useStorage(t, {
    petWeatherProfile: JSON.stringify({
      ...profile(),
      token: 'test-only-token',
      lat: 'test-only-coordinate',
      lon: 'test-only-coordinate',
    }),
  })
  setActivePinia(createPinia())
  const store = usePetProfileStore()
  assert.equal(store.hasProfile, true)
  assert.deepEqual(store.savedProfile, profile())
  assert.deepEqual(JSON.parse(items.get('petWeatherProfile')), { version: 1, data: profile() })
  assert.equal(store.storageError, '')
})

test('저장 시 초안과 저장 프로필을 분리하고 화면 이동 후 마지막 저장값을 복원한다', (t) => {
  const items = useStorage(t)
  setActivePinia(createPinia())
  const store = usePetProfileStore()
  const draft = { ...profile(), token: 'test-only-token', coordinates: 'test-only-coordinate' }
  assert.equal(store.saveProfile(draft), true)
  draft.name = '수정 중'
  assert.equal(store.savedProfile.name, '몽이')
  assert.deepEqual(JSON.parse(items.get('petWeatherProfile')), { version: 1, data: profile() })
  setActivePinia(createPinia())
  assert.deepEqual(usePetProfileStore().savedProfile, profile())
  assert.equal(usePetProfileStore().resetProfile(), true)
  assert.equal(usePetProfileStore().hasProfile, false)
  assert.equal(items.has('petWeatherProfile'), false)
  setActivePinia(createPinia())
  assert.equal(usePetProfileStore().savedProfile, null)
})

test('프로필 타입·범위·enum·버전을 검증하고 손상된 값은 기본값으로 복구한다', (t) => {
  const items = useStorage(t)
  const invalidProfiles = [
    [],
    null,
    {},
    { ...profile(), name: '   ' },
    { ...profile(), name: 'a'.repeat(21) },
    { ...profile(), breedName: 'a'.repeat(101) },
    { ...profile(), breedName: '\nPoodle' },
    { ...profile(), age: '3' },
    { ...profile(), age: -1 },
    { ...profile(), age: 31 },
    { ...profile(), weight: null },
    { ...profile(), weight: 0.4 },
    { ...profile(), weight: 121 },
    { ...profile(), coatLength: 'unknown' },
    { ...profile(), activity: 'unknown' },
  ]
  for (const value of invalidProfiles) {
    assert.equal(validatePetProfile(value), null)
    items.set('petWeatherProfile', JSON.stringify(value))
    setActivePinia(createPinia())
    assert.equal(usePetProfileStore().savedProfile, null)
    assert.match(usePetProfileStore().storageError, /기본값/)
    assert.equal(items.has('petWeatherProfile'), false)
  }
  assert.ok(validatePetProfile({ ...profile(), age: 0, weight: 0.5 }))
  assert.ok(validatePetProfile({ ...profile(), age: 30, weight: 120 }))
  assert.equal(validatePetProfile({ ...profile(), age: NaN }), null)
  assert.equal(validatePetProfile({ ...profile(), weight: Infinity }), null)
  const future = JSON.stringify({ version: 2, data: profile() })
  items.set('petWeatherProfile', future)
  setActivePinia(createPinia())
  assert.equal(usePetProfileStore().savedProfile, null)
  assert.match(usePetProfileStore().storageError, /버전을 지원하지/)
  assert.equal(items.get('petWeatherProfile'), future)
})

test('저장 실패는 기존 프로필을 유지하고 성공했다고 표시하지 않는다', (t) => {
  const original = JSON.stringify({ version: 1, data: profile() })
  const items = useStorage(
    t,
    { petWeatherProfile: original },
    {
      setItem() {
        throw new Error('QuotaExceededError')
      },
    },
  )
  setActivePinia(createPinia())
  const store = usePetProfileStore()
  assert.equal(store.saveProfile({ ...profile(), name: '다른 이름' }), false)
  assert.deepEqual(store.savedProfile, profile())
  assert.match(store.storageError, /저장하지 못/)
  assert.equal(items.get('petWeatherProfile'), original)
  assert.equal(store.saveProfile({ ...profile(), age: '3' }), false)
  assert.match(store.storageError, /확인해 주세요/)
})

test('삭제 실패는 저장 프로필을 유지하고 새로고침 후 다시 나타날 수 있음을 알린다', (t) => {
  const original = JSON.stringify({ version: 1, data: profile() })
  const items = useStorage(
    t,
    { petWeatherProfile: original },
    {
      removeItem() {
        throw new Error('SecurityError')
      },
    },
  )
  setActivePinia(createPinia())
  const store = usePetProfileStore()
  assert.equal(store.resetProfile(), false)
  assert.equal(store.hasProfile, true)
  assert.deepEqual(store.savedProfile, profile())
  assert.match(store.storageError, /삭제하지 못/)
  assert.match(store.storageError, /다시 나타날/)
  assert.equal(items.get('petWeatherProfile'), original)
  setActivePinia(createPinia())
  assert.deepEqual(usePetProfileStore().savedProfile, profile())
})

test('읽기 거부와 기존 프로필 이관 실패에도 화면에서 사용할 기본값·복원값을 제공한다', (t) => {
  const items = useStorage(
    t,
    {},
    {
      getItem() {
        throw new Error('SecurityError')
      },
    },
  )
  setActivePinia(createPinia())
  assert.equal(usePetProfileStore().hasProfile, false)
  assert.match(usePetProfileStore().storageError, /읽지 못/)
  globalThis.localStorage.getItem = (key) => items.get(key) ?? null
  globalThis.localStorage.setItem = () => {
    throw new Error('QuotaExceededError')
  }
  items.set('petWeatherProfile', JSON.stringify(profile()))
  setActivePinia(createPinia())
  assert.deepEqual(usePetProfileStore().savedProfile, profile())
  assert.match(usePetProfileStore().storageError, /저장하지 못/)
  assert.equal(JSON.parse(items.get('petWeatherProfile')).version, undefined)
})
