import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculatePetWalkIndex,
  calculatePersonalizedWalkIndex,
  getBestWalkTime,
  getBreedFeelsLike,
  getDogHeatStatus,
  getPetCareTips,
  getPersonalizedWalkPlan,
  getWalkAnalysis,
} from '../src/services/petWeather.js'

test('강수·폭염·나쁜 대기질은 반려동물 산책 지수를 낮춘다', () => {
  const good = { temp: 20, humidity: 50, wind: 2, condition: 'Clear', airQuality: { us_aqi: 20 } }
  const unsafe = {
    temp: 32,
    feelsLike: 35,
    humidity: 85,
    wind: 8,
    condition: 'Rain',
    airQuality: { us_aqi: 160, pm2_5: 60 },
  }

  assert.equal(calculatePetWalkIndex(good), 100)
  assert.equal(calculatePetWalkIndex(unsafe), 0)
  assert.match(getPetCareTips(unsafe)[2], /대기질/)
})

test('강아지 체감온도는 20도 초과부터 더위 주의 단계를 표시한다', () => {
  assert.equal(getDogHeatStatus(20).level, 'safe')
  assert.equal(getDogHeatStatus(21).level, 'caution')
  assert.equal(getDogHeatStatus(25).level, 'hot')
  assert.equal(getDogHeatStatus(30).level, 'danger')
})

test('견종과 털 길이를 반영한 맞춤 지수는 더위 취약견의 점수를 낮춘다', () => {
  const weather = { temp: 26, feelsLike: 26, humidity: 50, wind: 2, condition: 'Clear' }
  const profile = { name: '몽이', breedName: 'Pug', age: 9, weight: 7, coatLength: 'long' }

  assert.equal(getBreedFeelsLike(weather, profile), 31)
  assert.ok(calculatePersonalizedWalkIndex(weather, profile) < calculatePetWalkIndex(weather))
})

test('위험 근거와 시간대별 최고 산책 시간을 계산한다', () => {
  const risky = {
    temp: 30,
    feelsLike: 32,
    humidity: 85,
    wind: 8,
    condition: 'Clear',
    rainChance: 70,
    uvIndex: 9,
    airQuality: { us_aqi: 120 },
  }
  const safe = {
    ...risky,
    time: '2026-08-21T19:00',
    temp: 20,
    feelsLike: 20,
    humidity: 50,
    wind: 2,
    rainChance: 0,
    precipitation: 0,
    uvIndex: 0,
    airQuality: { us_aqi: 20 },
  }

  assert.ok(getWalkAnalysis(risky).risks.length >= 4)
  assert.equal(
    getBestWalkTime(
      [{ ...risky, time: '2026-08-21T15:00' }, safe, { ...safe, time: '2026-08-21T20:00' }],
      null,
      { now: Date.parse('2026-08-21T14:00+09:00') },
    ).best.time,
    safe.time,
  )
})

test('견종·나이·날씨에 따라 산책 시간과 활동 방식을 조절한다', () => {
  const safe = {
    time: '2026-08-21T19:00',
    temp: 20,
    feelsLike: 20,
    humidity: 50,
    wind: 2,
    condition: 'Clear',
    rainChance: 0,
    uvIndex: 1,
    airQuality: { us_aqi: 20 },
  }
  const dutchShepherd = {
    name: '몽이',
    breedName: 'Dutch Shepherd',
    age: 3,
    weight: 25,
    coatLength: 'medium',
    activity: 'normal',
  }
  const activePlan = getPersonalizedWalkPlan(safe, [safe], dutchShepherd, {
    breedGroup: 'Herding',
  })
  const hotPlan = getPersonalizedWalkPlan(
    { ...safe, temp: 34, feelsLike: 36, humidity: 85, uvIndex: 9 },
    [{ ...safe, temp: 34, feelsLike: 36, humidity: 85, uvIndex: 9 }],
    { ...dutchShepherd, breedName: 'Pug' },
    { breedGroup: 'Toy' },
  )

  assert.equal(activePlan.duration, '35~40분')
  assert.match(activePlan.intensity, /노즈워크/)
  assert.equal(hotPlan.duration, '5~10분')
  assert.match(hotPlan.tips.join(' '), /단두종/)
  assert.ok(hotPlan.bestTimeScore < 60)
})

