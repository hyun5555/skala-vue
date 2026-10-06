const hasPrecipitation = ({ condition }) =>
  ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condition)

const uv = ({ uvIndex, airQuality }) => uvIndex ?? airQuality?.uv_index ?? 0

const flatFacedBreed = /Bulldog|Pug|Boxer|Boston Terrier|Pekingese|Shih Tzu|French Bulldog/i
const coldClimateBreed = /Husky|Malamute|Samoyed|Chow|Newfoundland|Bernese/i
const activeBreed =
  /Shepherd|Collie|Retriever|Spaniel|Pointer|Setter|Terrier|Husky|Malamute|Dalmatian|Weimaraner|Vizsla/i

export const calculatePetWalkIndex = ({
  temp,
  feelsLike = temp,
  humidity,
  wind,
  condition,
  airQuality,
  rainChance = 0,
  precipitation = 0,
  uvIndex,
}) => {
  let score = 100
  if (hasPrecipitation({ condition })) score -= 45
  else if (rainChance >= 70) score -= 25
  else if (rainChance >= 40) score -= 12
  if (!hasPrecipitation({ condition }) && precipitation > 0) score -= 8
  if (feelsLike < 0 || feelsLike > 30) score -= 45
  else if (feelsLike < 5 || feelsLike > 26) score -= 25
  if (humidity >= 80) score -= 10
  if (wind >= 7) score -= 15
  if (airQuality?.us_aqi >= 151) score -= 50
  else if (airQuality?.us_aqi >= 101) score -= 35
  else if (airQuality?.us_aqi >= 51) score -= 15
  if (uv({ uvIndex, airQuality }) >= 8) score -= 10
  return Math.max(0, score)
}

export const getPetWalkGuide = (score) => {
  if (score >= 80) return '반려동물과 산책하기 좋은 날씨예요!'
  if (score >= 60) return '짧게 산책하고 물과 휴식을 챙겨 주세요.'
  return '오늘은 노즈워크나 실내 놀이를 추천해요.'
}

export const getDogHeatStatus = (feelsLike) => {
  if (feelsLike >= 30) {
    return { level: 'danger', label: '매우 더움', guide: '한낮 산책을 피하고 실내 활동을 권해요.' }
  }
  if (feelsLike >= 25) {
    return { level: 'hot', label: '더움', guide: '이른 아침에 짧게 걷고 물을 챙겨 주세요.' }
  }
  if (feelsLike > 20) {
    return { level: 'caution', label: '더위 주의', guide: '격한 운동을 줄이고 상태를 살펴 주세요.' }
  }
  return { level: 'safe', label: '대체로 쾌적', guide: '개별 건강 상태를 확인하며 산책하세요.' }
}

export const getBreedFeelsLike = ({ feelsLike, temp = feelsLike }, profile = {}) => {
  const base = feelsLike ?? temp
  const breed = profile.breedName ?? ''
  const heatSensitive = flatFacedBreed.test(breed) || coldClimateBreed.test(breed)
  if (base >= 20) {
    return (
      Math.round((base + (heatSensitive ? 3 : 0) + (profile.coatLength === 'long' ? 2 : 0)) * 10) /
      10
    )
  }
  return (
    Math.round(
      (base - (Number(profile.weight) <= 7 ? 2 : 0) - (profile.coatLength === 'short' ? 1 : 0)) *
        10,
    ) / 10
  )
}

export const calculatePersonalizedWalkIndex = (weather, profile = {}) => {
  let score = calculatePetWalkIndex({
    ...weather,
    feelsLike: getBreedFeelsLike(weather, profile),
  })
  const age = Number(profile.age)
  if ((age <= 1 || age >= 8) && (weather.feelsLike < 5 || weather.feelsLike > 25)) score -= 8
  if (profile.activity === 'high' && weather.feelsLike > 25) score -= 6
  return Math.max(0, score)
}

