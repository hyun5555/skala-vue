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
    uvIndex: 0,
    airQuality: { us_aqi: 20 },
  }

  assert.ok(getWalkAnalysis(risky).risks.length >= 4)
  assert.equal(getBestWalkTime([{ ...risky, time: '2026-08-21T15:00' }, safe]).best.time, safe.time)
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
