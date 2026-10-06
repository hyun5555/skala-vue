import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { isStorageRecord, readStoredData, saveStoredData } from '../services/browserStorage.js'

const storageKey = 'weatherDisplayConfig'
const validateConfig = (value) =>
  isStorageRecord(value) &&
  ['celsius', 'fahrenheit'].includes(value.unit) &&
  [0, 1].includes(value.temperaturePrecision)
    ? { unit: value.unit, temperaturePrecision: value.temperaturePrecision }
    : null

export const useConfigStore = defineStore('config', () => {
  const restored = readStoredData(storageKey, validateConfig, {
    unit: 'celsius',
    temperaturePrecision: 0,
  })
  const unit = ref(restored.data.unit)
  const temperaturePrecision = ref(restored.data.temperaturePrecision)
  const storageError = ref(restored.error)

  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))
  const unitLabel = computed(() => (unit.value === 'celsius' ? '섭씨' : '화씨'))

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
    return saveConfig()
  }

  function toggleTemperaturePrecision() {
    temperaturePrecision.value = temperaturePrecision.value === 0 ? 1 : 0
    return saveConfig()
  }

  function saveConfig() {
    storageError.value = saveStoredData(storageKey, {
      unit: unit.value,
      temperaturePrecision: temperaturePrecision.value,
    })
    return !storageError.value
  }

  function clearStorageError() {
    storageError.value = ''
  }

  function formatTemperature(celsius) {
    if (!Number.isFinite(celsius)) return '정보 부족'
    const temperature = unit.value === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius
    return `${temperature.toFixed(temperaturePrecision.value)}${unitSymbol.value}`
  }

  return {
    unit,
    temperaturePrecision,
    unitSymbol,
    unitLabel,
    storageError,
    clearStorageError,
    toggleUnit,
    toggleTemperaturePrecision,
    formatTemperature,
  }
})
