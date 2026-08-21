<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const city = ref(null)

const mockWeather = {
  city_01: { name: '서울특별시', temp: 28, status: '맑음', emoji: '☀️', humidity: 48, wind: 2.1 },
  city_02: { name: '경기도 수원시', temp: 24, status: '비', emoji: '🌧️', humidity: 85, wind: 3.4 },
  city_03: { name: '부산광역시', temp: 26, status: '구름', emoji: '☁️', humidity: 63, wind: 4.2 },
  city_04: { name: '제주특별자치도', temp: 23, status: '바람', emoji: '🌬️', humidity: 72, wind: 6.8 },
  city_05: { name: '대전광역시', temp: 9, status: '눈', emoji: '🌨️', humidity: 76, wind: 1.8 },
  city_06: { name: '광주광역시', temp: 27, status: '흐림', emoji: '🌥️', humidity: 58, wind: 2.7 },
}

onMounted(() => {
  city.value = mockWeather[route.params.cityId] ?? null
})
</script>

<template>
  <section class="page-card">
    <h2>📊 지역별 상세 기상관측 정보</h2>

    <div v-if="city" class="weather-detail">
      <span class="weather-icon">{{ city.emoji }}</span>
      <div>
        <h3>{{ city.name }}</h3>
        <p>현재 상태: <strong>{{ city.status }}</strong></p>
        <p>기온: <strong>{{ city.temp }}℃</strong></p>
        <p>습도: <strong>{{ city.humidity }}%</strong></p>
        <p>풍속: <strong>{{ city.wind }}m/s</strong></p>
      </div>
    </div>

    <p v-else class="error">도시 코드에 해당하는 기상 정보가 없습니다.</p>
    <RouterLink class="button-link" to="/">← 메인 대시보드로 돌아가기</RouterLink>
  </section>
</template>

<style scoped>
.page-card {
  padding: 24px;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  background: #fff;
}

h2,
h3 {
  margin-top: 0;
}

.weather-detail {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
  margin: 20px 0;
  border-radius: 12px;
  background: #f1f5f9;
}

.weather-detail p {
  margin: 5px 0;
}

.weather-icon {
  font-size: 64px;
}

.error {
  padding: 24px;
  color: #b42318;
  text-align: center;
}

.button-link {
  display: inline-block;
  padding: 9px 14px;
  border-radius: 8px;
  background: #315ea8;
  color: #fff;
}
</style>
