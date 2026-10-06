<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, LocationFilled, Refresh } from '@element-plus/icons-vue'
import { calculatePetWalkIndex, getPetWalkGuide } from '@/services/petWeather.js'
import { getWeatherList, searchWeatherLocations } from '@/services/weatherApi.js'
import { useConfigStore } from '@/stores/configStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'
import SearchBar from './SearchBar.vue'
import WeatheCard from './WeatheCard.vue'

const router = useRouter()
const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()

const weatherList = ref([])
const remoteWeatherList = ref([])
const loading = ref(true)
const searchLoading = ref(false)
const errorMessage = ref('')
const searchErrorMessage = ref('')

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭해 도시를 선택해 보세요.')
const showOutingIndex = ref(false)
const selectedCityId = ref(null)

const calculateOutingIndex = ({ temp, humidity, wind, condition }) => {
  let score = 100
  if (['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condition)) score -= 40
  if (temp < 10 || temp > 28) score -= 20
  if (humidity >= 70) score -= 15
  if (wind >= 6) score -= 15
  return score
}

const getOutingGuide = (score) => {
  if (score >= 80) return '외출하기 매우 좋은 날씨예요!'
  if (score >= 60) return '준비만 잘하면 외출하기 무난해요.'
  return '날씨가 불편할 수 있으니 실내 일정을 추천해요.'
}

const getItemToBring = ({ temp, wind, condition }) => {
  if (['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(condition)) return '☔ 우산'
  if (temp < 10) return '🧥 따뜻한 외투'
  if (temp > 25) return '🧴 선크림과 물'
  if (wind >= 6) return '🧥 바람막이'
  return '👟 편한 신발'
}

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  const localMatches = weatherList.value.filter((city) => !query || city.name.includes(query))
  return (query && !localMatches.length ? remoteWeatherList.value : localMatches)
    .filter(
      (city) => !favoriteStore.showOnlyFavorites || favoriteStore.favoriteCityIds.includes(city.id),
    )
    .map((city) => ({
      ...city,
      displayTemp: configStore.formatTemperature(city.temp),
      displayFeelsLike: configStore.formatTemperature(city.feelsLike),
    }))
})

const selectedCity = computed(() =>
  [...weatherList.value, ...remoteWeatherList.value].find(
    (city) => city.id === selectedCityId.value,
  ),
)

const averageTemperature = computed(() => {
  if (!filteredWeatherList.value.length) return null
  return (
    filteredWeatherList.value.reduce((sum, city) => sum + city.temp, 0) /
    filteredWeatherList.value.length
  )
})

const averageWindSpeed = computed(() => {
  if (!filteredWeatherList.value.length) return null
  return (
    filteredWeatherList.value.reduce((sum, city) => sum + city.wind, 0) /
    filteredWeatherList.value.length
  )
})

const averageHumidity = computed(() => {
  if (!filteredWeatherList.value.length) return null
  return (
    filteredWeatherList.value.reduce((sum, city) => sum + city.humidity, 0) /
    filteredWeatherList.value.length
  )
})

const hasRainOrSnow = computed(() =>
  filteredWeatherList.value.some((city) =>
    ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(city.condition),
  ),
)

const outingIndex = computed(() => {
  if (averageTemperature.value === null) return null
  return calculateOutingIndex({
    temp: averageTemperature.value,
    humidity: averageHumidity.value,
    wind: averageWindSpeed.value,
    condition: hasRainOrSnow.value ? 'Rain' : 'Clear',
  })
})

const outingGuide = computed(() =>
  outingIndex.value === null ? '분석할 도시가 없어요.' : getOutingGuide(outingIndex.value),
)

const itemToBring = computed(() =>
  outingIndex.value === null
    ? '-'
    : getItemToBring({
        temp: averageTemperature.value,
        wind: averageWindSpeed.value,
        condition: hasRainOrSnow.value ? 'Rain' : 'Clear',
      }),
)

const bestCity = computed(() =>
  filteredWeatherList.value.reduce((best, city) => {
    const score = calculateOutingIndex(city)
    return !best || score > best.score ? { city, score } : best
  }, null),
)

const bestDogWalkCity = computed(() =>
  filteredWeatherList.value.reduce((best, city) => {
    const score = calculatePetWalkIndex(city)
    return !best || score > best.score ? { city, score } : best
  }, null),
)

const dogWalkTargetCity = computed(() => selectedCity.value ?? bestDogWalkCity.value?.city ?? null)
const dogWalkWeather = computed(() => dogWalkTargetCity.value)
const dogWalkIndex = computed(() =>
  dogWalkWeather.value ? calculatePetWalkIndex(dogWalkWeather.value) : null,
)

if (import.meta.env.DEV) {
  watch(selectedCityInfo, (message) => console.log('📍 상태바 문구 변경:', message))
  watchEffect(() => console.log('🔍 도시 검색어:', searchQuery.value))
  watch(showOutingIndex, (visible) => console.log('🚶 외출 지수 표시:', visible ? '켜짐' : '꺼짐'))
  watch(outingIndex, (score, oldScore) => console.log('📊 외출 지수 변화:', oldScore, '→', score))
  watch(dogWalkIndex, (score, oldScore) =>
    console.log('🐕 강아지 산책 지수 변화:', oldScore, '→', score),
  )
  watch(
    () => bestCity.value?.city.name,
    (cityName) => console.log('🏆 추천 도시 변경:', cityName ?? '없음'),
  )
}

let searchTimer
let searchSequence = 0
watch(searchQuery, (value) => {
  const query = value.trim()
  const sequence = ++searchSequence
  clearTimeout(searchTimer)
  remoteWeatherList.value = []
  searchErrorMessage.value = ''

  if (!query || weatherList.value.some((city) => city.name.includes(query))) {
    searchLoading.value = false
    return
  }

  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      const results = await searchWeatherLocations(query)
      if (sequence === searchSequence) remoteWeatherList.value = results
    } catch (error) {
      if (sequence === searchSequence) {
        searchErrorMessage.value =
          error.response?.data?.message ?? '지역 검색 결과를 불러오지 못했습니다.'
      }
    } finally {
      if (sequence === searchSequence) searchLoading.value = false
    }
  }, 500)
})
watch(filteredWeatherList, (cities) => {
  if (selectedCityId.value && !cities.some((city) => city.id === selectedCityId.value)) {
    selectedCityId.value = null
    selectedCityInfo.value = '검색 결과에서 추천 도시를 표시합니다.'
  }
})

