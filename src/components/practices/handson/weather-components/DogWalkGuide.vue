<script setup>
import { computed, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import {
  calculatePersonalizedWalkIndex,
  getBestWalkTime,
  getBreedFeelsLike,
  getDogHeatStatus,
  getPetWalkGuide,
  getPersonalizedWalkPlan,
  getWalkAnalysis,
} from '@/services/petWeather.js'
import { getDogBreeds } from '@/services/weatherApi.js'
import { useConfigStore } from '@/stores/configStore.js'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, MarkLineComponent, AriaComponent])

const props = defineProps({
  city: { type: Object, required: true },
  score: { type: Number, required: true },
  selected: Boolean,
  careTips: { type: Array, default: () => [] },
})

defineEmits(['reset-city'])

const configStore = useConfigStore()
const breeds = ref([])
const breedError = ref('')
const emptyProfile = () => ({
  name: '',
  breedName: '',
  age: 3,
  weight: 5,
  coatLength: 'short',
  activity: 'normal',
})
let savedProfile = null
try {
  savedProfile = JSON.parse(localStorage.getItem('petWeatherProfile') ?? 'null')
} catch {
  localStorage.removeItem('petWeatherProfile')
}
const profile = ref(savedProfile ?? emptyProfile())
const profileSaved = ref(Boolean(savedProfile?.name && savedProfile?.breedName))
const profilePanels = ref(profileSaved.value ? [] : ['profile'])

const analysis = computed(() => getWalkAnalysis(props.city))
const breedFeelsLike = computed(() => getBreedFeelsLike(props.city, profile.value))
const heatStatus = computed(() => getDogHeatStatus(breedFeelsLike.value))
const personalizedScore = computed(() =>
  profileSaved.value ? calculatePersonalizedWalkIndex(props.city, profile.value) : props.score,
)
const progressStatus = computed(() => {
  if (personalizedScore.value >= 80) return 'success'
  if (personalizedScore.value >= 60) return 'warning'
  return 'exception'
})
const walkTimes = computed(() =>
  getBestWalkTime(props.city.hourly, profileSaved.value ? profile.value : null),
)
const selectedBreed = computed(() =>
  breeds.value.find(({ name }) => name === profile.value.breedName),
)
const walkPlan = computed(() =>
  profileSaved.value
    ? getPersonalizedWalkPlan(props.city, props.city.hourly, profile.value, selectedBreed.value)
    : null,
)

const formatHour = (time) => `${String(Number(time.slice(11, 13))).padStart(2, '0')}:00`
const walkChartOption = computed(() => ({
  aria: {
    enabled: true,
    description: '시간대별 반려견 산책 지수를 0점부터 100점까지 막대그래프로 표시합니다.',
  },
  grid: { top: 36, right: 18, bottom: 38, left: 42 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: ([point]) =>
      `<strong>${point.name}</strong><br/>산책 지수 ${point.value}점<br/>강수 ${point.data.rainChance}% · UV ${Math.round(point.data.uvIndex)}`,
  },
  xAxis: {
    type: 'category',
    data: walkTimes.value.slots.map(({ time }) => formatHour(time)),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dfe8e2' } },
    axisLabel: {
      color: '#6f8178',
      interval: walkTimes.value.slots.length > 12 ? 2 : walkTimes.value.slots.length > 8 ? 1 : 0,
    },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    interval: 20,
    axisLabel: { color: '#84938b', formatter: '{value}' },
    splitLine: { lineStyle: { color: '#edf2ef' } },
  },
  series: [
    {
      name: '산책 지수',
      type: 'bar',
      barMaxWidth: 42,
      data: walkTimes.value.slots.map((slot) => ({
        value: slot.score,
        rainChance: slot.rainChance ?? 0,
        uvIndex: slot.uvIndex ?? 0,
        itemStyle: {
          color: slot.score >= 80 ? '#259264' : slot.score >= 60 ? '#e2a93b' : '#df614e',
          borderRadius: [8, 8, 3, 3],
        },
      })),
      label: { show: true, position: 'top', color: '#34483e', formatter: '{c}' },
      markLine: {
        symbol: 'none',
        label: { formatter: '주의 기준 60', color: '#8a6b2c', position: 'insideEndTop' },
        lineStyle: { color: '#e2a93b', type: 'dashed' },
        data: [{ yAxis: 60 }],
      },
    },
  ],
}))
const saveProfile = () => {
  localStorage.setItem('petWeatherProfile', JSON.stringify(profile.value))
  profileSaved.value = true
  profilePanels.value = []
}
const resetProfile = () => {
  localStorage.removeItem('petWeatherProfile')
  profile.value = emptyProfile()
  profileSaved.value = false
  profilePanels.value = ['profile']
}

