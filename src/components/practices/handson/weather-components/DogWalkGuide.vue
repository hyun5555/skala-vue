<script setup>
defineProps({
  city: {
    type: Object,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  guide: {
    type: String,
    required: true,
  },
  selected: Boolean,
  timeSlot: {
    type: String,
    required: true,
  },
  recommendedTime: {
    type: String,
    required: true,
  },
})

defineEmits(['update-time-slot', 'reset-city'])
</script>

<template>
  <section class="dog-walk-guide" aria-live="polite">
    <span class="dog-icon">🐕</span>
    <div class="dog-content">
      <span class="eyebrow">
        {{ selected ? '선택한 도시 산책 가이드' : '최고 추천 도시 산책 가이드' }}
      </span>
      <h3>
        {{ city.name }} 강아지 산책 지수 <strong>{{ score }}점</strong>
      </h3>
      <p>{{ guide }}</p>
      <button v-if="selected" type="button" @click="$emit('reset-city')">
        추천 도시로 돌아가기
      </button>
    </div>

    <div class="walk-options">
      <div class="city-summary">
        <span>{{ selected ? '선택 도시' : '추천 도시' }}</span>
        <strong>{{ city.name }}</strong>
      </div>
      <div class="time-picker">
        <label for="component-walk-time">희망 시간대</label>
        <select
          id="component-walk-time"
          :value="timeSlot"
          @change="$emit('update-time-slot', $event.target.value)"
        >
          <option value="morning">아침</option>
          <option value="afternoon">오후</option>
          <option value="evening">저녁</option>
        </select>
        <strong>⏰ {{ recommendedTime }}</strong>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dog-walk-guide {
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

.dog-icon {
  display: grid;
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #dcfce7;
  font-size: 30px;
  place-items: center;
}

.dog-content {
  flex: 1;
}

.eyebrow,
.city-summary span {
  color: #4b7560;
  font-size: 12px;
}

h3 {
  margin: 3px 0 5px;
  color: #14532d;
}

h3 strong,
.city-summary strong,
.time-picker strong {
  color: #15803d;
}

p {
  margin: 0;
  color: #3f6650;
}

button {
  padding: 6px 9px;
  margin-top: 10px;
  border: 1px solid #86efac;
  border-radius: 8px;
  background: #fff;
  color: #15803d;
  cursor: pointer;
}

.walk-options {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.city-summary,
.time-picker {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
}

.city-summary {
  min-width: 90px;
  text-align: center;
}

.city-summary strong,
.time-picker strong {
  display: block;
  margin-top: 4px;
}

.time-picker {
  display: grid;
  gap: 5px;
  min-width: 180px;
}

label {
  color: #4b7560;
  font-size: 12px;
}

select {
  padding: 6px 8px;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  background: #fff;
  color: #14532d;
}

.time-picker strong {
  font-size: 13px;
}

@media (max-width: 720px) {
  .dog-walk-guide,
  .walk-options {
    align-items: stretch;
    flex-direction: column;
  }

  .city-summary {
    text-align: left;
  }
}
</style>