const selectCity = (city) => {
  selectedCityId.value = city.id
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

const showDetail = (city) => {
  router.push('/weather/' + city.id)
}

const loadWeather = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    weatherList.value = await getWeatherList()
    selectedCityInfo.value = 'OpenWeatherMap의 최신 관측 정보를 불러왔습니다.'
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '날씨 데이터를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

onMounted(loadWeather)
onBeforeUnmount(() => clearTimeout(searchTimer))
</script>

<template>
  <div class="weather-parent">
    <section v-if="dogWalkWeather && dogWalkIndex !== null" class="walk-hero">
      <div class="hero-copy">
        <div class="live-label"><i></i> LIVE WALKING WEATHER · {{ dogWalkWeather.name }}</div>
        <h1>
          오늘의 산책,<br />
          <span>{{
            dogWalkIndex >= 80
              ? '가볍게 출발해요.'
              : dogWalkIndex >= 60
                ? '짧게 다녀와요.'
                : '잠시 쉬어가요.'
          }}</span>
        </h1>
        <p>{{ getPetWalkGuide(dogWalkIndex) }}</p>
        <div class="hero-actions">
          <RouterLink :to="{ name: 'dog-walk', query: { city: dogWalkWeather.id } }">
            <el-button type="primary" size="large" round>
              강아지 맞춤 플랜 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </RouterLink>
          <RouterLink to="/tips">
            <el-button class="nearby-button" size="large" round>
              <el-icon><LocationFilled /></el-icon> 산책 안전 가이드
            </el-button>
          </RouterLink>
        </div>
        <div class="hero-metrics">
          <div>
            <small>현재 기온</small
            ><strong>{{ configStore.formatTemperature(dogWalkWeather.temp) }}</strong>
          </div>
          <div>
            <small>체감 온도</small
            ><strong>{{ configStore.formatTemperature(dogWalkWeather.feelsLike) }}</strong>
          </div>
          <div>
            <small>습도</small><strong>{{ dogWalkWeather.humidity }}%</strong>
          </div>
          <div>
            <small>대기질</small
            ><strong
              >AQI
              {{
                dogWalkWeather.airQuality ? Math.round(dogWalkWeather.airQuality.us_aqi) : '-'
              }}</strong
            >
          </div>
        </div>
      </div>

      <div class="hero-score" aria-label="오늘의 산책 지수">
        <div class="score-top">
          <span>WALK SCORE</span>
          <em>{{ dogWalkIndex >= 80 ? 'GOOD' : dogWalkIndex >= 60 ? 'CAREFUL' : 'REST' }}</em>
        </div>
        <strong>{{ dogWalkIndex }}</strong>
        <small>/ 100</small>
        <el-progress
          :percentage="dogWalkIndex"
          :show-text="false"
          :stroke-width="10"
          :status="dogWalkIndex >= 80 ? 'success' : dogWalkIndex >= 60 ? 'warning' : 'exception'"
        />
        <div class="trail-art" aria-hidden="true">
          <span>🌲</span><span>🐕</span><i></i><span>🌿</span>
        </div>
      </div>
    </section>

    <section class="search-panel">
      <div class="section-heading compact">
        <div>
          <span class="section-number">01</span>
          <div>
            <small>지역 탐색</small>
            <h2>어디로 산책 갈까요?</h2>
          </div>
        </div>
        <span class="data-source">OpenWeatherMap · Open-Meteo</span>
      </div>
      <SearchBar
        :query="searchQuery"
        :show-outing-index="showOutingIndex"
        :favorite-count="favoriteStore.favoriteCount"
        :show-only-favorites="favoriteStore.showOnlyFavorites"
        :loading="searchLoading"
        @update-query="searchQuery = $event"
        @toggle-outing="showOutingIndex = !showOutingIndex"
        @toggle-favorites="favoriteStore.toggleFavoriteFilter"
      />
      <el-alert
        v-if="searchErrorMessage"
        class="search-error"
        :title="searchErrorMessage"
        type="error"
        show-icon
        :closable="false"
      />

      <section
        v-if="showOutingIndex && outingIndex !== null"
        class="outing-panel"
        aria-live="polite"
      >
        <div class="outing-heading">
          <strong>검색 지역 외출 리포트</strong>
          <span>
            평균 {{ configStore.formatTemperature(averageTemperature) }} · 습도
            {{ averageHumidity.toFixed(0) }}% · 풍속 {{ averageWindSpeed.toFixed(1) }}m/s
          </span>
        </div>
        <el-row :gutter="12">
          <el-col :xs="24" :md="8">
            <el-card class="outing-result" shadow="never">
              <el-statistic title="🚶 오늘의 외출 지수" :value="outingIndex" suffix="점" />
              <p>{{ outingGuide }}</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="outing-result" shadow="never">
              <span class="result-label">🎒 추천 준비물</span>
              <strong>{{ itemToBring }}</strong>
              <p>날씨에 맞게 챙겨 보세요.</p>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="8">
            <el-card class="outing-result" shadow="never">
              <span class="result-label">🏆 최고 추천 도시</span>
              <strong>{{ bestCity.city.name }}</strong>
              <p>외출 지수 {{ bestCity.score }}점</p>
            </el-card>
          </el-col>
        </el-row>
      </section>
      <el-empty v-else-if="showOutingIndex" :description="outingGuide" :image-size="72" />
    </section>

    <section class="cities-section">
      <div class="section-heading">
        <div>
          <span class="section-number">02</span>
          <div>
            <small>도시별 컨디션</small>
            <h2>산책할 지역을 골라보세요</h2>
          </div>
        </div>
        <el-button circle :loading="loading" aria-label="날씨 새로고침" @click="loadWeather">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
      <el-alert
        v-if="errorMessage"
        :title="errorMessage"
        type="error"
        show-icon
        :closable="false"
      />
      <el-skeleton v-else-if="loading || searchLoading" :rows="5" animated />
      <div v-else class="weather-grid">
        <WeatheCard
          v-for="city in filteredWeatherList"
          :key="city.id"
          :city="city"
          :selected="selectedCityId === city.id"
          :outing-index="calculateOutingIndex(city)"
          :outing-guide="getOutingGuide(calculateOutingIndex(city))"
          :item-to-bring="getItemToBring(city)"
          :favorite="favoriteStore.favoriteCityIds.includes(city.id)"
          @select-card="selectCity"
          @click-detail="showDetail"
          @toggle-favorite="favoriteStore.toggleFavorite"
        />
        <el-empty
          v-if="filteredWeatherList.length === 0"
          class="weather-empty"
          description="검색 결과와 일치하는 도시가 없습니다."
          :image-size="88"
        />
      </div>
    </section>

    <p class="sync-status" aria-live="polite"><i></i>{{ selectedCityInfo }}</p>
  </div>
</template>

<style scoped>
.weather-parent {
  display: grid;
  gap: 24px;
  width: 100%;
  margin: 0 auto;
  color: var(--app-ink);
}

.walk-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.7fr);
  gap: 48px;
  min-height: 470px;
  padding: 50px;
  overflow: hidden;
  border: 1px solid #dce9e1;
  border-radius: 36px;
  color: var(--app-ink);
  background: #fff;
  box-shadow: 0 22px 60px rgb(22 83 55 / 8%);
}

