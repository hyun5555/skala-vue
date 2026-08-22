import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useFavoriteStore = defineStore('favorite', () => {
  const favoriteCityIds = ref([])
  const showOnlyFavorites = ref(false)

  const favoriteCount = computed(() => favoriteCityIds.value.length)

  function toggleFavorite(cityId) {
    favoriteCityIds.value = favoriteCityIds.value.includes(cityId)
      ? favoriteCityIds.value.filter((id) => id !== cityId)
      : [...favoriteCityIds.value, cityId]
  }

  function toggleFavoriteFilter() {
    showOnlyFavorites.value = !showOnlyFavorites.value
  }

  return {
    favoriteCityIds,
    showOnlyFavorites,
    favoriteCount,
    toggleFavorite,
    toggleFavoriteFilter,
  }
})
