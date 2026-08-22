import { Buffer } from 'node:buffer'

const isKoreanCoordinate = (lat, lon) => lat >= 32 && lat <= 39.5 && lon >= 124 && lon <= 132.5

export const createLocationId = ({ name, lat, lon }) =>
  `geo_${Buffer.from(JSON.stringify({ name, lat, lon })).toString('base64url')}`

export const parseLocationId = (id) => {
  if (!id?.startsWith('geo_')) return null
  try {
    const { name, lat, lon } = JSON.parse(Buffer.from(id.slice(4), 'base64url').toString())
    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.length > 60 ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !isKoreanCoordinate(lat, lon)
    )
      return null
    return { id, name: name.trim(), lat, lon }
  } catch {
    return null
  }
}
