import { Buffer } from 'node:buffer'

export const isKoreanCoordinate = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= 32 &&
  lat <= 39.5 &&
  lon >= 124 &&
  lon <= 132.5

export const createLocationId = ({ name, lat, lon }) =>
  `geo_${Buffer.from(JSON.stringify({ name, lat, lon })).toString('base64url')}`

export const getKakaoPlaceUrl = (id) =>
  /^\d{1,30}$/.test(String(id)) ? `https://place.map.kakao.com/${id}` : ''

export const parseLocationId = (id) => {
  if (typeof id !== 'string' || id.length > 512 || !/^geo_[A-Za-z0-9_-]+$/.test(id)) return null
  try {
    const { name, lat, lon } = JSON.parse(Buffer.from(id.slice(4), 'base64url').toString())
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 60 ||
      /\p{Cc}/u.test(name) ||
      !isKoreanCoordinate(lat, lon)
    )
      return null
    return { id, name: name.trim(), lat, lon }
  } catch {
    return null
  }
}