onMounted(async () => {
  try {
    breeds.value = await getDogBreeds()
  } catch (error) {
    breedError.value = error.response?.data?.message ?? '견종 목록을 불러오지 못했습니다.'
  }
})
</script>

<template>
  <div class="dog-walk-guide" aria-live="polite">
    <header class="walk-heading">
      <span class="dog-icon">🐕</span>
      <div class="walk-summary">
        <span class="eyebrow">
          {{ selected ? '선택한 도시 산책 가이드' : '오늘의 맞춤 산책 가이드' }}
        </span>
        <h3>{{ profileSaved ? `${profile.name}의` : city.name }} 산책 지수</h3>
        <p>{{ getPetWalkGuide(personalizedScore) }}</p>
      </div>
      <el-progress
        type="dashboard"
        :percentage="personalizedScore"
        :status="progressStatus"
        :width="104"
      >
        <template #default="{ percentage }">
          <strong class="score">{{ percentage }}점</strong>
        </template>
      </el-progress>
      <el-button v-if="selected" plain @click="$emit('reset-city')">추천 도시로</el-button>
    </header>

    <el-row :gutter="12" class="report-grid">
      <el-col :xs="24" :md="12">
        <el-card class="report-card" shadow="never">
          <el-tag :type="heatStatus.level === 'safe' ? 'success' : 'warning'" effect="light">
            🐕 견종별 체감온도
          </el-tag>
          <strong
            >{{ configStore.formatTemperature(breedFeelsLike) }} · {{ heatStatus.label }}</strong
          >
          <small>
            기상 체감온도 {{ configStore.formatTemperature(city.feelsLike) }}에 견종·털 길이·체중을
            반영한 참고값입니다.
          </small>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="report-card" shadow="never">
          <el-tag type="danger" effect="light">🛣️ 노면 고온 위험 추정</el-tag>
          <strong>{{ analysis.pavementRisk.level }}</strong>
          <small>{{ analysis.pavementRisk.detail }}</small>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="inner-card" shadow="never">
      <h4>이 점수가 나온 이유</h4>
      <el-space wrap>
        <el-tag v-for="reason in analysis.reasons" :key="reason" round>{{ reason }}</el-tag>
      </el-space>
    </el-card>

    <el-card class="inner-card" shadow="never">
      <h4>⚠️ 오늘의 주의사항</h4>
      <el-space v-if="analysis.risks.length" wrap>
        <el-tag v-for="risk in analysis.risks" :key="risk.label" type="warning" effect="light">
          {{ risk.icon }} {{ risk.label }} · {{ risk.detail }}
        </el-tag>
      </el-space>
      <el-alert
        v-else
        title="현재 뚜렷한 기상 위험 요소가 없어요."
        type="success"
        show-icon
        :closable="false"
      />
    </el-card>

    <el-card v-if="walkTimes.best" class="inner-card" shadow="never">
      <div class="section-heading">
        <h4>⭐ 시간대별 산책 추천</h4>
        <el-tag :type="walkTimes.best.score >= 60 ? 'success' : 'danger'" effect="dark" round>
          {{
            walkTimes.best.score >= 60
              ? `BEST ${formatHour(walkTimes.best.time)}`
              : '야외 산책 비추천'
          }}
        </el-tag>
      </div>
      <VChart class="walk-chart" :option="walkChartOption" autoresize />
      <div class="chart-legend" aria-hidden="true">
        <span class="good">● 80점 이상 추천</span>
        <span class="careful">● 60점 이상 주의</span>
        <span class="danger">● 60점 미만 위험</span>
        <small>막대에 마우스를 올리거나 터치하면 강수·UV를 확인할 수 있어요.</small>
      </div>
    </el-card>

    <el-collapse v-model="profilePanels" class="profile-panel">
      <el-collapse-item name="profile">
        <template #title>
          <strong>🐶 강아지 프로필 {{ profileSaved ? '수정' : '등록' }}</strong>
        </template>
        <el-form class="profile-form" label-position="top" @submit.prevent="saveProfile">
          <el-form-item label="이름">
            <el-input v-model.trim="profile.name" required maxlength="20" placeholder="예: 몽이" />
          </el-form-item>
          <el-form-item label="견종">
            <el-select
              v-model="profile.breedName"
              required
              filterable
              placeholder="견종을 선택하세요"
            >
              <el-option
                v-for="breed in breeds"
                :key="breed.id"
                :label="breed.name"
                :value="breed.name"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="나이">
            <el-input-number v-model="profile.age" :min="0" :max="30" controls-position="right" />
          </el-form-item>
          <el-form-item label="몸무게(kg)">
            <el-input-number
              v-model="profile.weight"
              :min="0.5"
              :max="120"
              :step="0.1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="털 길이">
            <el-select v-model="profile.coatLength">
              <el-option label="짧음" value="short" />
              <el-option label="보통" value="medium" />
              <el-option label="김" value="long" />
            </el-select>
          </el-form-item>
          <el-form-item label="활동량">
            <el-select v-model="profile.activity">
              <el-option label="낮음" value="low" />
              <el-option label="보통" value="normal" />
              <el-option label="높음" value="high" />
            </el-select>
          </el-form-item>
          <div class="profile-actions">
            <el-button
              class="save-profile"
              type="primary"
              native-type="submit"
              :disabled="!profile.name || !profile.breedName"
              >프로필 저장</el-button
            >
            <el-button
              v-if="profileSaved"
              type="danger"
              plain
              native-type="button"
              @click="resetProfile"
            >
              프로필 초기화
            </el-button>
          </div>
        </el-form>
        <el-alert v-if="breedError" :title="breedError" type="error" show-icon :closable="false" />
      </el-collapse-item>
    </el-collapse>

    <el-card v-if="walkPlan" class="personal-plan" shadow="never">
      <div class="section-heading">
        <div>
          <span class="eyebrow">BREED &amp; WEATHER PLAN</span>
          <h4>🐾 {{ profile.name }}의 오늘 산책 플랜</h4>
        </div>
        <el-tag :type="personalizedScore >= 60 ? 'success' : 'danger'" effect="dark" round>
          맞춤 {{ personalizedScore }}점
        </el-tag>
      </div>

      <p class="plan-summary">{{ walkPlan.summary }}</p>
      <div class="plan-metrics">
        <div class="plan-metric">
          <small>권장 1회 산책</small>
          <strong>{{ walkPlan.duration }}</strong>
        </div>
        <div class="plan-metric">
          <small>권장 횟수</small>
          <strong>{{ walkPlan.frequency }}</strong>
        </div>
        <div class="plan-metric">
          <small>추천 강도</small>
          <strong>{{ walkPlan.intensity }}</strong>
        </div>
        <div class="plan-metric">
          <small>오늘 추천 시간</small>
          <strong v-if="walkPlan.bestTime && walkPlan.bestTimeScore >= 60">
            {{ formatHour(walkPlan.bestTime) }}
          </strong>
          <strong v-else>실내 활동</strong>
        </div>
      </div>

      <el-space class="plan-tips" direction="vertical" alignment="normal" fill>
        <el-alert
          v-for="tip in walkPlan.tips"
          :key="tip"
          :title="tip"
          type="info"
          show-icon
          :closable="false"
        />
      </el-space>
      <p class="plan-note">
        이 권장안은 일반적인 참고 정보입니다. 질환·비만·수술 이력이 있거나 산책 중 이상 증상이
        보이면 수의사와 상담해 주세요.
      </p>
    </el-card>

    <el-alert
      v-for="tip in careTips"
      :key="tip"
      class="care-tip"
      :title="tip"
      type="info"
      show-icon
      :closable="false"
    />
  </div>
