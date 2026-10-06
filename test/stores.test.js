import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigStore } from '../src/stores/configStore.js'
import { useFavoriteStore } from '../src/stores/favoriteStore.js'

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

test('온도 설정과 관심 도시를 변경하고 새 store에서 복원한다', (t) => {
  useStorage(t)
  setActivePinia(createPinia())

  const configStore = useConfigStore()
  assert.equal(configStore.formatTemperature(28), '28℃')
  configStore.toggleUnit()
  assert.equal(configStore.formatTemperature(28), '82℉')
  configStore.toggleTemperaturePrecision()
  assert.equal(configStore.formatTemperature(28), '82.4℉')

  const favoriteStore = useFavoriteStore()
  favoriteStore.toggleFavorite('city_01')
  assert.deepEqual(favoriteStore.favoriteCityIds, ['city_01'])
  assert.equal(favoriteStore.favoriteCount, 1)
  favoriteStore.toggleFavorite('city_01')
  assert.equal(favoriteStore.favoriteCount, 0)
  favoriteStore.toggleFavorite('city_03')
  favoriteStore.toggleFavoriteFilter()

  setActivePinia(createPinia())
  assert.equal(useConfigStore().formatTemperature(28), '82.4℉')
  assert.deepEqual(useFavoriteStore().favoriteCityIds, ['city_03'])
  assert.equal(useFavoriteStore().showOnlyFavorites, true)
})

test('온도 설정과 관심 도시의 버전·타입·범위를 검증하고 기본값으로 복구한다', (t) => {
  const items = useStorage(t)
  for (const data of [
    { unit: 'kelvin', temperaturePrecision: 0 },
    { unit: 'celsius', temperaturePrecision: '1' },
    { unit: 'fahrenheit', temperaturePrecision: 100 },
    [],
    null,
  ]) {
    items.set('weatherDisplayConfig', JSON.stringify({ version: 1, data }))
    setActivePinia(createPinia())
    assert.equal(useConfigStore().formatTemperature(28), '28℃')
    assert.match(useConfigStore().storageError, /기본값/)
    assert.equal(items.has('weatherDisplayConfig'), false)
  }
  for (const value of [
    { version: 1, data: { cityIds: ['city_99'], showOnlyFavorites: true } },
    { version: 1, data: { cityIds: [null], showOnlyFavorites: false } },
    { version: 1, data: { cityIds: Array(101).fill('city_01'), showOnlyFavorites: false } },
    { version: 1, data: { cityIds: [], showOnlyFavorites: 'false' } },
    { cityIds: ['city_01'], showOnlyFavorites: false },
  ]) {
    items.set('favoriteWeatherCities', JSON.stringify(value))
    setActivePinia(createPinia())
    assert.deepEqual(useFavoriteStore().favoriteCityIds, [])
    assert.equal(useFavoriteStore().showOnlyFavorites, false)
    assert.match(useFavoriteStore().storageError, /기본값/)
  }
  const future = JSON.stringify({
    version: 2,
    data: { cityIds: ['city_01'], showOnlyFavorites: true },
  })
  items.set('favoriteWeatherCities', future)
  setActivePinia(createPinia())
  assert.deepEqual(useFavoriteStore().favoriteCityIds, [])
  assert.match(useFavoriteStore().storageError, /버전을 지원하지/)
  assert.equal(items.get('favoriteWeatherCities'), future)
})

test('저장 거부 시 현재 화면 설정을 유지하고 실패를 알린다', (t) => {
  useStorage(
    t,
    {},
    {
      setItem() {
        throw new Error('QuotaExceededError')
      },
    },
  )
  setActivePinia(createPinia())
  const config = useConfigStore()
  const favorite = useFavoriteStore()
  assert.equal(config.toggleUnit(), false)
  assert.equal(config.unit, 'fahrenheit')
  assert.match(config.storageError, /저장하지 못/)
  assert.equal(favorite.toggleFavorite('city_01'), false)
  assert.deepEqual(favorite.favoriteCityIds, ['city_01'])
  assert.match(favorite.storageError, /새로고침/)
  config.clearStorageError()
  favorite.clearStorageError()
  assert.equal(config.storageError, '')
  assert.equal(favorite.storageError, '')
  setActivePinia(createPinia())
  assert.equal(useConfigStore().unit, 'celsius')
  assert.deepEqual(useFavoriteStore().favoriteCityIds, [])
})

test('읽기 거부에도 설정 store를 사용할 수 있고 잘못된 도시 입력은 거절한다', (t) => {
  useStorage(
    t,
    {},
    {
      getItem() {
        throw new Error('SecurityError')
      },
    },
  )
  setActivePinia(createPinia())
  assert.equal(useConfigStore().unit, 'celsius')
  assert.match(useConfigStore().storageError, /읽지 못/)
  const favorite = useFavoriteStore()
  assert.deepEqual(favorite.favoriteCityIds, [])
  assert.match(favorite.storageError, /읽지 못/)
  assert.equal(favorite.toggleFavorite('../tokens'), false)
  assert.deepEqual(favorite.favoriteCityIds, [])
})

test('알 수 없는 설정 필드를 저장하지 않고 중복 관심 도시를 정리한다', (t) => {
  const items = useStorage(t, {
    weatherDisplayConfig: JSON.stringify({
      version: 1,
      data: { unit: 'celsius', temperaturePrecision: 0, token: 'test-only-token' },
    }),
    favoriteWeatherCities: JSON.stringify({
      version: 1,
      data: {
        cityIds: ['city_01', 'city_01'],
        showOnlyFavorites: false,
        lat: 'test-only-coordinate',
      },
    }),
  })
  setActivePinia(createPinia())
  useConfigStore().toggleTemperaturePrecision()
  assert.deepEqual(JSON.parse(items.get('weatherDisplayConfig')), {
    version: 1,
    data: { unit: 'celsius', temperaturePrecision: 1 },
  })
  assert.deepEqual(useFavoriteStore().favoriteCityIds, ['city_01'])
  useFavoriteStore().toggleFavoriteFilter()
  assert.deepEqual(JSON.parse(items.get('favoriteWeatherCities')), {
    version: 1,
    data: { cityIds: ['city_01'], showOnlyFavorites: true },
  })
})

test('검색 지역의 관심 표시는 세션에만 유지하고 좌표가 포함된 ID는 저장하지 않는다', (t) => {
  const items = useStorage(t)
  setActivePinia(createPinia())
  const store = useFavoriteStore()
  assert.equal(store.toggleFavorite('city_01'), true)
  assert.equal(store.toggleFavorite('geo_test_only_location'), true)
  assert.deepEqual(store.favoriteCityIds, ['city_01', 'geo_test_only_location'])
  assert.match(store.storageError, /새로고침하면 사라져요/)
  assert.deepEqual(JSON.parse(items.get('favoriteWeatherCities')).data.cityIds, ['city_01'])
  setActivePinia(createPinia())
  assert.deepEqual(useFavoriteStore().favoriteCityIds, ['city_01'])
})
