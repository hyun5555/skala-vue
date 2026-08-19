<script setup>
import { ref } from 'vue'

const welcomeMessage = ref('Welcome to Skala-Vue')

function changeMessage() {
  welcomeMessage.value = 'Message changed!'
}
</script>

<template>
  <div class="practice-section">
    <h2>{{ welcomeMessage }}</h2>

    <h3>JavaScript in Text Interpolation</h3>
    <p>대문자: {{ welcomeMessage.toUpperCase() }}</p>
    <p>계산 결과: {{ 10 + 20 }}</p>
    <p>랜덤 숫자: {{ Math.floor(Math.random() * 100) + 1 }}</p>

    <h3>Reactivity</h3>
    <button type="button" @click="changeMessage">메시지 변경</button>
  </div>
</template>