</template>

<style scoped>
.dog-walk-guide {
  display: grid;
  gap: 14px;
}

.walk-heading {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: 20px;
  padding: 26px;
  border: 1px solid #d8e9de;
  border-radius: 22px;
  color: var(--app-ink);
  background: #f0f8f3;
}

.dog-icon {
  display: grid;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  color: #fff;
  background: #19724e;
  font-size: 28px;
  place-items: center;
}

.walk-summary h3,
.walk-summary p,
h4 {
  margin: 0;
}

.walk-summary h3 {
  margin: 4px 0;
  font-size: 24px;
  letter-spacing: -0.04em;
}

.walk-summary p,
.eyebrow,
small {
  color: #71827a;
}

.walk-summary p,
.walk-heading .eyebrow {
  color: #648072;
}

.eyebrow,
small {
  font-size: 12px;
}

.score {
  color: #19724e;
  font-size: 17px;
}

.report-grid {
  margin-bottom: -12px;
}

.report-card {
  height: 100%;
  border: 0;
  background: #fff;
}

.report-card :deep(.el-card__body) {
  display: grid;
  gap: 8px;
}

.report-card strong {
  color: var(--app-ink);
  font-size: 22px;
  letter-spacing: -0.03em;
}

.inner-card,
.profile-panel {
  margin-top: 0;
  border-color: #dfe7df;
}

