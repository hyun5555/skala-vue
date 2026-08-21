<script setup>
defineProps({
  city: {
    type: Object,
    required: true,
  },
  selected: Boolean,
  expanded: Boolean,
  outingIndex: {
    type: Number,
    required: true,
  },
  outingGuide: {
    type: String,
    required: true,
  },
  itemToBring: {
    type: String,
    required: true,
  },
})

defineEmits(['select-card', 'click-detail'])
</script>

<template>
  <article
    class="weather-card"
    :class="{ selected }"
    role="button"
    tabindex="0"
    @click="$emit('select-card', city)"
    @keydown.enter="$emit('select-card', city)"
    @keydown.space.prevent="$emit('select-card', city)"
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
    <button type="button" @click.stop="$emit('click-detail', city)">상세보기</button>

    <p v-if="expanded" class="city-detail" aria-live="polite">
      🚶 {{ city.name }} 외출 지수: <strong>{{ outingIndex }}점</strong> — {{ outingGuide }}
      <br />
      🎒 추천 준비물: {{ itemToBring }}
    </p>
  </article>
</template>

<style scoped>
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
.weather-card:focus,
.weather-card.selected {
  border-color: #4f8cff;
  box-shadow: 0 4px 12px rgb(79 140 255 / 12%);
  outline: none;
  transform: translateY(-1px);
}

h4 {
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

button {
  flex: none;
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #315ea8;
  cursor: pointer;
}

.city-detail {
  flex-basis: 100%;
  padding: 12px;
  margin: 0;
  border-radius: 8px;
  background: #eef6ff;
  color: #315ea8;
}

@media (max-width: 560px) {
  .weather-card {
    align-items: stretch;
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