.walk-hero::after {
  position: absolute;
  right: -5%;
  bottom: -42%;
  width: 58%;
  aspect-ratio: 1;
  background: #edf8f1;
  border-radius: 50%;
  content: '';
}

.hero-copy,
.hero-score {
  position: relative;
  z-index: 1;
}

.live-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #19724e;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.live-label i,
.sync-status i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2a9b6b;
  box-shadow: 0 0 0 5px rgb(42 155 107 / 12%);
}

.walk-hero h1 {
  max-width: 680px;
  margin: 24px 0 14px;
  font-size: clamp(42px, 6vw, 72px);
  line-height: 1.02;
  letter-spacing: -0.065em;
}

.walk-hero h1 span {
  color: #19724e;
}

.hero-copy > p {
  max-width: 560px;
  margin: 0;
  color: var(--app-muted);
  font-size: 16px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  margin-top: 28px;
}

.hero-actions .el-button--primary {
  color: #fff;
  border-color: #19724e;
  background: #19724e;
}

.nearby-button {
  color: #19724e;
  border-color: #bdd7c7;
  background: #f5faf7;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  max-width: 650px;
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid #e2ebe5;
}

.hero-metrics div {
  padding-right: 12px;
  border-right: 1px solid #e2ebe5;
}

.hero-metrics div + div {
  padding-left: 16px;
}