.inner-card h4 {
  margin-bottom: 12px;
  font-size: 16px;
}

.inner-card :deep(.el-tag) {
  height: auto;
  padding: 7px 10px;
  white-space: normal;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.walk-chart {
  width: 100%;
  height: 330px;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 12px;
  border-top: 1px solid #edf2ef;
  color: #71827a;
  font-size: 11px;
}

.chart-legend .good {
  color: #259264;
}

.chart-legend .careful {
  color: #c48c1d;
}

.chart-legend .danger {
  color: #df614e;
}

.chart-legend small {
  margin-left: auto;
}

.profile-panel {
  padding: 0 16px;
  border: 1px solid #dfe7df;
  border-radius: 18px;
  background: #fff;
}

.profile-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 14px;
}

.profile-form :deep(.el-select),
.profile-form :deep(.el-input-number) {
  width: 100%;
}

.profile-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
}

.personal-plan {
  border-color: #cfe1d3;
  background: linear-gradient(145deg, #fff 0%, #f2f8f1 100%);
}

.personal-plan h4 {
  margin-top: 4px;
  font-size: 20px;
}

.plan-summary,
.plan-note {
  color: #5f7067;
  line-height: 1.6;
}

.plan-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0;
}

.plan-metric {
  display: grid;
  gap: 6px;
  min-height: 86px;
  padding: 16px;
  border: 1px solid #dce8de;
  border-radius: 14px;
  background: rgb(255 255 255 / 82%);
}

.plan-metric strong {
  color: var(--app-ink);
  font-size: 16px;
  line-height: 1.35;
}

.plan-tips {
  width: 100%;
}

.plan-note {
  margin: 14px 0 0;
  font-size: 12px;
}

.care-tip {
  margin-top: -6px;
  border: 1px solid #dce8de;
  background: #f8fbf7;
}

@media (max-width: 760px) {
  .walk-heading {
    grid-template-columns: 1fr auto;
  }

  .dog-icon {
    display: none;
  }

  .walk-heading > .el-button {
    grid-column: 1 / -1;
  }

  .report-card {
    height: auto;
    margin-bottom: 12px;
  }

  .profile-form {
    grid-template-columns: 1fr;
  }

  .profile-actions {
    grid-template-columns: 1fr;
  }

  .plan-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .walk-chart {
    height: 280px;
  }

  .chart-legend {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .chart-legend small {
    width: 100%;
    margin-left: 0;
  }
}
</style>
