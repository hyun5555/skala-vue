<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

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
const expandedCityId = ref(null)
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

  if (!query) {
    return weatherList.value
  }

  return weatherList.value.filter((city) => city.name.includes(query))
})

const selectedCity = computed(() =>
  weatherList.value.find((city) => city.id === selectedCityId.value),
)

const averageTemperature = computed(() => {
  if (!filteredWeatherList.value.length) return null

  const total = filteredWeatherList.value.reduce((sum, city) => sum + city.temp, 0)
  return total / filteredWeatherList.value.length
})

const averageWindSpeed = computed(() => {
  if (!filteredWeatherList.value.length) return null

  const total = filteredWeatherList.value.reduce((sum, city) => sum + city.wind, 0)
  return total / filteredWeatherList.value.length
})

const averageHumidity = computed(() => {
  if (!filteredWeatherList.value.length) return null

  const total = filteredWeatherList.value.reduce((sum, city) => sum + city.humidity, 0)
  return total / filteredWeatherList.value.length
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

const outingGuide = computed(() => {
  if (outingIndex.value === null) return '분석할 도시가 없어요.'
  return getOutingGuide(outingIndex.value)
})

const itemToBring = computed(() => {
  if (outingIndex.value === null) return '-'
  return getItemToBring({
    temp: averageTemperature.value,
    wind: averageWindSpeed.value,
    status: hasRainOrSnow.value ? '비' : '맑음',
  })
})

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

watch(selectedCityInfo, (newInfo) => {
  console.log('📍 상태바 문구 변경:', newInfo)
})

watchEffect(() => {
  console.log('🔍 도시 검색어:', searchQuery.value)
})

watch(showOutingIndex, (isVisible) => {
  console.log('🚶 외출 지수 표시:', isVisible ? '켜짐' : '꺼짐')
})

watch(outingIndex, (newIndex, oldIndex) => {
  console.log('📊 외출 지수 변화:', oldIndex, '→', newIndex)
})

watch(dogWalkIndex, (newIndex, oldIndex) => {
  console.log('🐕 강아지 산책 지수 변화:', oldIndex, '→', newIndex)
})

watch(walkTimeSlot, (timeSlot) => {
  console.log('⏰ 선택한 산책 시간대:', timeSlot)
})

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
  window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
  expandedCityId.value = city.id
}
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="weather-composition">
      <section class="search-box">
        <label for="city-search">🔍 도시 검색</label>
        <div class="search-controls">
          <input
            id="city-search"
            type="text"
            v-model="searchQuery"
            placeholder="검색할 도시 이름 입력"
          />
          <button type="button" @click="searchQuery = ''">초기화</button>
          <button type="button" @click="showOutingIndex = !showOutingIndex">
            외출 지수 {{ showOutingIndex ? '숨기기' : '보기' }}
          </button>
        </div>

        <p>
          검색 중인 도시: <strong>{{ searchQuery }}</strong>
        </p>

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
              <span class="outing-icon">🚶</span>
              <div>
                <span class="outing-label">오늘의 외출 지수</span>
                <strong class="outing-value">{{ outingIndex }}점</strong>
                <small>{{ outingGuide }}</small>
              </div>
            </div>

            <div class="outing-result">
              <span class="outing-icon">🎒</span>
              <div>
                <span class="outing-label">추천 준비물</span>
                <strong class="outing-value">{{ itemToBring }}</strong>
                <small>오늘 날씨에 맞게 챙겨 보세요.</small>
              </div>
            </div>

            <div class="outing-result">
              <span class="outing-icon">🏆</span>
              <div>
                <span class="outing-label">최고 추천 도시</span>
                <strong class="outing-value">{{ bestCity.city.name }}</strong>
                <small>외출 지수 {{ bestCity.score }}점</small>
              </div>
            </div>
          </div>
        </section>
        <p v-else-if="showOutingIndex" class="outing-empty">
          {{ outingGuide }}
        </p>
      </section>

      <section class="list-box">
        <h3>🏙️ 지역별 날씨 현황</h3>

        <article
          v-for="city in filteredWeatherList"
          :key="city.id"
          class="weather-card"
          role="button"
          tabindex="0"
          @click="selectCity(city)"
          @keydown.enter="selectCity(city)"
          @keydown.space.prevent="selectCity(city)"
        >
          <div>
            <h4>{{ city.emoji }} {{ city.name }} ({{ city.status }})</h4>
            <p class="weather-data">
              <span>🌡️ {{ city.temp }}℃</span>
              <span>💧 습도 {{ city.humidity }}%</span>
              <span>💨 풍속 {{ city.wind }}m/s</span>
            </p>
            <span v-if="city.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
            <span v-else-if="city.temp >= 10" class="badge cool">🍃 선선함 (25도 미만)</span>
            <span v-else class="badge cold">❄️ 추움 (10도 미만)</span>
          </div>
          <button class="btn-detail" type="button" @click.stop="showDetail(city)">상세보기</button>
          <p v-if="expandedCityId === city.id" class="city-outing-detail" aria-live="polite">
            🚶 {{ city.name }} 외출 지수: <strong>{{ calculateOutingIndex(city) }}점</strong> —
            {{ getOutingGuide(calculateOutingIndex(city)) }}
            <br />
            🎒 추천 준비물: {{ getItemToBring(city) }}
          </p>
        </article>
        <p v-if="filteredWeatherList.length === 0" class="empty">
          😭 검색 결과와 일치하는 도시가 없습니다.
        </p>
      </section>

      <section v-if="dogWalkIndex !== null" class="dog-walk-panel" aria-live="polite">
        <span class="dog-walk-icon">🐕</span>
        <div class="dog-walk-content">
          <span class="dog-walk-label">
            {{ selectedCityId ? '선택한 도시 산책 가이드' : '최고 추천 도시 산책 가이드' }}
          </span>
          <h3>
            {{ dogWalkTargetCity.name }} 강아지 산책 지수 <strong>{{ dogWalkIndex }}점</strong>
          </h3>
          <p>{{ dogWalkGuide }}</p>
          <button
            v-if="selectedCityId"
            type="button"
            class="dog-city-reset"
            @click="selectedCityId = null"
          >
            추천 도시로 돌아가기
          </button>
        </div>
        <div class="dog-walk-options">
          <div class="dog-walk-city">
            <span>{{ selectedCityId ? '선택 도시' : '추천 도시' }}</span>
            <strong>{{ dogWalkTargetCity.name }}</strong>
          </div>
          <div class="dog-walk-time">
            <label for="walk-time-slot">희망 시간대</label>
            <select id="walk-time-slot" v-model="walkTimeSlot">
              <option value="morning">아침</option>
              <option value="afternoon">오후</option>
              <option value="evening">저녁</option>
            </select>
            <strong>⏰ {{ recommendedWalkTime }}</strong>
          </div>
        </div>
      </section>

      <div class="status-bar" aria-live="polite">{{ selectedCityInfo }}</div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  width: 100%;
  margin: 0 auto;
}

