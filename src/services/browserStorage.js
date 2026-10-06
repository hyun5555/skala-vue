const getStorage = () => {
  const storage = globalThis.localStorage
  if (!storage) throw new Error('Storage unavailable')
  return storage
}

export function removeStoredData(key) {
  try {
    getStorage().removeItem(key)
    return ''
  } catch {
    return '저장된 데이터를 삭제하지 못했어요. 기존 데이터가 남아 있어 새로고침하면 다시 나타날 수 있어요. 브라우저 저장소 권한을 확인해 주세요.'
  }
}

export function saveStoredData(key, data) {
  try {
    getStorage().setItem(key, JSON.stringify({ version: 1, data }))
    return ''
  } catch {
    return '브라우저에 저장하지 못했어요. 저장소 권한이나 남은 공간을 확인해 주세요. 새로고침하면 마지막으로 저장한 값으로 돌아갈 수 있어요.'
  }
}

export function readStoredData(key, validate, fallback, { allowLegacy = false } = {}) {
  let raw
  try {
    raw = getStorage().getItem(key)
  } catch {
    return {
      data: fallback,
      error: '저장된 데이터를 읽지 못해 기본값을 사용해요. 브라우저 저장소 권한을 확인해 주세요.',
      legacy: false,
    }
  }
  if (raw === null) return { data: fallback, error: '', legacy: false }

  try {
    const parsed = JSON.parse(raw)
    if (isStorageRecord(parsed) && Number.isInteger(parsed.version) && parsed.version > 1) {
      return {
        data: fallback,
        error:
          '저장된 데이터 버전을 지원하지 않아 기본값을 사용해요. 기존 데이터는 삭제하지 않았어요.',
        legacy: false,
      }
    }
    const legacy = allowLegacy && isStorageRecord(parsed) && !Object.hasOwn(parsed, 'version')
    const data = validate(
      legacy ? parsed : isStorageRecord(parsed) && parsed.version === 1 ? parsed.data : null,
    )
    if (data !== null) return { data, error: '', legacy }
  } catch {
    // 손상된 JSON은 아래에서 기본값으로 복구한다.
  }

  const error = removeStoredData(key)
  return {
    data: fallback,
    error: error
      ? `저장된 데이터가 올바르지 않아 기본값을 사용해요. ${error}`
      : '저장된 데이터가 올바르지 않아 기본값으로 복구했어요.',
    legacy: false,
  }
}

export const isStorageRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