export const getWalkAnalysis = (weather) => {
  const reasons = []
  const risks = []
  const feelsLike = weather.feelsLike ?? weather.temp
  const currentUv = uv(weather)
  const aqi = weather.airQuality?.us_aqi

  if (feelsLike > 26) {
    reasons.push('체감온도가 높아 오래 걷기에는 부담스러워요.')
    risks.push({ icon: '🌡️', label: '고온', detail: `체감 ${feelsLike}℃` })
  } else if (feelsLike < 5) {
    reasons.push('체감온도가 낮아 발 보호와 보온이 필요해요.')
    risks.push({ icon: '❄️', label: '한파', detail: `체감 ${feelsLike}℃` })
  } else reasons.push('현재 기온과 체감온도는 산책하기 무난해요.')

  if (weather.humidity >= 80) {
    reasons.push('습도가 높아 체온을 식히기 어려울 수 있어요.')
    risks.push({ icon: '💧', label: '높은 습도', detail: `${weather.humidity}%` })
  }
  if (hasPrecipitation(weather) || weather.rainChance >= 60) {
    reasons.push(`강수 가능성이 있어 우비와 수건을 준비해 주세요.`)
    risks.push({ icon: '🌧️', label: '비', detail: `강수확률 ${weather.rainChance ?? 0}%` })
  }
  if (weather.wind >= 7) risks.push({ icon: '💨', label: '강풍', detail: `${weather.wind}m/s` })
  if (currentUv >= 6) {
    reasons.push('자외선이 강한 시간은 피하고 그늘을 이용해 주세요.')
    risks.push({ icon: '☀️', label: '자외선', detail: `UV ${Math.round(currentUv)}` })
  }
  if (aqi >= 101) {
    reasons.push('대기질이 나빠 산책 시간을 줄이는 편이 좋아요.')
    risks.push({ icon: '😷', label: '미세먼지', detail: `AQI ${Math.round(aqi)}` })
  }

  const pavementRisk =
    hasPrecipitation(weather) || feelsLike < 0
      ? { level: '주의', detail: '젖거나 언 노면을 조심하세요.' }
      : weather.temp >= 28 && currentUv >= 6
        ? { level: '높음', detail: '노면 고온 위험이 높게 추정돼요.' }
        : weather.temp >= 24 && currentUv >= 4
          ? { level: '보통', detail: '노면 온도를 손등으로 확인하세요.' }
          : { level: '낮음', detail: '현재 노면 고온 위험은 낮게 추정돼요.' }

  return { reasons, risks, pavementRisk }
}

const hourMs = 60 * 60 * 1000
const minuteMs = 60 * 1000
const koreaOffsetMs = 9 * hourMs

const forecastTime = (time) => {
  if (typeof time !== 'string') return NaN
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:00)(?::00)?(?:\+09:00)?$/.exec(time)
  if (!match) return NaN
  const timestamp = Date.parse(`${match[1]}:00+09:00`)
  return Number.isFinite(timestamp) &&
    new Date(timestamp + koreaOffsetMs).toISOString().slice(0, 16) === match[1]
    ? timestamp
    : NaN
}

const clockMinutes = (value) =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
    : NaN

const completeForecast = (weather) =>
  [weather.temp, weather.feelsLike ?? weather.temp].every(Number.isFinite) &&
  Number.isFinite(weather.humidity) &&
  weather.humidity >= 0 &&
  weather.humidity <= 100 &&
  Number.isFinite(weather.wind) &&
  weather.wind >= 0 &&
  Number.isFinite(weather.rainChance) &&
  weather.rainChance >= 0 &&
  weather.rainChance <= 100 &&
  Number.isFinite(weather.precipitation) &&
  weather.precipitation >= 0 &&
  Number.isFinite(weather.uvIndex) &&
  weather.uvIndex >= 0 &&
  Number.isFinite(weather.airQuality?.us_aqi) &&
  weather.airQuality.us_aqi >= 0 &&
  ['Clear', 'Clouds', 'Mist', 'Rain', 'Drizzle', 'Snow', 'Thunderstorm'].includes(weather.condition)

const avoidanceReasons = (weather, profile) => {
  const reasons = []
  const feelsLike = profile?.name
    ? getBreedFeelsLike(weather, profile)
    : (weather.feelsLike ?? weather.temp)
  if (weather.condition === 'Thunderstorm') reasons.push('산책 구간에 뇌우 예보가 있어요.')
  if ([56, 57, 66, 67].includes(weather.weatherCode))
    reasons.push('어는 비로 노면 결빙 위험이 있어요.')
  if (feelsLike >= 30) reasons.push('산책 구간에 높은 체감온도가 예상돼요.')
  if (feelsLike <= -5) reasons.push('산책 구간에 매우 낮은 체감온도가 예상돼요.')
  if (weather.wind >= 12) reasons.push('산책 구간에 강한 바람이 예상돼요.')
  if (weather.precipitation >= 5) reasons.push('산책 구간에 강한 강수가 예상돼요.')
  if (weather.airQuality?.us_aqi >= 151) reasons.push('산책 구간의 대기질이 나빠요.')
  return reasons
}

