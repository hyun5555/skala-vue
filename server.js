import axios from 'axios'
import deploymentConfig from './vercel.json' with { type: 'json' }
import {
  createLocationId,
  getKakaoPlaceUrl,
  isKoreanCoordinate,
  parseLocationId,
} from './server-utils.js'

const cities = [
  { id: 'city_01', name: '서울', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '수원', lat: 37.2636, lon: 127.0286 },
  { id: 'city_03', name: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'city_04', name: '제주', lat: 33.4996, lon: 126.5312 },
  { id: 'city_05', name: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'city_06', name: '광주', lat: 35.1595, lon: 126.8526 },
]

export const securityHeaders = Object.fromEntries(
  deploymentConfig.headers
    .find(({ source }) => source === '/(.*)')
    .headers.map(({ key, value }) => [key, value]),
)

const weatherClient = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
  adapter: 'fetch',
  timeout: 8000,
})
const airClient = axios.create({
  baseURL: 'https://air-quality-api.open-meteo.com/v1',
  adapter: 'fetch',
  timeout: 8000,
})
const forecastClient = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  adapter: 'fetch',
  timeout: 8000,
})
const geocodingClient = axios.create({
  baseURL: 'https://api.openweathermap.org/geo/1.0',
  adapter: 'fetch',
  timeout: 8000,
})
const kakaoClient = axios.create({
  baseURL: 'https://dapi.kakao.com/v2/local/search',
  adapter: 'fetch',
  timeout: 8000,
})

const weatherEmoji = (icon = '') =>
  ({
    '01': '☀️',
    '02': '🌤️',
    '03': '☁️',
    '04': '☁️',
    '09': '🌧️',
    10: '🌦️',
    11: '⛈️',
    13: '🌨️',
    50: '🌫️',
  })[icon.slice(0, 2)] ?? '🌤️'

