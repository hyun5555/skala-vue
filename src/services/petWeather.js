import { validatePetProfile } from './petProfile.js'

const hasPrecipitation = ({ condition }) =>
  ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condition)
const uv = ({ uvIndex, airQuality }) => (uvIndex === undefined ? airQuality?.uv_index : uvIndex)
const flatFacedBreed = /Bulldog|Pug|Boxer|Boston Terrier|Pekingese|Shih Tzu|French Bulldog/i
const coldClimateBreed = /Husky|Malamute|Samoyed|Chow|Newfoundland|Bernese/i
const activeBreed =
  /Shepherd|Collie|Retriever|Spaniel|Pointer|Setter|Terrier|Husky|Malamute|Dalmatian|Weimaraner|Vizsla/i
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const rounded = (value) => Math.round(value * 10) / 10
export const formatWeatherMetric = (value, unit = '') =>
  Number.isFinite(value) && value >= 0 ? `${rounded(value)}${unit}` : '정보 부족'
const temperature = (weather) =>
  weather.feelsLike === undefined ? weather.temp : weather.feelsLike
// ponytail: 초기 서비스 비교 기준이다. 실제 예보와 사용자 반응으로 보정하고 임상 안전 기준으로 표시하지 않는다.
const curves = {
  temperature: [
    [-5, 35],
    [0, 25],
    [5, 15],
    [10, 5],
    [15, 0],
    [20, 0],
    [23, 6],
    [26, 18],
    [28, 27],
    [30, 35],
  ],
  probability: [
    [0, 0],
    [20, 2],
    [40, 6],
    [60, 12],
    [80, 18],
    [100, 25],
  ],
  precipitation: [
    [0, 0],
    [0.1, 3],
    [0.5, 8],
    [1, 12],
    [2.5, 20],
    [5, 25],
  ],
  airQuality: [
    [0, 0],
    [25, 0],
    [50, 2],
    [75, 5],
    [100, 9],
    [125, 12],
    [150, 15],
  ],
  wind: [
    [0, 0],
    [2, 0],
    [4, 2],
    [7, 6],
    [10, 9],
    [12, 10],
  ],
  ultraviolet: [
    [0, 0],
    [2, 0],
    [3, 1],
    [5, 3],
    [6, 4],
    [8, 7],
    [11, 10],
  ],
  humidity: [
    [0, 0],
    [60, 0],
    [70, 1],
    [80, 3],
    [100, 5],
  ],
}
const penalty = (value, points) => {
  if (value <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [x1, p1] = points[i],
      [x0, p0] = points[i - 1]
    if (value <= x1) return p0 + ((p1 - p0) * (value - x0)) / (x1 - x0)
  }
  return points.at(-1)[1]
}

export const getBreedFeelsLike = (weather, profile) => {
  const base = temperature(weather)
  const valid = validatePetProfile(profile)
  if (!Number.isFinite(base) || !valid) return base
  const heat =
    (flatFacedBreed.test(valid.breedName) || coldClimateBreed.test(valid.breedName) ? 3 : 0) +
    (valid.coatLength === 'long' ? 2 : 0)
  const cold = (valid.weight <= 7 ? 2 : 0) + (valid.coatLength === 'short' ? 1 : 0)
  return base + heat * clamp((base - 15) / 10, 0, 1) - cold * clamp((15 - base) / 10, 0, 1)
}