export const getBestWalkTime = (hourly = [], profile, options = {}) => {
  const {
    now = Date.now(),
    availability = 'all',
    durationMinutes = 30,
    startTime = '07:00',
    endTime = '21:00',
  } = options
  const range = {
    all: [0, 1440],
    morning: [360, 600],
    evening: [1020, 1320],
    custom: [clockMinutes(startTime), clockMinutes(endTime)],
  }[availability]
  const empty = (message) => ({ slots: [], best: null, groups: [], message })
  if (
    !Number.isFinite(now) ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 120 ||
    !Array.isArray(range) ||
    !range.every(Number.isFinite) ||
    range[0] === range[1]
  )
    return empty('산책 가능 시간과 산책 길이(15~120분)를 확인해 주세요.')

  const forecasts = new Map()
  for (const weather of Array.isArray(hourly) ? hourly : []) {
    if (!weather || typeof weather !== 'object') continue
    const timestamp = forecastTime(weather.time)
    if (!Number.isFinite(timestamp)) continue
    forecasts.set(timestamp, forecasts.has(timestamp) ? { ...weather, duplicate: true } : weather)
  }
  const slots = [...forecasts.entries()]
    .sort(([a], [b]) => a - b)
    .filter(([timestamp]) => timestamp >= now && timestamp < now + 24 * hourMs)
    .filter(([timestamp]) => {
      if (availability === 'all') return true
      const start = ((timestamp + koreaOffsetMs) % (24 * hourMs)) / minuteMs
      const [from, to] = range
      return from < to
        ? start >= from && start + durationMinutes <= to
        : start >= from
          ? start + durationMinutes <= to + 1440
          : start < to && start + durationMinutes <= to
    })
    .map(([timestamp, weather]) => {
      const end = timestamp + durationMinutes * minuteMs
      const window = []
      // ponytail: 정시 예보만 있어 양쪽 시간 경계까지 보수적으로 확인한다. 실제 15분 예보가 생기면 간격을 줄인다.
      for (let time = timestamp; time <= Math.ceil(end / hourMs) * hourMs; time += hourMs)
        window.push(forecasts.get(time))
      const complete = window.every((item) => item && !item.duplicate && completeForecast(item))
      const scores = complete
        ? window.map((item) =>
            profile?.name
              ? calculatePersonalizedWalkIndex(item, profile)
              : calculatePetWalkIndex(item),
          )
        : []
      const score = complete ? Math.min(...scores) : null
      const reasons = [
        ...new Set(window.filter(Boolean).flatMap((item) => avoidanceReasons(item, profile))),
      ]
      if (!complete) reasons.push('산책 구간의 날씨·대기질 예보가 부족하거나 중복돼요.')
      if (score !== null && score < 60) reasons.push('산책 구간의 최저 점수가 60점 미만이에요.')
      const peak = (key) => {
        const values = window.map((item) => item?.[key]).filter(Number.isFinite)
        return values.length ? Math.max(...values) : null
      }
      return {
        ...weather,
        time: weather.time,
        endTime: `${new Date(end + koreaOffsetMs).toISOString().slice(0, 16)}+09:00`,
        score,
        eligible: complete && reasons.length === 0,
        blockedReasons: reasons,
        deterioration: complete ? scores[0] - score : 0,
        peakRainChance: peak('rainChance'),
        peakWind: peak('wind'),
        peakUv: peak('uvIndex'),
      }
    })
  const ranked = slots
    .filter(({ eligible }) => eligible)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.deterioration - b.deterioration ||
        forecastTime(a.time) - forecastTime(b.time),
    )
  const best = ranked[0] ?? null
  const groups = []
  for (const slot of slots.filter((item) => item.eligible && best.score - item.score <= 3)) {
    const group = groups.at(-1)
    if (group && forecastTime(slot.time) - forecastTime(group.endTime) === hourMs) {
      group.endTime = slot.time
      group.minScore = Math.min(group.minScore, slot.score)
      group.maxScore = Math.max(group.maxScore, slot.score)
      group.count += 1
    } else
      groups.push({
        startTime: slot.time,
        endTime: slot.time,
        minScore: slot.score,
        maxScore: slot.score,
        count: 1,
      })
  }
  return {
    slots,
    best,
    groups,
    message: best
      ? ''
      : slots.length
        ? '추천 가능한 시간이 없어요. 위험 조건이나 예보 부족을 확인해 주세요.'
        : '앞으로 24시간에 산책을 마칠 수 있는 출발 시간이 없어요. 시간 범위를 바꾸거나 예보를 새로고침해 주세요.',
  }
}