const forecastCondition = (code) => {
  if (
    !Number.isInteger(code) ||
    ![
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85,
      86, 95, 96, 99,
    ].includes(code)
  )
    return { condition: 'Unknown', status: '예보 없음', emoji: '❔' }
  if (code >= 95) return { condition: 'Thunderstorm', status: '뇌우', emoji: '⛈️' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return { condition: 'Snow', status: '눈', emoji: '🌨️' }
  if ([51, 53, 55].includes(code)) return { condition: 'Drizzle', status: '이슬비', emoji: '🌧️' }
  if (code >= 51) return { condition: 'Rain', status: '비', emoji: '🌧️' }
  if (code >= 45) return { condition: 'Mist', status: '안개', emoji: '🌫️' }
  if (code >= 2) return { condition: 'Clouds', status: '흐림', emoji: '☁️' }
  return { condition: 'Clear', status: '맑음', emoji: '☀️' }
}

const toWeather = (city, data, airQuality) => ({
  id: city.id,
  name: city.name,
  lat: city.lat,
  lon: city.lon,
  temp: Number.isFinite(data.main.temp) ? Math.round(data.main.temp * 10) / 10 : null,
  feelsLike: Number.isFinite(data.main.feels_like)
    ? Math.round(data.main.feels_like * 10) / 10
    : null,
  status: data.weather[0].description,
  condition: data.weather[0].main,
  weatherCode: data.weather[0].id,
  emoji: weatherEmoji(data.weather[0].icon),
  humidity: data.main.humidity,
  wind: data.wind.speed,
  airQuality,
  rainChance: null,
  precipitation: (data.rain?.['1h'] ?? 0) + (data.snow?.['1h'] ?? 0),
  updatedAt: data.dt * 1000,
})

const getCurrentWeather = (city, env) =>
  weatherClient.get('/weather', {
    params: {
      lat: city.lat,
      lon: city.lon,
      appid: env.OPENWEATHER_API_KEY,
      units: 'metric',
      lang: 'kr',
    },
  })

const searchKoreanLocations = async (query, env) => {
  const { data } = await geocodingClient.get('/direct', {
    params: {
      q: `${query},KR`,
      limit: 5,
      appid: env.OPENWEATHER_API_KEY,
    },
  })
  return [
    ...new Map(
      data
        .filter(({ country }) => country === 'KR')
        .map((location) => {
          const city = {
            name: location.local_names?.ko ?? location.name,
            lat: location.lat,
            lon: location.lon,
          }
          return [
            `${city.lat.toFixed(4)},${city.lon.toFixed(4)}`,
            { ...city, id: createLocationId(city) },
          ]
        }),
    ).values(),
  ]
}

const getAirQuality = async (selectedCities, includeHourly = false) => {
  try {
    const { data } = await airClient.get('/air-quality', {
      params: {
        latitude: selectedCities.map(({ lat }) => lat).join(','),
        longitude: selectedCities.map(({ lon }) => lon).join(','),
        current: 'us_aqi,pm2_5,uv_index',
        ...(includeHourly ? { hourly: 'us_aqi,pm2_5', forecast_hours: 27 } : {}),
        timezone: 'Asia/Seoul',
      },
    })
    return (Array.isArray(data) ? data : [data]).map(({ current, hourly }) =>
      includeHourly ? { current, hourly } : current,
    )
  } catch {
    console.warn('Open-Meteo air quality unavailable.')
    return selectedCities.map(() => (includeHourly ? { current: null, hourly: null } : null))
  }
}

const getDailyForecast = async (city, env) => {
  const { data } = await weatherClient.get('/forecast', {
    params: {
      lat: city.lat,
      lon: city.lon,
      appid: env.OPENWEATHER_API_KEY,
      units: 'metric',
      lang: 'kr',
    },
  })
  return data.list
    .filter((_, index) => index % 8 === 0)
    .slice(0, 5)
    .map((item) => ({
      date: new Date((item.dt + data.city.timezone) * 1000).toISOString().slice(0, 10),
      temp: Math.round(item.main.temp),
      status: item.weather[0].description,
      condition: item.weather[0].main,
      emoji: weatherEmoji(item.weather[0].icon),
      rainChance: Math.round(item.pop * 100),
    }))
}

const getHourlyForecast = async (city) => {
  const { data } = await forecastClient.get('/forecast', {
    params: {
      latitude: city.lat,
      longitude: city.lon,
      hourly:
        'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index',
      // 현재부터 24시간 안의 출발과 최대 2시간 산책의 종료까지 확인한다.
      forecast_hours: 27,
      timezone: 'Asia/Seoul',
    },
  })
  return data.hourly.time.map((time, index) => ({
    time,
    temp: data.hourly.temperature_2m[index],
    feelsLike: data.hourly.apparent_temperature[index],
    humidity: data.hourly.relative_humidity_2m[index],
    rainChance: data.hourly.precipitation_probability[index],
    precipitation: data.hourly.precipitation[index],
    wind: Number.isFinite(data.hourly.wind_speed_10m[index])
      ? Math.round((data.hourly.wind_speed_10m[index] / 3.6) * 10) / 10
      : null,
    uvIndex: data.hourly.uv_index[index],
    weatherCode: data.hourly.weather_code[index],
    ...forecastCondition(data.hourly.weather_code[index]),
  }))
}

let breedsPromise
const getBreeds = () => {
  breedsPromise ??= axios
    .get(
      'https://gist.githubusercontent.com/arturschaefer/abf8f94bcff14ace1b88c7977d651a74/raw/breed_list.json',
      { adapter: 'fetch', timeout: 8000 },
    )
    .then(({ data }) =>
      data.map((breed) => ({
        id: breed.id,
        name: breed.name,
        breedGroup: breed.breed_group ?? '',
        weight: breed.weight?.metric ?? '',
        image: breed.image?.url ?? '',
      })),
    )
    .catch((error) => {
      breedsPromise = null
      throw error
    })
  return breedsPromise
}

const getNearbyPetPlaces = async (lat, lon, env) => {
  const responses = await Promise.all(
    ['애견동반 식당', '애견동반 카페', '반려동물 동반 카페'].map((query) =>
      kakaoClient.get('/keyword.json', {
        headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
        params: { query, x: lon, y: lat, radius: 2000, sort: 'distance', size: 15 },
      }),
    ),
  )
  return [
    ...new Map(
      responses.flatMap(({ data }) => data.documents).map((place) => [place.id, place]),
    ).values(),
  ]
    .sort((a, b) => Number(a.distance) - Number(b.distance))
    .slice(0, 15)
    .map((place) => ({ ...place, place_url: getKakaoPlaceUrl(place.id) }))
}

const json = (body, status = 200, headers = {}) =>
  Response.json(body, {
    status,
    headers: {
      ...securityHeaders,
      'Cache-Control': 'no-store',
      ...headers,
    },
  })

export const handleRequest = async (request, env) => {
  if (request.method !== 'GET') {
    return json({ message: 'GET 요청만 지원합니다.' }, 405, { Allow: 'GET' })
  }
  if (request.url.length > 2048) {
    return json({ message: '요청 주소가 너무 깁니다.' }, 414)
  }
  const url = new URL(request.url)
  const path = url.pathname
  try {
    if (request.method === 'GET' && path === '/api/breeds') {
      return json(await getBreeds())
    }

    if (request.method === 'GET' && path === '/api/places') {
      if (!env.KAKAO_REST_API_KEY) {
        return json({ message: 'KAKAO_REST_API_KEY가 설정되지 않았습니다.' }, 500)
      }
      const latitude = url.searchParams.get('lat')?.trim()
      const longitude = url.searchParams.get('lon')?.trim()
      const lat = Number(latitude)
      const lon = Number(longitude)
      if (!latitude || !longitude || !isKoreanCoordinate(lat, lon)) {
        return json({ message: '국내 지역의 올바른 위도와 경도를 입력해 주세요.' }, 400)
      }
      return json(await getNearbyPetPlaces(lat, lon, env))
    }

    if (path.startsWith('/api/weather') && !env.OPENWEATHER_API_KEY) {
      return json({ message: 'OPENWEATHER_API_KEY가 설정되지 않았습니다.' }, 500)
    }

    if (request.method === 'GET' && path === '/api/weather') {
      const [weatherResponses, airQuality] = await Promise.all([
        Promise.all(cities.map((city) => getCurrentWeather(city, env))),
        getAirQuality(cities),
      ])
      return json(
        weatherResponses.map(({ data }, index) =>
          toWeather(cities[index], data, airQuality[index]),
        ),
      )
    }

    if (request.method === 'GET' && path === '/api/weather/search') {
      const query = url.searchParams.get('q')?.trim() ?? ''
      if (!query || query.length > 40 || /\p{Cc}/u.test(query)) {
        return json({ message: '1~40자의 국내 지역명을 입력해 주세요.' }, 400)
      }
      const locations = await searchKoreanLocations(query, env)
      if (!locations.length) return json([])
      const [weatherResponses, airQuality] = await Promise.all([
        Promise.all(locations.map((city) => getCurrentWeather(city, env))),
        getAirQuality(locations),
      ])
      return json(
        weatherResponses.map(({ data }, index) =>
          toWeather(locations[index], data, airQuality[index]),
        ),
      )
    }

    const cityId = path.match(/^\/api\/weather\/([A-Za-z0-9_-]+)$/)?.[1]
    const city = cities.find(({ id }) => id === cityId) ?? parseLocationId(cityId)
    if (request.method === 'GET' && city) {
      const [{ data }, [airForecast], forecast, hourly] = await Promise.all([
        getCurrentWeather(city, env),
        getAirQuality([city], true),
        getDailyForecast(city, env),
        getHourlyForecast(city),
      ])
      const airByTime = new Map()
      for (const [index, time] of (airForecast.hourly?.time ?? []).entries()) {
        airByTime.set(
          time,
          airByTime.has(time)
            ? { us_aqi: null, pm2_5: null }
            : {
                us_aqi: airForecast.hourly.us_aqi?.[index] ?? null,
                pm2_5: airForecast.hourly.pm2_5?.[index] ?? null,
              },
        )
      }
      return json({
        ...toWeather(city, data, airForecast.current),
        forecast,
        hourly: hourly.map((slot) => ({
          ...slot,
          airQuality: airByTime.has(slot.time)
            ? { ...airByTime.get(slot.time), uv_index: slot.uvIndex }
            : null,
        })),
      })
    }

    return json({ message: '요청한 날씨 API를 찾을 수 없습니다.' }, 404)
  } catch (error) {
    // Upstream error bodies and messages may contain API keys, tokens, or coordinates.
    console.error('External API request failed:', {
      service: path === '/api/places' ? 'places' : path === '/api/breeds' ? 'breeds' : 'weather',
      status: Number.isInteger(error.response?.status) ? error.response.status : null,
    })
    const invalidKey = error.response?.status === 401
    const kakaoMapDisabled = path === '/api/places' && error.response?.status === 403
    return json(
      {
        message:
          path === '/api/places'
            ? kakaoMapDisabled
              ? 'Kakao Developers 앱의 카카오맵 사용 설정을 ON으로 변경해 주세요.'
              : invalidKey
                ? 'Kakao REST API 키가 유효하지 않습니다.'
                : '주변 반려동물 동반 장소를 불러오지 못했습니다.'
            : path === '/api/breeds'
              ? '견종 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
              : invalidKey
                ? 'OpenWeatherMap API 키가 유효하지 않거나 아직 활성화되지 않았습니다.'
                : '외부 날씨 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      },
      invalidKey || kakaoMapDisabled ? 502 : 503,
    )
  }
}

export default { fetch: handleRequest }