export const evaluateWalkWeather = (weather = {}, profile = null, options = {}) => {
  weather ??= {}
  const source = options.source ?? (weather.time ? 'forecast' : 'observation')
  const validProfile =
    profile === null || profile === undefined ? null : validatePetProfile(profile)
  const feelsLike = getBreedFeelsLike(weather, validProfile)
  const currentUv = uv(weather)
  const aqi = weather.airQuality?.us_aqi
  const values = {
    temp: weather.temp,
    feelsLike,
    humidity: weather.humidity,
    wind: weather.wind,
    precipitation: weather.precipitation,
    uvIndex: currentUv,
    aqi,
  }
  const missingFields = Object.entries(values)
    .filter(
      ([key, value]) =>
        !Number.isFinite(value) ||
        (['wind', 'precipitation', 'uvIndex', 'aqi', 'humidity'].includes(key) && value < 0) ||
        (key === 'humidity' && value > 100),
    )
    .map(([key]) => key)
  if (
    source === 'forecast' &&
    (!Number.isFinite(weather.rainChance) || weather.rainChance < 0 || weather.rainChance > 100)
  )
    missingFields.push('rainChance')
  if (!['forecast', 'observation'].includes(source)) missingFields.push('source')
  if (profile !== null && profile !== undefined && !validProfile) missingFields.push('profile')
  if (
    ![
      'Clear',
      'Clouds',
      'Mist',
      'Fog',
      'Haze',
      'Smoke',
      'Dust',
      'Sand',
      'Ash',
      'Rain',
      'Drizzle',
      'Snow',
      'Thunderstorm',
      'Squall',
      'Tornado',
    ].includes(weather.condition)
  )
    missingFields.push('condition')
  const blockedReasons = []
  if (['Thunderstorm', 'Squall', 'Tornado'].includes(weather.condition))
    blockedReasons.push('뇌우 또는 폭풍 조건이 있어요.')
  if (
    (source === 'forecast' && [56, 57, 66, 67].includes(weather.weatherCode)) ||
    (source === 'observation' && weather.weatherCode === 511)
  )
    blockedReasons.push('어는 비로 노면 결빙 위험이 있어요.')
  if (Number.isFinite(feelsLike) && feelsLike >= 30)
    blockedReasons.push('높은 체감온도로 산책을 피하는 편이 좋아요.')
  if (Number.isFinite(feelsLike) && feelsLike <= -5)
    blockedReasons.push('매우 낮은 체감온도로 산책을 피하는 편이 좋아요.')
  if (Number.isFinite(weather.wind) && weather.wind >= 12)
    blockedReasons.push('강한 바람이 예상돼요.')
  if (Number.isFinite(weather.precipitation) && weather.precipitation >= 5)
    blockedReasons.push('강한 강수가 예상돼요.')
  if (Number.isFinite(aqi) && aqi >= 151)
    blockedReasons.push('대기질이 나빠 산책을 피하는 편이 좋아요.')
  if (missingFields.length)
    blockedReasons.push(
      missingFields.includes('profile')
        ? '저장한 반려견 프로필을 확인해 주세요.'
        : '날씨·대기질 정보가 부족하거나 잘못됐어요.',
    )
  const cautionFlags = []
  const flag = (condition, code, icon, label, detail) => {
    if (condition) cautionFlags.push({ code, icon, label, detail })
  }
  flag(
    Number.isFinite(feelsLike) && feelsLike > 20,
    'heat',
    '🌡️',
    '더위',
    `체감 ${rounded(feelsLike)}℃`,
  )
  flag(
    Number.isFinite(feelsLike) && feelsLike < 5,
    'cold',
    '❄️',
    '추위',
    `체감 ${rounded(feelsLike)}℃`,
  )
  flag(
    Number.isFinite(weather.humidity) && weather.humidity >= 80,
    'humidity',
    '💧',
    '높은 습도',
    `${weather.humidity}%`,
  )
  const rainChance = source === 'forecast' ? weather.rainChance : null
  flag(
    hasPrecipitation(weather) || weather.precipitation > 0 || rainChance >= 40,
    'rain',
    '🌧️',
    '강수',
    Number.isFinite(rainChance) ? `강수확률 ${rainChance}%` : '강수 상태·최근 강수량 확인',
  )
  flag(
    Number.isFinite(weather.wind) && weather.wind >= 7,
    'wind',
    '💨',
    '강풍',
    `${weather.wind}m/s`,
  )
  flag(Number.isFinite(currentUv) && currentUv >= 6, 'uv', '☀️', '자외선', `UV ${currentUv}`)
  flag(Number.isFinite(aqi) && aqi >= 101, 'aqi', '😷', '대기질', `AQI ${aqi}`)
  const result = {
    score: null,
    unroundedScore: null,
    deductions: [],
    blockedReasons,
    missingFields,
    eligible: false,
    cautionFlags,
    feelsLike,
    rainChance,
    condition: weather.condition,
  }
  if (missingFields.length) return result
  const temperatureFactor = validProfile
    ? 1 +
      (validProfile.age <= 1 || validProfile.age >= 8 ? 0.15 : 0) +
      (validProfile.activity === 'high' && feelsLike > 20 ? 0.1 : 0)
    : 1
  const rainFloor = { Drizzle: 8, Rain: 15, Snow: 15, Thunderstorm: 25 }[weather.condition] ?? 0
  const rainPenalty = Math.max(
    source === 'forecast' ? penalty(rainChance, curves.probability) : 0,
    penalty(weather.precipitation, curves.precipitation),
    rainFloor,
  )
  const deduction = (code, label, points, value, unit, detail) => ({
    code,
    label,
    points,
    value,
    unit,
    detail,
  })
  const deductions = [
    deduction(
      'temperature',
      '체감온도',
      Math.min(35, penalty(feelsLike, curves.temperature) * temperatureFactor),
      feelsLike,
      '℃',
      `${rounded(feelsLike)}℃${validProfile ? ' · 프로필 보정 포함' : ''}`,
    ),
    deduction(
      'rain',
      '강수',
      rainPenalty,
      weather.precipitation,
      'mm',
      `${Number.isFinite(rainChance) ? `확률 ${rainChance}% · ` : '확률 미제공 · '}${weather.precipitation}mm · ${hasPrecipitation(weather) ? '비·눈 상태' : '비·눈 상태 없음'}`,
    ),
    deduction('airQuality', '대기질', penalty(aqi, curves.airQuality), aqi, 'AQI', `US AQI ${aqi}`),
    deduction(
      'wind',
      '바람',
      penalty(weather.wind, curves.wind),
      weather.wind,
      'm/s',
      `${weather.wind}m/s`,
    ),
    deduction(
      'ultraviolet',
      '자외선',
      penalty(currentUv, curves.ultraviolet),
      currentUv,
      'UV',
      `UV ${currentUv}`,
    ),
    deduction(
      'humidity',
      '습도',
      penalty(weather.humidity, curves.humidity),
      weather.humidity,
      '%',
      `${weather.humidity}%`,
    ),
  ]
  const unroundedScore = clamp(
    100 - deductions.reduce((total, item) => total + item.points, 0),
    0,
    100,
  )
  if (unroundedScore < 60) blockedReasons.push('산책 점수가 60점 미만이에요.')
  return {
    ...result,
    score: Math.round(unroundedScore),
    unroundedScore,
    deductions,
    eligible: blockedReasons.length === 0,
  }
}

