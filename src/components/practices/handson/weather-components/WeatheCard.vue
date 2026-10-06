<script setup>
import { ArrowRight, Star, StarFilled } from '@element-plus/icons-vue'
import { formatWeatherMetric, getPetWalkGuide } from '@/services/petWeather.js'

const props = defineProps({
  city: { type: Object, required: true },
  selected: Boolean,
  expanded: Boolean,
  assessment: { type: Object, required: true },
  itemToBring: { type: String, required: true },
  favorite: Boolean,
})

defineEmits(['select-card', 'click-detail', 'toggle-favorite'])

const walkTag = () => {
  if (props.assessment.score === null) return { type: 'info', text: '정보 부족' }
  if (!props.assessment.eligible) return { type: 'danger', text: '추천 제외' }
  if (props.assessment.cautionFlags.length || props.assessment.score < 80)
    return { type: 'warning', text: '주의 조건 확인' }
  return { type: 'success', text: '쾌적한 후보' }
}
</script>

<template>
  <el-card class="weather-card" :class="{ selected }" shadow="never">
    <div class="card-top">
      <el-tag :type="walkTag().type" effect="light">{{ walkTag().text }}</el-tag>
      <el-button
        class="favorite-button"
        circle
        :type="favorite ? 'warning' : 'default'"
        :aria-label="`${city.name} 관심 도시 ${favorite ? '해제' : '등록'}`"
        :aria-pressed="favorite"
        @click="$emit('toggle-favorite', city.id)"
      >
        <el-icon><StarFilled v-if="favorite" /><Star v-else /></el-icon>
      </el-button>
    </div>

    <div
      class="weather-main"
      role="button"
      tabindex="0"
      @click="$emit('select-card', city)"
      @keydown.enter="$emit('select-card', city)"
      @keydown.space.prevent="$emit('select-card', city)"
    >
      <span class="weather-emoji">{{ city.emoji }}</span>
      <div class="city-temperature">
        <strong>{{ city.displayTemp }}</strong>
        <div>
          <h3>{{ city.name }}</h3>
          <small>{{ city.status }}</small>
        </div>
      </div>

      <div class="weather-metrics">
        <div>
          <small>체감</small><strong>{{ city.displayFeelsLike }}</strong>
        </div>
        <div>
          <small>습도</small><strong>{{ formatWeatherMetric(city.humidity, '%') }}</strong>
        </div>
        <div>
          <small>바람</small><strong>{{ formatWeatherMetric(city.wind, 'm/s') }}</strong>
        </div>
        <div>
          <small>대기질</small><strong>{{ formatWeatherMetric(city.airQuality?.us_aqi) }}</strong>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="outing-score">
        <span
          >산책 지수 <strong>{{ formatWeatherMetric(assessment.score) }}</strong></span
        >
        <el-progress
          v-if="assessment.score !== null"
          :percentage="assessment.score"
          :status="
            !assessment.eligible
              ? 'exception'
              : walkTag().type === 'warning'
                ? 'warning'
                : 'success'
          "
          :show-text="false"
          :stroke-width="6"
        />
      </div>
      <el-button text type="primary" @click="$emit('click-detail', city)">
        자세히 <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <el-alert
      v-if="expanded"
      class="city-detail"
      :title="`${city.name} 산책 지수 ${formatWeatherMetric(assessment.score, '점')}`"
      :description="`${getPetWalkGuide(assessment)} · 추천 준비물 ${itemToBring}`"
      type="info"
      :closable="false"
      show-icon
    />
  </el-card>
</template>

<style scoped>
.weather-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-color: #e5e9e3;
  background: #fff;
  transition: 0.22s ease;
}

.weather-card:hover,
.weather-card.selected {
  border-color: #81aa92;
  box-shadow: 0 18px 36px rgb(32 80 58 / 12%);
  transform: translateY(-3px);
}

.weather-card.selected::before {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 4px;
  background: #1f6b4f;
  content: '';
}

.card-top,
.card-footer,
.city-temperature,
.outing-score > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.favorite-button {
  width: 36px;
  height: 36px;
  min-height: auto;
}

.weather-main {
  cursor: pointer;
  outline: none;
}

.weather-main:focus-visible {
  border-radius: 12px;
  box-shadow: 0 0 0 3px rgb(31 107 79 / 18%);
}

.weather-emoji {
  display: block;
  margin: 16px 0 4px;
  font-size: 48px;
  filter: drop-shadow(0 10px 14px rgb(31 69 51 / 12%));
}

.city-temperature {
  align-items: flex-end;
  margin-bottom: 22px;
}

.city-temperature > strong {
  font-size: 44px;
  line-height: 1;
  letter-spacing: -0.07em;
}

.city-temperature h3,
.city-temperature small {
  display: block;
  margin: 0;
  text-align: right;
}

.city-temperature h3 {
  font-size: 18px;
}

.city-temperature small,
.weather-metrics small {
  color: #839087;
  font-size: 11px;
}

.weather-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 14px 0;
  border-top: 1px solid #e8ece6;
  border-bottom: 1px solid #e8ece6;
}

.weather-metrics div {
  min-width: 0;
  text-align: center;
}

.weather-metrics div + div {
  border-left: 1px solid #e8ece6;
}

.weather-metrics small,
.weather-metrics strong {
  display: block;
}

.weather-metrics strong {
  margin-top: 3px;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-footer {
  margin-top: 16px;
}

.outing-score {
  flex: 1;
  min-width: 0;
}

.outing-score > span {
  margin-bottom: 5px;
  color: #75847b;
  font-size: 10px;
}

.outing-score > span strong {
  color: #1f6b4f;
  font-size: 12px;
}

.card-footer > .el-button {
  margin-left: 4px;
}

.city-detail {
  margin-top: 14px;
}
</style>