.weather-composition {
  color: #25324a;
}

.search-box,
.list-box {
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  background: #f7f9fc;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.search-controls {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  width: auto;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 15px;
}

button {
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.search-box p {
  margin: 10px 0 0;
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

.outing-heading span {
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
  min-width: 0;
  padding: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgb(49 94 168 / 8%);
}

.outing-icon {
  display: grid;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #eaf2ff;
  font-size: 20px;
  place-items: center;
}

.outing-result > div {
  min-width: 0;
}

.outing-label,
.outing-value,
.outing-result small {
  display: block;
}

.outing-label {
  margin-bottom: 4px;
  color: #64748b;
  font-size: 12px;
}

.outing-value {
  color: #1e3a5f;
  font-size: 18px;
}

.outing-result small {
  margin-top: 5px;
  color: #64748b;
  line-height: 1.4;
}

.outing-empty {
  padding: 14px;
  border-radius: 10px;
  background: #fff4f4;
  color: #b42318;
}

.weather-card {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  margin-top: 12px;
  border: 1px solid #dbe3ed;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: 0.15s ease;
}

.weather-card:hover,
.weather-card:focus {
  border-color: #4f8cff;
  box-shadow: 0 4px 12px rgb(79 140 255 / 12%);
  outline: none;
  transform: translateY(-1px);
}

.weather-card h4 {
  margin: 0 0 8px;
  font-size: 17px;
}

.weather-data {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0 0 10px;
  color: #5b677a;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
}

.hot {
  background: #ff6b6b;
}

.cool {
  background: #4dabf7;
}

.cold {
  background: #748ffc;
}

.btn-detail {
  position: static;
  flex: none;
  color: #315ea8;
}

.city-outing-detail {
  flex-basis: 100%;
  padding: 12px;
  margin: 0;
  border-radius: 8px;
  background: #eef6ff;
  color: #315ea8;
}

.dog-walk-panel {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  box-shadow: 0 4px 14px rgb(22 101 52 / 8%);
}

.dog-walk-icon {
  display: grid;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #dcfce7;
  font-size: 30px;
  place-items: center;
}

.dog-walk-content {
  flex: 1;
}

.dog-walk-label,
.dog-walk-city span {
  color: #4b7560;
  font-size: 12px;
}

.dog-walk-content h3 {
  margin: 3px 0 5px;
  color: #14532d;
}

.dog-walk-content h3 strong {
  color: #16a34a;
}

.dog-walk-content p {
  margin: 0;
  color: #3f6650;
}

.dog-city-reset {
  padding: 6px 9px;
  margin-top: 10px;
  border-color: #86efac;
  color: #15803d;
  font-size: 12px;
}

.dog-walk-options {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.dog-walk-city {
  flex: none;
  padding: 10px 16px;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.dog-walk-city strong {
  display: block;
  margin-top: 3px;
  color: #15803d;
  font-size: 18px;
}

.dog-walk-time {
  display: grid;
  gap: 5px;
  min-width: 180px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
}

.dog-walk-time label {
  margin: 0;
  color: #4b7560;
  font-size: 12px;
}

.dog-walk-time select {
  padding: 6px 8px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  background: #fff;
  color: #14532d;
}

.dog-walk-time strong {
  color: #15803d;
  font-size: 13px;
}

.empty {
  padding: 28px;
  text-align: center;
  color: #7b8798;
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
  .search-controls,
  .weather-card {
    align-items: stretch;
    flex-direction: column;
  }

  .btn-detail {
    width: 100%;
  }

  .outing-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .outing-grid {
    grid-template-columns: 1fr;
  }

  .dog-walk-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .dog-walk-options {
    flex-direction: column;
  }

  .dog-walk-city {
    text-align: left;
  }
}
</style>
