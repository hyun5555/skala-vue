<script setup>
import WeatherParent from '@/components/practices/handson/weather-components/WeatherParent.vue'
</script>

<template>
  <section>
    <h2>오늘의 날씨 대시보드</h2>
    <p class="intro">도시를 검색하고 상세 기상 관측 정보와 외출 지수를 확인하세요.</p>
    <WeatherParent />
  </section>
</template>

<style scoped>
h2 {
  margin: 0;
  color: #1e3a5f;
}

.intro {
  margin: 4px 0 20px;
  color: #64748b;
}
</style>
