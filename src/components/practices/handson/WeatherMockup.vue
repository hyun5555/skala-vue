<script setup>
import { computed, ref } from 'vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', emoji: '☀️', humidity: 48, wind: 2.1 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', emoji: '🌧️', humidity: 85, wind: 3.4 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', emoji: '☁️', humidity: 63, wind: 4.2 },
  { id: 'city_04', name: '제주', temp: 23, status: '바람', emoji: '🌬️', humidity: 72, wind: 6.8 },
  { id: 'city_05', name: '대전', temp: 9, status: '눈', emoji: '🌨️', humidity: 76, wind: 1.8 },
  { id: 'city_06', name: '광주', temp: 27, status: '흐림', emoji: '🌥️', humidity: 58, wind: 2.7 },
])

const searchCity = ref('')
const searchCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchCity.value.trim())),
)

const selectCity = (cityName) => {
  searchCityInfo.value = `${cityName}이 선택되었습니다.`
}

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>
<template>
  <div class="dashboard-wrapper">
    <section class="weather-mockup">
      <h2>🌤️ 실시간 지역 날씨</h2>

      <section class="search-box">
        <label for="city-search">🔍 도시 검색</label>
        <div class="search-controls">
          <input
            id="city-search"
            type="text"
            :value="searchCity"
            @input="searchCity = $event.target.value"
            placeholder="예: 서울, 부산, 제주"
          />
          <button type="button" @click="searchCity = ''">초기화</button>
        </div>
        <p>
          입력한 도시: <strong>{{ searchCity || '없음' }}</strong>
          <span>· 검색 결과 {{ filteredWeatherList.length }}개</span>
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
          @click="selectCity(city.name)"
          @keydown.enter="selectCity(city.name)"
          @keydown.space.prevent="selectCity(city.name)"
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
          <button class="btn-detail" type="button" @click.stop="showDetail(city.name, city.status)">
            상세보기
          </button>
        </article>

        <p v-if="filteredWeatherList.length === 0" class="empty">일치하는 도시가 없습니다.</p>
      </section>

      <div class="status-bar" aria-live="polite">{{ searchCityInfo }}</div>
    </section>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  width: 100%;
  margin: 0 auto;
}

.weather-mockup {
  color: #25324a;
}

.weather-mockup h2 {
  margin: 0 0 20px;
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

.weather-card {
  display: flex;
  align-items: center;
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
  .weather-card {
    align-items: stretch;
    flex-direction: column;
  }

  .btn-detail {
    width: 100%;
  }
}
</style>
