import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { handleRequest } from '../server.js'
import { createLocationId, getKakaoPlaceUrl } from '../server-utils.js'

const testEnv = {
  OPENWEATHER_API_KEY: 'test-only-weather',
  KAKAO_REST_API_KEY: 'test-only-kakao',
}
const request = (path, method = 'GET') => new Request(`https://example.test${path}`, { method })
const configuredHeaders = JSON.parse(
  readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'),
).headers[0].headers

test('입력 거절과 없는 API 오류도 배포 설정과 동일한 보안 헤더를 반환한다', async () => {
  for (const response of [
    await handleRequest(request('/api/not-found'), testEnv),
    await handleRequest(request('/api/weather', 'POST'), testEnv),
    await handleRequest(request('/api/places'), testEnv),
  ]) {
    for (const { key, value } of configuredHeaders) assert.equal(response.headers.get(key), value)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
  }
})

const preventExternalRequests = (t) =>
  t.mock.method(globalThis, 'fetch', () => {
    assert.fail('Rejected input must not trigger an external request')
  })

test('읽기 전용 API는 GET 이외의 메서드를 외부 호출 없이 거절한다', async (t) => {
  const fetch = preventExternalRequests(t)
  for (const method of ['POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS']) {
    const response = await handleRequest(request('/api/weather', method), testEnv)
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('Allow'), 'GET')
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('과도하게 긴 요청 주소를 외부 호출 없이 거절한다', async (t) => {
  const fetch = preventExternalRequests(t)
  const response = await handleRequest(
    request(`/api/weather/search?q=${'a'.repeat(2100)}`),
    testEnv,
  )
  assert.equal(response.status, 414)
  assert.equal(fetch.mock.callCount(), 0)
})

test('누락·공백·비정상·국외 좌표는 장소 API로 전달하지 않는다', async (t) => {
  const fetch = preventExternalRequests(t)
  for (const query of [
    '',
    'lat=37.5',
    'lat=&lon=127',
    'lat=%20&lon=127',
    'lat=NaN&lon=127',
    'lat=Infinity&lon=127',
    'lat=37.5&lon=181',
    'lat=51.5&lon=-0.1',
  ]) {
    const response = await handleRequest(request(`/api/places?${query}`), testEnv)
    assert.equal(response.status, 400)
  }
  assert.equal(fetch.mock.callCount(), 0)
})

test('빈 검색어·긴 검색어·제어문자·변조된 도시 ID를 거절한다', async (t) => {
  const fetch = preventExternalRequests(t)
  for (const query of ['', '가'.repeat(41), '서\n울', '서울\u0000구']) {
    const response = await handleRequest(
      request(`/api/weather/search?q=${encodeURIComponent(query)}`),
      testEnv,
    )
    assert.equal(response.status, 400)
  }
  const id = createLocationId({ name: '서울', lat: 51.5, lon: -0.1 })
  assert.equal((await handleRequest(request(`/api/weather/${id}`), testEnv)).status, 404)
  assert.equal(fetch.mock.callCount(), 0)
})

test('정상 장소 조회는 서버에서 인증하고 안전한 HTTPS 링크만 반환한다', async (t) => {
  const fetch = t.mock.method(globalThis, 'fetch', async (outbound) => {
    const url = new URL(outbound.url)
    assert.equal(url.origin, 'https://dapi.kakao.com')
    assert.equal(url.searchParams.get('x'), '127')
    assert.equal(url.searchParams.get('y'), '37.5')
    assert.equal(outbound.headers.get('Authorization'), 'KakaoAK test-only-kakao')
    return Response.json({
      documents: [
        { id: '123', place_name: '테스트 카페', distance: '100', place_url: 'javascript:alert(1)' },
      ],
    })
  })
  const response = await handleRequest(request('/api/places?lat=37.5&lon=127'), testEnv)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff')
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer')
  const data = await response.json()
  assert.equal(data.length, 1)
  assert.equal(data[0].place_url, 'https://place.map.kakao.com/123')
  assert.equal(JSON.stringify(data).includes(testEnv.KAKAO_REST_API_KEY), false)
  assert.equal(fetch.mock.callCount(), 3)
})

test('외부 오류 응답과 예외의 민감한 내용은 응답과 로그에 남기지 않는다', async (t) => {
  const sensitiveText = 'test-only-secret; Authorization=private; lat=37.5&lon=127'
  const logs = []
  t.mock.method(console, 'error', (...args) => logs.push(args))
  const fetch = t.mock.method(globalThis, 'fetch', async () =>
    Response.json({ message: sensitiveText }, { status: 401 }),
  )
  const response = await handleRequest(request('/api/places?lat=37.5&lon=127'), testEnv)
  assert.equal(response.status, 502)
  assert.equal((await response.text()).includes(sensitiveText), false)
  assert.deepEqual(logs, [['External API request failed:', { service: 'places', status: 401 }]])

  fetch.mock.mockImplementation(async () => {
    throw new Error(sensitiveText)
  })
  logs.length = 0
  const unavailable = await handleRequest(request('/api/places?lat=37.5&lon=127'), testEnv)
  assert.equal(unavailable.status, 503)
  assert.equal((await unavailable.text()).includes(sensitiveText), false)
  assert.deepEqual(logs, [['External API request failed:', { service: 'places', status: null }]])
})

test('장소 링크는 숫자 ID만 허용한다', () => {
  assert.equal(getKakaoPlaceUrl('123'), 'https://place.map.kakao.com/123')
  for (const id of [
    null,
    '',
    'javascript:alert(1)',
    '../other',
    '123?redirect=https://example.test',
  ]) {
    assert.equal(getKakaoPlaceUrl(id), '')
  }
})

test('시간별 날씨는 KST·종료 여유 예보를 요청하고 같은 시각의 대기질만 연결한다', async (t) => {
  const times = ['2026-10-06T00:00', '2026-10-06T01:00', '2026-10-06T02:00', '2026-10-06T03:00']
  const fetch = t.mock.method(globalThis, 'fetch', async (outbound) => {
    const url = new URL(outbound.url)
    if (url.hostname === 'api.openweathermap.org') {
      if (url.pathname.endsWith('/forecast')) return Response.json({ list: [] })
      return Response.json({
        main: { temp: null, feels_like: null, humidity: 50 },
        weather: [{ main: 'Clear', description: '맑음', icon: '01d' }],
        wind: { speed: 2 },
        dt: 1791212400,
      })
    }
    assert.equal(url.searchParams.get('timezone'), 'Asia/Seoul')
    assert.equal(url.searchParams.get('forecast_hours'), '27')
    if (url.hostname === 'air-quality-api.open-meteo.com') {
      assert.equal(url.searchParams.get('hourly'), 'us_aqi,pm2_5')
      return Response.json({
        current: { us_aqi: 10, pm2_5: 4 },
        hourly: {
          time: [times[2], times[0], times[1], times[1]],
          us_aqi: [140, 20, 151, 20],
          pm2_5: [40, 4, 50, 4],
        },
      })
    }
    assert.equal(url.hostname, 'api.open-meteo.com')
    return Response.json({
      hourly: {
        time: times,
        temperature_2m: [20, 20, 20, 20],
        apparent_temperature: [20, 20, 20, 20],
        relative_humidity_2m: [50, 50, 50, 50],
        precipitation_probability: [0, 0, 0, 0],
        precipitation: [0, 0, 0, 0],
        weather_code: [80, 85, 95, null],
        wind_speed_10m: [7.2, null, 7.2, 7.2],
        uv_index: [1, 1, 1, 1],
      },
    })
  })
  const response = await handleRequest(request('/api/weather/city_01'), testEnv)
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.deepEqual(
    data.hourly.map(({ condition }) => condition),
    ['Rain', 'Snow', 'Thunderstorm', 'Unknown'],
  )
  assert.deepEqual(
    data.hourly.map(({ weatherCode }) => weatherCode),
    [80, 85, 95, null],
  )
  assert.deepEqual(
    data.hourly.map(({ wind }) => wind),
    [2, null, 2, 2],
  )
  assert.equal(data.airQuality.us_aqi, 10)
  assert.equal(data.temp, null)
  assert.equal(data.feelsLike, null)
  assert.equal(data.rainChance, null)
  assert.deepEqual(
    data.hourly.map(({ airQuality }) => airQuality?.us_aqi ?? null),
    [20, null, 140, null],
  )
  assert.equal(fetch.mock.callCount(), 4)
})
