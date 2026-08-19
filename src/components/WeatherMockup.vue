<script setup>
import { computed, ref } from 'vue'

const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 48 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 82 },
  { id: 'city_03', name: '부산', temp: 26, status: '구름', humidity: 65 },
  { id: 'city_04', name: '제주', temp: 23, status: '바람', humidity: 72 },
])

const searchCity = ref('')

const message = ref('카드를 클릭하거나 도시 이름을 검색해 보세요.')

const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchCity.value.trim())),
)

const selectCity = (cityName) => {
  message.value = `${cityName}이 선택되었습니다.`
}

const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <section class="weather-mockup">
    <h2>🌤️ 과제 1: 날씨 (Mockup)</h2>

    <label for="city-search">🔍 도시 검색</label>
    <input
      id="city-search"
      type="text"
      :value="searchCity"
      @input="searchCity = $event.target.value"
      placeholder="검색할 도시 이름 입력"
    />
    <p>
      검색 중인 도시: <strong>{{ searchCity || '없음' }}</strong>
    </p>

    <h3>🌆 지역별 날씨 현황</h3>
    <article
      v-for="city in filteredWeatherList"
      :key="city.id"
      class="weather-card"
      role="button"
      tabindex="0"
      @click="selectCity(city.name)"
      @keydown.enter="selectCity(city.name)"
    >
      <div>
        <strong>{{ city.name }} ({{ city.status }})</strong>
        <p>현재 기온: {{ city.temp }}℃ · 습도: {{ city.humidity }}%</p>
        <span v-if="city.temp >= 25" class="hot">🔥 더움 (25도 이상)</span>
        <span v-else class="cool">❄️ 선선함 (25도 미만)</span>
      </div>
      <button type="button" @click.stop="showDetail(city.name, city.status)">상세보기</button>
    </article>
    <p v-if="filteredWeatherList.length === 0" class="empty">일치하는 도시가 없습니다.</p>

    <p class="status" aria-live="polite">{{ message }}</p>
  </section>
</template>

<style scoped>
.weather-mockup {
  padding: 24px;
  margin: 40px 0;
  border: 1px solid #dfe4ea;
  border-radius: 12px;
  background: #fff;
}

label,
input {
  display: block;
  width: 100%;
}

label {
  margin: 20px 0 6px;
  font-weight: 600;
}

.weather-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-top: 12px;
  border: 1px solid #dfe4ea;
  border-radius: 8px;
  cursor: pointer;
}

.weather-card:hover,
.weather-card:focus {
  border-color: #42b883;
  outline: none;
}

.weather-card p {
  margin: 4px 0 8px;
}

.empty {
  padding: 24px;
  text-align: center;
  color: #868e96;
}

.hot,
.cool {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 5px;
  color: #fff;
  font-size: 13px;
}

.hot {
  background: #ff6b6b;
}

.cool {
  background: #4dabf7;
}

.status {
  padding: 12px;
  margin-top: 20px;
  border-radius: 8px;
  background: #e8f7ee;
  color: #218c5a;
  text-align: center;
  font-weight: 600;
}
</style>
