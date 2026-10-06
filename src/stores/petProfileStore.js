import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  isStorageRecord,
  readStoredData,
  removeStoredData,
  saveStoredData,
} from '../services/browserStorage.js'

const storageKey = 'petWeatherProfile'
export const emptyPetProfile = () => ({
  name: '',
  breedName: '',
  age: 3,
  weight: 5,
  coatLength: 'short',
  activity: 'normal',
})

const validText = (value, maxLength) =>
  typeof value === 'string' &&
  value.trim().length > 0 &&
  value.length <= maxLength &&
  !/\p{Cc}/u.test(value)

export function validatePetProfile(value) {
  if (
    !isStorageRecord(value) ||
    !validText(value.name, 20) ||
    !validText(value.breedName, 100) ||
    !Number.isFinite(value.age) ||
    value.age < 0 ||
    value.age > 30 ||
    !Number.isFinite(value.weight) ||
    value.weight < 0.5 ||
    value.weight > 120 ||
    !['short', 'medium', 'long'].includes(value.coatLength) ||
    !['low', 'normal', 'high'].includes(value.activity)
  )
    return null
  return {
    name: value.name.trim(),
    breedName: value.breedName.trim(),
    age: value.age,
    weight: value.weight,
    coatLength: value.coatLength,
    activity: value.activity,
  }
}

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
