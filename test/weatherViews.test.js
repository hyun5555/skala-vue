import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { createRenderer, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

const settle = async () => {
  await Promise.resolve()
  await nextTick()
  await Promise.resolve()
}
const mountView = async (t, name) => {
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: () => null, setItem() {}, removeItem() {} },
  })
  t.after(() => {
    if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor)
    else delete globalThis.localStorage
  })
  const dir = mkdtempSync(join(tmpdir(), 'walkie-view-check-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const file = new URL(
    name === 'WeatherParent'
      ? '../src/components/practices/handson/weather-components/WeatherParent.vue'
      : `../src/views/${name}.vue`,
    import.meta.url,
  )
  const apiPath = join(dir, 'api.mjs')
  writeFileSync(
    apiPath,
    `export const requests = [];
export const getWeatherList = async () => [];
export const searchWeatherLocations = async () => [];
export const getWeatherDetail = (id) => new Promise((resolve,reject) => requests.push({id,resolve,reject}));`,
  )
  const apiUrl = pathToFileURL(apiPath).href
  const { descriptor } = parse(readFileSync(file, 'utf8'))
  let source = compileScript(descriptor, { id: 'view-check' }).content.replaceAll(
    'import.meta.env.DEV',
    'false',
  )
  source = source.replace(/from (['"])([^'"]+)\1/g, (_, quote, specifier) => {
    const url = specifier.endsWith('.vue')
      ? 'data:text/javascript,export default {}'
      : specifier === '@/services/weatherApi.js'
        ? apiUrl
        : specifier.startsWith('@/')
          ? new URL(`../src/${specifier.slice(2)}`, import.meta.url).href
          : import.meta.resolve(specifier)
    return `from ${quote}${url}${quote}`
  })
  const scriptPath = join(dir, 'view.mjs')
  writeFileSync(scriptPath, source)
  const { default: component } = await import(pathToFileURL(scriptPath).href)
  component.render = () => null
  const { requests } = await import(apiUrl)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dog-walk', name: 'dog-walk', component },
      { path: '/weather/:cityId', name: 'weather-detail', component },
      { path: '/other', component: { render: () => null } },
    ],
  })
  const detail = name === 'WeatherDetailView'
  const location = (id) => (detail ? `/weather/${id}` : { name: 'dog-walk', query: { city: id } })
  await router.push(location('city_01'))
  const renderer = createRenderer({
    patchProp() {},
    insert() {},
    remove() {},
    createElement: () => ({}),
    createText: () => ({}),
    createComment: () => ({}),
    setText() {},
    setElementText() {},
    parentNode: () => null,
    nextSibling: () => null,
  })
  const app = renderer.createApp(component)
  app.use(createPinia()).use(router)
  const vm = app.mount({}).$.setupState
  t.after(() => app.unmount())
  await settle()
  return { vm, requests, router, location, app }
}

test('홈 카드·지역 비교는 같은 평가를 쓰며 높은 점수의 위험 도시와 정보 부족을 추천하지 않는다', async (t) => {
  const { vm } = await mountView(t, 'WeatherParent')
  const weather = {
    temp: 18,
    feelsLike: 18,
    humidity: 60,
    wind: 2,
    condition: 'Clear',
    precipitation: 0,
    uvIndex: 2,
    airQuality: { us_aqi: 25 },
  }
  const safe = { ...weather, id: 'city_01', name: '서울', temp: 26, feelsLike: 26 }
  const risk = { ...weather, id: 'city_02', name: '수원', airQuality: { us_aqi: 151 } }
  const missing = { ...weather, id: 'city_03', name: '부산', uvIndex: null }
  vm.weatherList = [risk, missing, safe]
  await settle()
  assert.deepEqual(
    vm.filteredWeatherList.map((city) => city.walkAssessment.score),
    [85, null, 82],
  )
  assert.equal(vm.bestCity.city.id, 'city_01')
  assert.equal(vm.outingIndex, 82)
  assert.equal(vm.dogWalkIndex, 82)
  assert.match(vm.outingGuide, /주의/)
  vm.weatherList = [risk, missing]
  await settle()
  assert.equal(vm.bestCity, null)
  assert.equal(vm.outingIndex, null)
  assert.match(vm.outingGuide, /추천 가능한 지역이 없/)
})

for (const name of ['DogWalkView', 'WeatherDetailView']) {
  test(`${name}: 지난 성공·실패·finally가 최신 지역과 로딩을 덮지 않는다`, async (t) => {
    const { vm, requests, router, location } = await mountView(t, name)
    await router.push(location('city_02'))
    assert.equal(requests.length, 2)
    requests[0].reject(new Error('old request failed'))
    await settle()
    assert.equal(vm.loading, true)
    assert.equal(vm.errorMessage, '')
    requests[1].resolve({ id: 'city_02' })
    await settle()
    assert.equal(vm.city.id, 'city_02')
    assert.equal(vm.loading, false)
    await router.push(location('city_03'))
    await router.push(location('city_04'))
    requests[3].resolve({ id: 'city_04' })
    await settle()
    requests[2].resolve({ id: 'city_03' })
    await settle()
    assert.equal(vm.city.id, 'city_04')
    assert.equal(vm.loading, false)
    assert.equal(
      name === 'DogWalkView'
        ? router.currentRoute.value.query.city
        : router.currentRoute.value.params.cityId,
      'city_04',
    )
    await router.push(location('city_05'))
    await router.push(location('city_06'))
    requests[4].resolve({ id: 'city_05' })
    requests[5].reject(new Error('latest request failed'))
    await settle()
    assert.ok(vm.errorMessage)
    assert.equal(vm.loading, false)
    assert.notEqual(vm.city?.id, 'city_05')
  })
  test(`${name}: 화면 종료 후 응답은 반영하지 않는다`, async (t) => {
    const { vm, requests, app } = await mountView(t, name)
    app.unmount()
    requests[0].resolve({ id: 'city_01' })
    await settle()
    assert.equal(vm.city, null)
  })
}

test('산책 지역을 B에서 A로 즉시 되돌려도 A2 요청만 남고 뒤로 가기도 조회한다', async (t) => {
  const { vm, requests, router, location } = await mountView(t, 'DogWalkView')
  vm.selectCity('city_02')
  vm.selectCity('city_01')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  assert.equal(vm.selectedCityId, 'city_01')
  assert.equal(router.currentRoute.value.query.city, 'city_01')
  assert.equal(requests.length, 2)
  requests[0].resolve({ id: 'outdated-city_01' })
  await settle()
  assert.equal(vm.city, null)
  requests[1].resolve({ id: 'city_01' })
  await settle()
  assert.equal(vm.city.id, 'city_01')
  await router.push(location('city_02'))
  router.back()
  await new Promise((resolve) => setTimeout(resolve, 0))
  await settle()
  assert.equal(vm.selectedCityId, 'city_01')
  assert.equal(requests.at(-1).id, 'city_01')
})
