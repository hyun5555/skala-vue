import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius')
  const temperaturePrecision = ref(0)

  const unitSymbol = computed(() => (unit.value === 'celsius' ? '℃' : '℉'))
  const unitLabel = computed(() => (unit.value === 'celsius' ? '섭씨' : '화씨'))

  function toggleUnit() {
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }

  function toggleTemperaturePrecision() {
    temperaturePrecision.value = temperaturePrecision.value === 0 ? 1 : 0
  }

  function formatTemperature(celsius) {
    const temperature = unit.value === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius
    return `${temperature.toFixed(temperaturePrecision.value)}${unitSymbol.value}`
  }

  return {
    unit,
    temperaturePrecision,
    unitSymbol,
    unitLabel,
    toggleUnit,
    toggleTemperaturePrecision,
    formatTemperature,
  }
})