export const getPersonalizedWalkPlan = (
  weather,
  hourly = [],
  profile = {},
  breed = {},
  options = {},
) => {
  const name = profile.name || '반려견'
  const breedName = profile.breedName || '등록한 견종'
  const age = Number(profile.age)
  const group = breed.breedGroup ?? ''
  const groupName =
    {
      Herding: '목양견',
      Sporting: '스포팅견',
      Working: '사역견',
      Terrier: '테리어',
      Hound: '하운드',
      Toy: '토이견',
      'Non-Sporting': '논스포팅견',
    }[group] ?? '반려견'
  const flatFaced = flatFacedBreed.test(breedName)
  const coldClimate = coldClimateBreed.test(breedName)
  const energetic = /Herding|Sporting|Working|Terrier/i.test(group) || activeBreed.test(breedName)
  const score = calculatePersonalizedWalkIndex(weather, profile)
  const best = getBestWalkTime(hourly, profile, options).best

  let minutes = energetic ? 40 : 30
  if (profile.activity === 'high') minutes += 10
  if (profile.activity === 'low') minutes -= 10
  if (age <= 1) minutes = Math.min(minutes, 15)
  if (age >= 8) minutes -= 10
  if (score < 40) minutes = Math.min(minutes, 10)
  else if (score < 60) minutes = Math.min(minutes, 15)
  else if (score < 80) minutes = Math.round(minutes * 0.7)
  if (
    (flatFaced && getBreedFeelsLike(weather, profile) >= 25) ||
    (coldClimate && (weather.feelsLike ?? weather.temp) >= 25)
  ) {
    minutes = Math.min(minutes, 10)
  }
  minutes = Math.max(5, Math.round(minutes / 5) * 5)

  const tips = []
  if (energetic) tips.push('활동성이 높은 견종이라 걷기와 함께 짧은 노즈워크·훈련을 섞어 주세요.')
  if (flatFaced)
    tips.push('단두종은 더위와 습도에 취약할 수 있어 헐떡임이 심해지면 즉시 쉬어 주세요.')
  if (coldClimate) tips.push('추운 기후에 적응한 견종은 더운 날 그늘과 충분한 물이 특히 중요해요.')
  if (age <= 1) tips.push('성장기에는 한 번에 오래 걷기보다 짧은 산책을 여러 번 나누어 주세요.')
  if (age >= 8) tips.push('노령견은 관절 상태를 살피며 평지에서 천천히 걷고 휴식을 자주 주세요.')
  if (score < 60) tips.push('오늘 날씨에는 긴 야외 활동 대신 짧은 배변 산책과 실내 놀이를 권해요.')
  else tips.push(`${name}의 호흡, 걸음 속도와 발바닥 상태를 보며 시간을 조절해 주세요.`)

  return {
    duration: minutes === 5 ? '5분 내외' : `${Math.max(5, minutes - 5)}~${minutes}분`,
    frequency:
      score < 60
        ? '필요할 때 짧게'
        : age <= 1
          ? '짧게 하루 3~4회'
          : energetic
            ? '하루 2~3회'
            : '하루 2회',
    intensity:
      score < 60
        ? '배변 중심 느린 산책'
        : age <= 1 || age >= 8 || flatFaced
          ? '가벼운 냄새 산책'
          : energetic
            ? '빠른 걷기 + 노즈워크'
            : '보통 속도 걷기',
    bestTime: best?.time ?? null,
    bestTimeScore: best?.score ?? 0,
    summary: energetic
      ? `${breedName}은 ${groupName} 그룹의 활동적인 견종이라 날씨가 안전한 시간에 신체 활동과 두뇌 활동을 함께 제공하는 것이 좋아요.`
      : `${breedName}은 ${groupName} 그룹이며, 나이·체중·털 길이·활동량과 현재 날씨를 함께 반영했어요.`,
    tips,
  }
}

export const getPetCareTips = ({ temp, feelsLike = temp, condition, airQuality }) => [
  hasPrecipitation({ condition })
    ? '🐾 산책 후 발과 털을 잘 말려 주세요.'
    : feelsLike >= 28
      ? '🐾 뜨거운 바닥을 손등으로 확인해 주세요.'
      : feelsLike <= 5
        ? '🐾 발 보호와 보온을 준비해 주세요.'
        : '🐾 발바닥 상태를 산책 전후 확인해 주세요.',
  feelsLike >= 25 ? '💧 물과 휴대용 물그릇을 챙겨 주세요.' : '💧 산책 전후 물을 제공해 주세요.',
  !airQuality
    ? '🌿 대기질 정보를 일시적으로 불러오지 못했어요.'
    : airQuality.us_aqi >= 101
      ? '😷 대기질이 나빠 짧은 배변 산책만 권해요.'
      : `🌿 대기질 ${Math.round(airQuality.us_aqi)} · PM2.5 ${Math.round(airQuality.pm2_5)}㎍/㎥`,
]