export const calculatePetWalkIndex = (weather) => evaluateWalkWeather(weather).score
export const calculatePersonalizedWalkIndex = (weather, profile) =>
  evaluateWalkWeather(weather, profile).score
export const getPetWalkGuide = (value) => {
  const assessment = value && typeof value === 'object' ? value : null
  const score = assessment ? assessment.score : value
  if (!Number.isFinite(score)) return '날씨·대기질 정보가 부족해 산책 지수를 확인할 수 없어요.'
  if (score < 60 || (assessment && !assessment.eligible))
    return '회피 조건이나 낮은 점수로 야외 산책을 권하기 어려워요.'
  if (score < 80 || assessment?.cautionFlags.length)
    return '주의 조건을 확인하고 짧게 걷거나 시간을 조절해 주세요.'
  return '반려동물과 산책하기 좋은 날씨예요!'
}
export const getDogHeatStatus = (feelsLike) => {
  if (!Number.isFinite(feelsLike))
    return { level: 'unknown', label: '정보 부족', guide: '체감온도를 확인할 수 없어요.' }
  if (feelsLike >= 30)
    return { level: 'danger', label: '매우 더움', guide: '한낮 산책을 피하고 실내 활동을 권해요.' }
  if (feelsLike >= 25)
    return { level: 'hot', label: '더움', guide: '이른 아침에 짧게 걷고 물을 챙겨 주세요.' }
  if (feelsLike > 20)
    return { level: 'caution', label: '더위 주의', guide: '격한 운동을 줄이고 상태를 살펴 주세요.' }
  if (feelsLike <= -5) return { level: 'danger', label: '매우 추움', guide: '실내 활동을 권해요.' }
  if (feelsLike < 5)
    return { level: 'caution', label: '추위 주의', guide: '보온과 발 상태를 확인해 주세요.' }
  return { level: 'safe', label: '대체로 쾌적', guide: '개별 건강 상태를 확인하며 산책하세요.' }
}
export const getWalkAnalysis = (
  weather,
  profile = null,
  assessment = evaluateWalkWeather(weather, profile),
) => {
  const reasons = assessment.deductions
    .filter((item) => item.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((item) => `${item.label} ${rounded(item.points)}점 감점 · ${item.detail}`)
  reasons.push(...assessment.blockedReasons)
  if (!reasons.length) reasons.push('확인한 날씨 항목에서 감점 요인이 없어요.')
  const feelsLike = assessment.feelsLike
  const currentUv = uv(weather)
  const pavementRisk =
    !Number.isFinite(weather.temp) || !Number.isFinite(feelsLike) || !Number.isFinite(currentUv)
      ? { level: '정보 부족', detail: '노면 위험을 판단할 날씨 정보가 부족해요.' }
      : hasPrecipitation(weather) || feelsLike < 0
        ? { level: '주의', detail: '젖거나 언 노면을 조심하세요.' }
        : weather.temp >= 28 && currentUv >= 6
          ? { level: '높음', detail: '노면 고온 위험이 높게 추정돼요.' }
          : weather.temp >= 24 && currentUv >= 4
            ? { level: '보통', detail: '노면 온도를 손등으로 확인하세요.' }
            : { level: '낮음', detail: '현재 노면 고온 위험은 낮게 추정돼요.' }
  return { reasons, risks: assessment.cautionFlags, pavementRisk }
}

const hourMs = 60 * 60 * 1000
const minuteMs = 60 * 1000
const koreaOffsetMs = 9 * hourMs
const localTime = (timestamp) =>
  `${new Date(timestamp + koreaOffsetMs).toISOString().slice(0, 16)}+09:00`
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
const precipitationType = (condition) =>
  ['Rain', 'Drizzle'].includes(condition)
    ? 'rain'
    : condition === 'Snow'
      ? 'snow'
      : hasPrecipitation({ condition })
        ? 'storm'
        : 'dry'
const similarSlots = (members) => {
  const first = members[0]
  if (
    !members.every(
      (item) =>
        item.conditionGroups === first.conditionGroups && item.cautionCodes === first.cautionCodes,
    )
  )
    return false
  return [
    ['minFeelsLike', 2],
    ['maxFeelsLike', 2],
    ['peakRainChance', 15],
    ['peakWind', 2],
    ['peakUv', 2],
    ['peakAqi', 25],
  ].every(
    ([key, limit]) =>
      Math.max(...members.map((item) => item[key])) -
        Math.min(...members.map((item) => item[key])) <=
      limit,
  )
}

export const getBestWalkTime = (hourly = [], profile = null, options = {}) => {
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
      const evaluations = []
      // ponytail: 시간별 자료만 있어 부분 산책도 겹치는 1시간 블록 전체를 보수적으로 확인한다.
      for (let time = timestamp; time < end; time += hourMs) {
        const rain = forecasts.get(time + hourMs)
        for (const instant of [time, time + hourMs]) {
          const row = forecasts.get(instant)
          const assessment = evaluateWalkWeather(
            { ...row, rainChance: rain?.rainChance, precipitation: rain?.precipitation },
            profile,
            { source: 'forecast' },
          )
          if (row?.duplicate || rain?.duplicate) {
            assessment.score = null
            assessment.unroundedScore = null
            assessment.deductions = []
            assessment.eligible = false
            assessment.missingFields.push('duplicate')
            assessment.blockedReasons.push('같은 시각의 예보가 중복돼요.')
          }
          evaluations.push({
            ...assessment,
            evaluatedAt: localTime(instant),
            rainInterval: { startTime: localTime(time), endTime: localTime(time + hourMs) },
          })
        }
      }
      const complete = evaluations.every((item) => item.score !== null)
      const worst = complete
        ? evaluations.reduce((a, b) => (b.unroundedScore < a.unroundedScore ? b : a))
        : null
      const peak = (getter) => {
        const values = evaluations.map(getter).filter(Number.isFinite)
        return values.length ? Math.max(...values) : null
      }
      const corrected = evaluations.map((item) => item.feelsLike).filter(Number.isFinite)
      const cautionFlags = [
        ...new Map(
          evaluations.flatMap((item) => item.cautionFlags).map((flag) => [flag.code, flag]),
        ).values(),
      ]
      return {
        ...weather,
        time: weather.time,
        endTime: localTime(end),
        score: worst?.score ?? null,
        unroundedScore: worst?.unroundedScore ?? null,
        eligible: complete && evaluations.every((item) => item.eligible),
        blockedReasons: [...new Set(evaluations.flatMap((item) => item.blockedReasons))],
        evaluation: worst,
        deductions: worst?.deductions ?? [],
        evaluatedAt: worst?.evaluatedAt ?? null,
        rainInterval: worst?.rainInterval ?? null,
        deterioration: complete
          ? rounded(Math.max(0, evaluations[0].unroundedScore - worst.unroundedScore))
          : null,
        departureScore: complete ? evaluations[0].score : null,
        cautionFlags,
        minFeelsLike: corrected.length ? Math.min(...corrected) : null,
        maxFeelsLike: corrected.length ? Math.max(...corrected) : null,
        peakRainChance: peak((item) => item.rainChance),
        peakWind: peak((item) => item.deductions.find((d) => d.code === 'wind')?.value),
        peakUv: peak((item) => item.deductions.find((d) => d.code === 'ultraviolet')?.value),
        peakAqi: peak((item) => item.deductions.find((d) => d.code === 'airQuality')?.value),
        conditionGroups: [...new Set(evaluations.map((item) => precipitationType(item.condition)))]
          .sort()
          .join(','),
        cautionCodes: cautionFlags
          .map((item) => item.code)
          .sort()
          .join(','),
      }
    })
  const ranked = slots
    .filter((item) => item.eligible)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.deterioration - b.deterioration ||
        forecastTime(a.time) - forecastTime(b.time),
    )
  const best = ranked[0] ?? null
  const grouped = []
  for (const slot of slots.filter((item) => item.eligible && best.score - item.score <= 3)) {
    const group = grouped.at(-1)
    if (
      group &&
      forecastTime(slot.time) - forecastTime(group.at(-1).time) === hourMs &&
      similarSlots([...group, slot])
    )
      group.push(slot)
    else grouped.push([slot])
  }
  const groups = grouped.map((members) => ({
    startTime: members[0].time,
    endTime: members.at(-1).time,
    minScore: Math.min(...members.map((item) => item.score)),
    maxScore: Math.max(...members.map((item) => item.score)),
    count: members.length,
  }))
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
  const assessment = evaluateWalkWeather(weather, profile)
  const score = assessment.score
  const limited = !assessment.eligible
  const best = getBestWalkTime(hourly, profile, options).best

  let minutes = energetic ? 40 : 30
  if (profile.activity === 'high') minutes += 10
  if (profile.activity === 'low') minutes -= 10
  if (age <= 1) minutes = Math.min(minutes, 15)
  if (age >= 8) minutes -= 10
  if (limited || score < 40) minutes = Math.min(minutes, 10)
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
  if (limited) tips.push(getPetWalkGuide(assessment))
  else tips.push(`${name}의 호흡, 걸음 속도와 발바닥 상태를 보며 시간을 조절해 주세요.`)

  return {
    duration: minutes === 5 ? '5분 내외' : `${Math.max(5, minutes - 5)}~${minutes}분`,
    frequency: limited
      ? '필요할 때 짧게'
      : age <= 1
        ? '짧게 하루 3~4회'
        : energetic
          ? '하루 2~3회'
          : '하루 2회',
    intensity: limited
      ? '실내 활동 중심'
      : age <= 1 || age >= 8 || flatFaced
        ? '가벼운 냄새 산책'
        : energetic
          ? '빠른 걷기 + 노즈워크'
          : '보통 속도 걷기',
    bestTime: best?.time ?? null,
    bestTimeScore: best?.score ?? null,
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
  !Number.isFinite(airQuality?.us_aqi) || airQuality.us_aqi < 0
    ? '🌿 대기질 정보를 일시적으로 불러오지 못했어요.'
    : airQuality.us_aqi >= 101
      ? '😷 대기질이 나빠 짧은 배변 산책만 권해요.'
      : `🌿 대기질 ${formatWeatherMetric(airQuality.us_aqi)} · PM2.5 ${formatWeatherMetric(airQuality.pm2_5, '㎍/㎥')}`,
]
