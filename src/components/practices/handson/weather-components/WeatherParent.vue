<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from './BaseDashboardCard.vue'
import DogWalkGuide from './DogWalkGuide.vue'
import SearchBar from './SearchBar.vue'
import WeatheCard from './WeatheCard.vue'

const router = useRouter()

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', emoji: '☀️', humidity: 48, wind: 2.1 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', emoji: '🌧️', humidity: 85, wind: 3.4 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', emoji: '☁️', humidity: 63, wind: 4.2 },
  { id: 'city_04', name: '제주', temp: 23, status: '바람', emoji: '🌬️', humidity: 72, wind: 6.8 },
  { id: 'city_05', name: '대전', temp: 9, status: '눈', emoji: '🌨️', humidity: 76, wind: 1.8 },
  { id: 'city_06', name: '광주', temp: 27, status: '흐림', emoji: '🌥️', humidity: 58, wind: 2.7 },
])

const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭해 도시를 선택해 보세요.')
const showOutingIndex = ref(false)
const selectedCityId = ref(null)
const walkTimeSlot = ref('morning')

const calculateOutingIndex = ({ temp, humidity, wind, status }) => {
  let score = 100
  if (status === '비' || status === '눈') score -= 40
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

const getItemToBring = ({ temp, wind, status }) => {
  if (status === '비' || status === '눈') return '☔ 우산'
  if (temp < 10) return '🧥 따뜻한 외투'
  if (temp > 25) return '🧴 선크림과 물'
  if (wind >= 6) return '🧥 바람막이'
  return '👟 편한 신발'
}

const calculateDogWalkIndex = ({ temp, humidity, wind, status }) => {
  let score = 100
  if (status === '비' || status === '눈') score -= 50
  if (temp < 5 || temp > 28) score -= 35
  else if (temp < 10 || temp > 25) score -= 20
  if (humidity >= 80) score -= 15
  if (wind >= 6) score -= 15
  return Math.max(0, score)
}

const getDogWalkGuide = (score) => {
  if (score >= 80) return '강아지와 산책하기 좋은 날씨예요!'
  if (score >= 60) return '짧게 산책하고 물을 챙겨 주세요.'
  return '오늘은 집에서 노즈워크나 실내 놀이를 추천해요.'
}

const filteredWeatherList = computed(() => {
  const query = searchQuery.value.trim()
  return query ? weatherList.value.filter((city) => city.name.includes(query)) : weatherList.value
})

const selectedCity = computed(() =>
  weatherList.value.find((city) => city.id === selectedCityId.value),
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
  filteredWeatherList.value.some((city) => city.status === '비' || city.status === '눈'),
)

const outingIndex = computed(() => {
  if (averageTemperature.value === null) return null
  return calculateOutingIndex({
    temp: averageTemperature.value,
    humidity: averageHumidity.value,
    wind: averageWindSpeed.value,
    status: hasRainOrSnow.value ? '비' : '맑음',
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
        status: hasRainOrSnow.value ? '비' : '맑음',
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
    const score = calculateDogWalkIndex(city)
    return !best || score > best.score ? { city, score } : best
  }, null),
)

const dogWalkTargetCity = computed(() => selectedCity.value ?? bestDogWalkCity.value?.city ?? null)
const dogWalkIndex = computed(() =>
  dogWalkTargetCity.value ? calculateDogWalkIndex(dogWalkTargetCity.value) : null,
)
const dogWalkGuide = computed(() =>
  dogWalkIndex.value === null ? '분석할 도시가 없어요.' : getDogWalkGuide(dogWalkIndex.value),
)

const recommendedWalkTime = computed(() => {
  const city = dogWalkTargetCity.value
  if (!city) return '-'
  if (city.status === '비' || city.status === '눈') return '강수가 없는 시간을 기다려 주세요.'

  // ponytail: 현재 기온 기준 추천, 시간별 예보 API를 연동하면 실제 예보 기온으로 교체
  if (walkTimeSlot.value === 'morning') {
    if (city.temp > 25) return '오전 6~8시'
    if (city.temp < 10) return '오전 10~12시'
    return '오전 8~10시'
  }
  if (walkTimeSlot.value === 'afternoon') {
    if (city.temp > 25) return '더위를 피해 오후 6시 이후'
    if (city.temp < 10) return '오후 1~3시'
    return '오후 3~5시'
  }
  return city.temp < 10 ? '해 지기 전 오후 4~6시' : '오후 7~9시'
})

watch(selectedCityInfo, (message) => console.log('📍 상태바 문구 변경:', message))
watchEffect(() => console.log('🔍 도시 검색어:', searchQuery.value))
watch(showOutingIndex, (visible) => console.log('🚶 외출 지수 표시:', visible ? '켜짐' : '꺼짐'))
watch(outingIndex, (score, oldScore) => console.log('📊 외출 지수 변화:', oldScore, '→', score))
watch(dogWalkIndex, (score, oldScore) =>
  console.log('🐕 강아지 산책 지수 변화:', oldScore, '→', score),
)
watch(walkTimeSlot, (timeSlot) => console.log('⏰ 선택한 산책 시간대:', timeSlot))
watch(filteredWeatherList, (cities) => {
  if (selectedCityId.value && !cities.some((city) => city.id === selectedCityId.value)) {
    selectedCityId.value = null
    selectedCityInfo.value = '검색 결과에서 추천 도시를 표시합니다.'
  }
})
watch(
  () => bestCity.value?.city.name,
  (cityName) => console.log('🏆 추천 도시 변경:', cityName ?? '없음'),
)

const selectCity = (city) => {
  selectedCityId.value = city.id
  selectedCityInfo.value = `${city.name}이 선택되었습니다.`
}

const showDetail = (city) => {
  router.push('/weather/' + city.id)
}
</script>

<template>
  <div class="weather-parent">
    <BaseDashboardCard title="🔍 도시 검색">
      <SearchBar
        :query="searchQuery"
        :show-outing-index="showOutingIndex"
        @update-query="searchQuery = $event"
        @toggle-outing="showOutingIndex = !showOutingIndex"
      />

      <section
        v-if="showOutingIndex && outingIndex !== null"
        class="outing-panel"
        aria-live="polite"
      >
        <div class="outing-heading">
          <strong>오늘의 외출 리포트</strong>
          <span>
            평균 {{ averageTemperature.toFixed(1) }}℃ · 습도 {{ averageHumidity.toFixed(0) }}% ·
            풍속 {{ averageWindSpeed.toFixed(1) }}m/s
          </span>
        </div>
        <div class="outing-grid">
          <div class="outing-result">
            <span>🚶</span>
            <div>
              <small>오늘의 외출 지수</small><strong>{{ outingIndex }}점</strong>
              <p>{{ outingGuide }}</p>
            </div>
          </div>
          <div class="outing-result">
            <span>🎒</span>
            <div>
              <small>추천 준비물</small><strong>{{ itemToBring }}</strong>
              <p>날씨에 맞게 챙겨 보세요.</p>
            </div>
          </div>
          <div class="outing-result">
            <span>🏆</span>
            <div>
              <small>최고 추천 도시</small><strong>{{ bestCity.city.name }}</strong>
              <p>외출 지수 {{ bestCity.score }}점</p>
            </div>
          </div>
        </div>
      </section>
      <p v-else-if="showOutingIndex" class="empty">{{ outingGuide }}</p>
    </BaseDashboardCard>

    <BaseDashboardCard title="🏙️ 지역별 날씨 현황">
      <WeatheCard
        v-for="city in filteredWeatherList"
        :key="city.id"
        :city="city"
        :selected="selectedCityId === city.id"
        :outing-index="calculateOutingIndex(city)"
        :outing-guide="getOutingGuide(calculateOutingIndex(city))"
        :item-to-bring="getItemToBring(city)"
        @select-card="selectCity"
        @click-detail="showDetail"
      />
      <p v-if="filteredWeatherList.length === 0" class="empty">
        😭 검색 결과와 일치하는 도시가 없습니다.
      </p>
    </BaseDashboardCard>

    <DogWalkGuide
      v-if="dogWalkTargetCity && dogWalkIndex !== null"
      :city="dogWalkTargetCity"
      :score="dogWalkIndex"
      :guide="dogWalkGuide"
      :selected="Boolean(selectedCityId)"
      :time-slot="walkTimeSlot"
      :recommended-time="recommendedWalkTime"
      @update-time-slot="walkTimeSlot = $event"
      @reset-city="selectedCityId = null"
    />

    <div class="status-bar" aria-live="polite">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.weather-parent {
  width: 100%;
  margin: 0 auto;
  color: #25324a;
}

.outing-panel {
  padding: 16px;
  margin-top: 14px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fbff, #eef6ff);
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
  color: #64748b;
  font-size: 13px;
}

.outing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
}

.outing-result {
  display: flex;
  gap: 10px;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgb(49 94 168 / 8%);
}

.outing-result > span {
  font-size: 24px;
}

.outing-result small,
.outing-result strong {
  display: block;
}

.outing-result strong {
  margin-top: 4px;
  color: #1e3a5f;
  font-size: 18px;
}

.outing-result p {
  margin: 5px 0 0;
}

.empty {
  padding: 24px;
  margin: 0;
  color: #7b8798;
  text-align: center;
}

.status-bar {
  padding: 13px;
  border-radius: 10px;
  background: #e8f7ee;
  color: #26734d;
  text-align: center;
  font-weight: 700;
}

@media (max-width: 560px) {
  .outing-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