.hero-metrics div:last-child {
  border: 0;
}

.hero-metrics small,
.hero-metrics strong {
  display: block;
}

.hero-metrics small {
  color: var(--app-muted);
  font-size: 10px;
}

.hero-metrics strong {
  margin-top: 5px;
  font-size: 17px;
}

.hero-score {
  align-self: center;
  min-width: 0;
  padding: 28px;
  border: 1px solid #d7e8dd;
  border-radius: 28px;
  background: #f0f8f3;
}

.score-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #71847a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
}

.score-top em {
  padding: 5px 8px;
  border-radius: 999px;
  color: #fff;
  background: #19724e;
  font-size: 9px;
  font-style: normal;
}

.hero-score > strong {
  display: inline-block;
  margin: 24px 3px 12px 0;
  font-size: clamp(70px, 9vw, 112px);
  line-height: 0.8;
  letter-spacing: -0.08em;
  color: #19724e;
}

.hero-score > small {
  color: #71847a;
}

.hero-score :deep(.el-progress-bar__outer) {
  margin-top: 10px;
  background: #dce9e1;
}

.trail-art {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 28px;
  color: #4b8267;
  font-size: 28px;
}

.trail-art i {
  flex: 1;
  height: 18px;
  border-top: 2px dashed #a5c7b4;
  border-radius: 50%;
}

.search-panel,
.cities-section {
  padding: 32px;
  border: 1px solid var(--app-line);
  border-radius: 28px;
  background: #fff;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 22px;
}

.section-heading > div {
  display: flex;
  align-items: center;
  gap: 14px;
}

.section-number {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 50%;
  color: #fff;
  background: #19724e;
  font-size: 12px;
  font-weight: 900;
  place-items: center;
}

.section-heading h2,
.section-heading small {
  display: block;
  margin: 0;
}

.section-heading h2 {
  font-size: clamp(20px, 3vw, 28px);
  letter-spacing: -0.045em;
}

.section-heading small,
.data-source {
  color: #819087;
  font-size: 11px;
}

.data-source {
  padding: 7px 10px;
  border-radius: 999px;
  background: #f3f5f1;
}

.outing-panel {
  padding: 18px;
  margin-top: 18px;
  border-radius: 18px;
  background: #f5f7f2;
}

.search-error {
  margin-top: 14px;
}

.outing-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.outing-heading span,
.outing-result small,
.outing-result p {
  color: var(--app-muted);
  font-size: 13px;
}

.outing-result {
  height: calc(100% - 12px);
  margin-bottom: 12px;
}

.outing-result strong {
  display: block;
}

.outing-result strong {
  margin-top: 4px;
  color: var(--app-ink);
  font-size: 18px;
}

.outing-result p {
  margin: 5px 0 0;
}

.result-label {
  color: var(--app-muted);
  font-size: 13px;
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.weather-empty {
  grid-column: 1 / -1;
}

.sync-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: -6px 0 0;
  color: #718078;
  font-size: 12px;
}

@media (max-width: 980px) {
  .walk-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 44px;
  }

  .hero-score {
    width: min(100%, 420px);
  }

  .weather-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .walk-hero {
    gap: 30px;
    padding: 30px 22px;
    border-radius: 24px;
  }

  .walk-hero h1 {
    margin-top: 18px;
    font-size: 40px;
  }

  .hero-actions {
    display: grid;
  }

  .hero-actions a,
  .hero-actions .el-button {
    width: 100%;
  }

  .hero-metrics {
    grid-template-columns: repeat(2, 1fr);
    row-gap: 18px;
  }

  .hero-metrics div:nth-child(2) {
    border: 0;
  }

  .hero-metrics div:nth-child(3) {
    padding-left: 0;
  }

  .hero-score {
    width: 100%;
  }

  .search-panel,
  .cities-section {
    padding: 20px;
    border-radius: 20px;
  }

  .section-heading,
  .outing-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .data-source {
    display: none;
  }

  .weather-grid {
    grid-template-columns: 1fr;
  }
}
</style>
