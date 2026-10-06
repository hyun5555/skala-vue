import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { isStorageRecord, readStoredData, saveStoredData } from '../services/browserStorage.js'

const storageKey = 'favoriteWeatherCities'
const isPersistentCityId = (value) => typeof value === 'string' && /^city_0[1-6]$/.test(value)
const isCityId = (value) =>
  typeof value === 'string' &&
  value.length <= 512 &&
  (isPersistentCityId(value) || /^geo_[A-Za-z0-9_-]+$/.test(value))

const validateFavorites = (value) => {
  if (
    !isStorageRecord(value) ||
    !Array.isArray(value.cityIds) ||
    value.cityIds.length > 100 ||
    !value.cityIds.every(isPersistentCityId) ||
    typeof value.showOnlyFavorites !== 'boolean'
  )
    return null
  return { cityIds: [...new Set(value.cityIds)], showOnlyFavorites: value.showOnlyFavorites }
}

export const useFavoriteStore = defineStore('favorite', () => {
  const restored = readStoredData(storageKey, validateFavorites, {
    cityIds: [],
    showOnlyFavorites: false,
  })
  const favoriteCityIds = ref(restored.data.cityIds)
  const showOnlyFavorites = ref(restored.data.showOnlyFavorites)
  const storageError = ref(restored.error)

  const favoriteCount = computed(() => favoriteCityIds.value.length)

  function toggleFavorite(cityId) {
    if (!isCityId(cityId)) {
      storageError.value = '도시 정보가 올바르지 않아 관심 도시를 변경하지 못했어요.'
      return false
    }
    if (!favoriteCityIds.value.includes(cityId) && favoriteCityIds.value.length >= 100) {
      storageError.value = '관심 도시는 최대 100개까지 저장할 수 있어요.'
      return false
    }
    favoriteCityIds.value = favoriteCityIds.value.includes(cityId)
      ? favoriteCityIds.value.filter((id) => id !== cityId)
      : [...favoriteCityIds.value, cityId]
    return saveFavorites()
  }

  function toggleFavoriteFilter() {
    showOnlyFavorites.value = !showOnlyFavorites.value
    return saveFavorites()
  }

  function saveFavorites() {
    const cityIds = favoriteCityIds.value.filter(isPersistentCityId)
    const error = saveStoredData(storageKey, {
      cityIds,
      showOnlyFavorites: showOnlyFavorites.value,
    })
    storageError.value =
      error ||
      (cityIds.length < favoriteCityIds.value.length
        ? '검색한 지역의 관심 표시는 새로고침하면 사라져요. 기본 제공 도시의 관심 표시는 계속 유지돼요.'
        : '')
    return !error
  }

  function clearStorageError() {
    storageError.value = ''
  }

  return {
    favoriteCityIds,
    showOnlyFavorites,
    favoriteCount,
    storageError,
    clearStorageError,
    toggleFavorite,
    toggleFavoriteFilter,
  }
})
