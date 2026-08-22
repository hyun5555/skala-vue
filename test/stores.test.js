import assert from 'node:assert/strict'
import test from 'node:test'
import { createPinia, setActivePinia } from 'pinia'
import { useConfigStore } from '../src/stores/configStore.js'
import { useFavoriteStore } from '../src/stores/favoriteStore.js'

test('온도 설정과 관심 도시 store가 상태를 변경한다', () => {
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
})