const hour = 60 * 60 * 1000
const forecast = (time, values = {}) => ({
  time,
  temp: 20,
  feelsLike: 20,
  humidity: 50,
  wind: 2,
  condition: 'Clear',
  rainChance: 0,
  precipitation: 0,
  uvIndex: 1,
  airQuality: { us_aqi: 20 },
  ...values,
})
const nextHours = (start, count, values = {}) =>
  Array.from({ length: count }, (_, index) =>
    forecast(
      new Date(Date.parse(`${start}+09:00`) + index * hour + 9 * hour).toISOString().slice(0, 16),
      values,
    ),
  )

test('지난 시간과 24시간 밖의 출발은 제외하고 내일 예보는 유지한다', () => {
  const hourly = nextHours('2026-10-06T22:00', 28)
  const now = Date.parse('2026-10-06T23:30+09:00')
  const result = getBestWalkTime(hourly, null, { now })
  assert.equal(result.slots[0].time, '2026-10-07T00:00')
  assert.equal(result.slots.at(-1).time, '2026-10-07T23:00')
  assert.equal(result.best.time, '2026-10-07T00:00')
  assert.equal(result.slots.length, 24)
  assert.equal(result.best.endTime, '2026-10-07T00:30+09:00')
})

test('아침·저녁·직접 범위는 산책 종료까지 포함하고 심야 범위를 허용한다', () => {
  const hourly = nextHours('2026-10-06T00:00', 51)
  const options = { now: Date.parse('2026-10-06T00:00+09:00'), durationMinutes: 90 }
  assert.deepEqual(
    getBestWalkTime(hourly, null, { ...options, availability: 'morning' }).slots.map(({ time }) =>
      time.slice(11),
    ),
    ['06:00', '07:00', '08:00'],
  )
  assert.deepEqual(
    getBestWalkTime(hourly, null, { ...options, availability: 'evening' }).slots.map(({ time }) =>
      time.slice(11),
    ),
    ['17:00', '18:00', '19:00', '20:00'],
  )
  const overnight = getBestWalkTime(hourly, null, {
    ...options,
    now: Date.parse('2026-10-06T21:30+09:00'),
    availability: 'custom',
    startTime: '22:00',
    endTime: '02:00',
    durationMinutes: 60,
  })
  assert.deepEqual(
    overnight.slots.map(({ time }) => time),
    ['2026-10-06T22:00', '2026-10-06T23:00', '2026-10-07T00:00', '2026-10-07T01:00'],
  )
  for (const invalid of [
    { startTime: '', endTime: '21:00' },
    { startTime: '07:00', endTime: '07:00' },
    { startTime: '25:00', endTime: '21:00' },
  ])
    assert.equal(
      getBestWalkTime(hourly, null, { ...options, availability: 'custom', ...invalid }).best,
      null,
    )
  for (const durationMinutes of [0, 121, '30', NaN])
    assert.equal(getBestWalkTime(hourly, null, { ...options, durationMinutes }).best, null)
  for (const availability of ['unknown', '__proto__', 'toString'])
    assert.equal(getBestWalkTime(hourly, null, { ...options, availability }).best, null)
})

test('산책 구간 최저점과 악화폭을 평가하고 동점이면 안정적인 구간을 먼저 고른다', () => {
  const hourly = nextHours('2026-10-06T07:00', 4)
  hourly[1].humidity = 85
  hourly[2].humidity = 85
  hourly[3].humidity = 85
  const result = getBestWalkTime(hourly, null, { now: Date.parse('2026-10-06T07:00+09:00') })
  assert.equal(result.slots[0].score, 90)
  assert.equal(result.slots[0].deterioration, 10)
  assert.equal(result.best.time, '2026-10-06T08:00')
  assert.equal(result.best.deterioration, 0)
  assert.equal(
    getBestWalkTime(nextHours('2026-10-06T07:00', 3), null, {
      now: Date.parse('2026-10-06T07:00+09:00'),
    }).best.time,
    '2026-10-06T07:00',
  )
})

