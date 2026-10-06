import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { readStoredData, removeStoredData, saveStoredData } from '../services/browserStorage.js'

import { validatePetProfile } from '../services/petProfile.js'

const storageKey = 'petWeatherProfile'
export { emptyPetProfile, validatePetProfile } from '../services/petProfile.js'

export const usePetProfileStore = defineStore('petProfile', () => {
  const restored = readStoredData(storageKey, validatePetProfile, null, { allowLegacy: true })
  const savedProfile = ref(restored.data)
  const storageError = ref(restored.error)
  const hasProfile = computed(() => savedProfile.value !== null)

  if (restored.legacy) storageError.value = saveStoredData(storageKey, restored.data)

  function saveProfile(draft) {
    const validated = validatePetProfile(draft)
    if (!validated) {
      storageError.value =
        '이름·견종과 나이(0~30세)·몸무게(0.5~120kg)·털 길이·활동량을 확인해 주세요.'
      return false
    }
    storageError.value = saveStoredData(storageKey, validated)
    if (storageError.value) return false
    savedProfile.value = validated
    return true
  }

  function resetProfile() {
    storageError.value = removeStoredData(storageKey)
    if (storageError.value) return false
    savedProfile.value = null
    return true
  }

  return { savedProfile, hasProfile, storageError, saveProfile, resetProfile }
})
