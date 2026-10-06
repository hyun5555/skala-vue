import { isStorageRecord } from './browserStorage.js'

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