test('높은 점수여도 뇌우·강풍·어는 비가 구간에 있으면 BEST에서 제외한다', () => {
  const options = { now: Date.parse('2026-10-06T07:00+09:00') }
  for (const risk of [
    { condition: 'Thunderstorm' },
    { wind: 12 },
    { weatherCode: 66 },
    { precipitation: 5 },
    { feelsLike: 30 },
    { airQuality: { us_aqi: 151 } },
  ]) {
    const result = getBestWalkTime(nextHours('2026-10-06T07:00', 3, risk), null, options)
    assert.equal(result.best, null)
    assert.equal(result.groups.length, 0)
    assert.match(result.message, /추천 가능한 시간이 없/)
    assert.equal(result.slots[0].eligible, false)
    assert.ok(result.slots[0].blockedReasons.length)
  }
  const hourly = nextHours('2026-10-06T07:00', 4)
  hourly[1].condition = 'Thunderstorm'
  const result = getBestWalkTime(hourly, null, { ...options, durationMinutes: 90 })
  assert.equal(result.slots[0].eligible, false)
  assert.match(result.slots[0].blockedReasons.join(' '), /뇌우/)
})

test('최고점과 3점 이내인 연속 출발을 묶되 위험 구간은 건너뛰어 연결하지 않는다', () => {
  const hourly = nextHours('2026-10-06T07:00', 8)
  hourly[3].condition = 'Thunderstorm'
  const result = getBestWalkTime(hourly, null, { now: Date.parse('2026-10-06T07:00+09:00') })
  assert.deepEqual(
    result.groups.map(({ startTime, endTime, count }) => [startTime, endTime, count]),
    [
      ['2026-10-06T07:00', '2026-10-06T08:00', 2],
      ['2026-10-06T11:00', '2026-10-06T13:00', 3],
    ],
  )
})

test('예보 누락·중복·비정상 날짜·빈 숫자를 좋은 날씨로 처리하지 않는다', () => {
  const options = { now: Date.parse('2026-10-06T07:00+09:00') }
  const hourly = nextHours('2026-10-06T07:00', 3)
  for (const invalid of [null, '20', NaN, Infinity]) {
    const result = getBestWalkTime(
      hourly.map((item) => ({ ...item, temp: invalid })),
      null,
      options,
    )
    assert.equal(result.best, null)
    assert.equal(result.slots[0].score, null)
  }
  assert.equal(
    getBestWalkTime(
      hourly.filter((_, index) => index !== 1),
      null,
      options,
    ).best,
    null,
  )
  assert.equal(
    getBestWalkTime(
      [hourly[0], hourly[1], { ...hourly[1], condition: 'Thunderstorm' }],
      null,
      options,
    ).best,
    null,
  )
  assert.equal(
    getBestWalkTime(
      hourly.map((item) => ({ ...item, airQuality: null })),
      null,
      options,
    ).best,
    null,
  )
  for (const time of ['2026-02-30T07:00', '2026-10-06T25:00', '2026-10-06T07:15', 'bad'])
    assert.deepEqual(getBestWalkTime([forecast(time)], null, options).slots, [])
})

test('맞춤 플랜과 차트는 같은 시간 설정으로 같은 추천을 사용한다', () => {
  const hourly = nextHours('2026-10-06T06:00', 20)
  const profile = { name: '몽이', breedName: 'Pug', age: 3, weight: 7, coatLength: 'short' }
  const options = {
    now: Date.parse('2026-10-06T06:30+09:00'),
    availability: 'evening',
    durationMinutes: 60,
  }
  const result = getBestWalkTime(hourly, profile, options)
  const plan = getPersonalizedWalkPlan(hourly[0], hourly, profile, {}, options)
  assert.equal(plan.bestTime, result.best.time)
  assert.equal(plan.bestTimeScore, result.best.score)
  assert.equal(plan.bestTime, '2026-10-06T17:00')
})
