<script setup>
import WeatherMockup from './components/practices/handson/WeatherMockup.vue'
</script>

<template>
  <div class="app-container">
    <h1>⛅ 과제 1: 날씨 (Mockup)</h1>
    <hr />
    <WeatherMockup />
  </div>
</template>

<style>
@import '@/assets/exercise.css';

.app-container {
  grid-column: 1 / -1;
  width: min(1100px, calc(100vw - 4rem));
  max-width: 1100px;
  margin: 40px auto;
}
</style>
