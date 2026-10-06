<script setup>
import { computed, onMounted, onUnmounted, ref, useId } from 'vue'
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
  evaluateWalkWeather,
  formatWeatherMetric as formatMetric,
  getBestWalkTime,
  getDogHeatStatus,
  getPetWalkGuide,
  getPersonalizedWalkPlan,
  getWalkAnalysis,
} from '@/services/petWeather.js'
import { getDogBreeds } from '@/services/weatherApi.js'
import { useConfigStore } from '@/stores/configStore.js'
import {
  emptyPetProfile,
  usePetProfileStore,
  validatePetProfile,
} from '@/stores/petProfileStore.js'

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, MarkLineComponent, AriaComponent])

const props = defineProps({
  city: { type: Object, required: true },
  selected: Boolean,
  careTips: { type: Array, default: () => [] },
})

defineEmits(['reset-city'])

const configStore = useConfigStore()
const petProfileStore = usePetProfileStore()
const breeds = ref([])
const breedError = ref('')
const profile = computed(() => petProfileStore.savedProfile ?? emptyPetProfile())
const profileSaved = computed(() => petProfileStore.hasProfile)
const draft = ref({ ...profile.value })
const validDraft = computed(() => validatePetProfile(draft.value) !== null)
const profilePanels = ref(profileSaved.value ? [] : ['profile'])
const profileStatus = ref('')
const availability = ref('all')
const durationMinutes = ref(30)
const startTime = ref('07:00')
const endTime = ref('21:00')
const nowMs = ref(Date.now())
const selectedSlotTime = ref('')
const timeInputId = useId()
let clockTimer

const settingsError = computed(() => {
  if (availability.value !== 'custom') return ''
  if (!startTime.value || !endTime.value)
    return '산책 가능한 시작 시각과 종료 시각을 모두 입력해 주세요.'
  if (startTime.value === endTime.value) return '시작 시각과 종료 시각을 다르게 설정해 주세요.'
  return ''
})
const walkOptions = computed(() => ({
  now: nowMs.value,
  availability: availability.value,
  startTime: startTime.value,
  endTime: endTime.value,
  durationMinutes: durationMinutes.value,
}))

const assessment = computed(() =>
  evaluateWalkWeather(props.city, profileSaved.value ? profile.value : null, {
    source: 'observation',
  }),
)
const analysis = computed(() =>
  getWalkAnalysis(props.city, profileSaved.value ? profile.value : null, assessment.value),
)
const breedFeelsLike = computed(() => assessment.value.feelsLike)
const heatStatus = computed(() => getDogHeatStatus(breedFeelsLike.value))
const personalizedScore = computed(() => assessment.value.score)
const progressStatus = computed(() => {
  if (!assessment.value.eligible) return 'exception'
  if (
    assessment.value.eligible &&
    !assessment.value.cautionFlags.length &&
    personalizedScore.value >= 80
  )
    return 'success'
  if (personalizedScore.value >= 60) return 'warning'
  return 'exception'
})
const walkTimes = computed(() =>
  settingsError.value
    ? { slots: [], best: null, groups: [], message: settingsError.value }
    : getBestWalkTime(
        props.city.hourly,
        profileSaved.value ? profile.value : null,
        walkOptions.value,
      ),
)
const selectedSlot = computed(
  () =>
    walkTimes.value.slots.find(({ time }) => time === selectedSlotTime.value) ??
    walkTimes.value.best ??
    walkTimes.value.slots[0] ??
    null,
)
const selectedBreed = computed(() =>
  breeds.value.find(({ name }) => name === profile.value.breedName),
)
const walkPlan = computed(() =>
  profileSaved.value
    ? getPersonalizedWalkPlan(
        props.city,
        props.city.hourly,
        profile.value,
        selectedBreed.value,
        walkOptions.value,
      )
    : null,
)

const formatWalkTime = (time) => {
  if (typeof time !== 'string') return '시간 정보 없음'
  const instant = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/u.test(time) ? time : `${time}+09:00`)
  if (!Number.isFinite(instant)) return '시간 정보 없음'
  const localTime = new Date(instant + 9 * 60 * 60 * 1000).toISOString()
  const today = new Date(nowMs.value + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const tomorrow = new Date(nowMs.value + 33 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const date = localTime.slice(0, 10)
  const day =
    date === today
      ? '오늘'
      : date === tomorrow
        ? '내일'
        : `${Number(localTime.slice(5, 7))}/${Number(localTime.slice(8, 10))}`
  return `${day} ${localTime.slice(11, 16)}`
}
const formatWeatherTemperature = (value) =>
  Number.isFinite(value) ? configStore.formatTemperature(value) : '정보 부족'
const selectChartSlot = ({ dataIndex }) => {
  const slot = walkTimes.value.slots[dataIndex]
  if (slot) selectedSlotTime.value = slot.time
}
const walkChartOption = computed(() => ({
  aria: {
    enabled: true,
    description:
      '출발 시각별 산책 구간의 최저 점수를 표시합니다. 회색 막대는 추천에서 제외된 시간입니다. 출발 후보 상세 보기에서 점수와 제외 이유를 확인할 수 있습니다.',
  },
  grid: { top: 36, right: 18, bottom: 48, left: 42 },
  tooltip: {
    trigger: 'axis',
    renderMode: 'richText',
    axisPointer: { type: 'shadow' },
    formatter: ([point]) =>
      point
        ? `${point.name}\n${point.data.eligible ? '추천 후보' : '추천 제외'}\n구간 최저 ${formatMetric(point.value, '점')}`
        : '',
  },
  xAxis: {
    type: 'category',
    data: walkTimes.value.slots.map(({ time }) => formatWalkTime(time)),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dfe8e2' } },
    axisLabel: {
      color: '#6f8178',
      interval: 'auto',
      hideOverlap: true,
      formatter: (value) => value.replace(' ', '\n'),
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
      name: '산책 구간 최저 점수',
      type: 'bar',
      barMaxWidth: 42,
      data: walkTimes.value.slots.map((slot) => ({
        value: slot.score,
        eligible: slot.eligible,
        itemStyle: {
          color: !slot.eligible
            ? '#72867a'
            : slot.score >= 80 && !slot.cautionFlags.length
              ? '#259264'
              : '#e2a93b',
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
  profileStatus.value = ''
  if (!petProfileStore.saveProfile(draft.value)) {
    profilePanels.value = ['profile']
    return
  }
  draft.value = { ...profile.value }
  profilePanels.value = []
  profileStatus.value = '이 브라우저에 프로필을 저장했어요.'
}
const resetProfile = () => {
  profileStatus.value = ''
  if (!petProfileStore.resetProfile()) return
  draft.value = emptyPetProfile()
  profilePanels.value = ['profile']
  profileStatus.value = '저장된 프로필을 삭제했어요.'
}

onMounted(async () => {
  clockTimer = setInterval(() => {
    nowMs.value = Date.now()
  }, 60_000)
  try {
    breeds.value = await getDogBreeds()
  } catch (error) {
    breedError.value = error.response?.data?.message ?? '견종 목록을 불러오지 못했습니다.'
  }
})
onUnmounted(() => clearInterval(clockTimer))
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
        <p>{{ getPetWalkGuide(assessment) }}</p>
      </div>
      <el-progress
        v-if="personalizedScore !== null"
        type="dashboard"
        :percentage="personalizedScore"
        :status="progressStatus"
        :width="104"
      >
        <template #default="{ percentage }">
          <strong class="score">{{ percentage }}점</strong>
        </template>
      </el-progress>
      <strong v-if="personalizedScore === null" class="score">정보 부족</strong>
      <el-button v-if="selected" plain @click="$emit('reset-city')">추천 도시로</el-button>
    </header>

    <el-row :gutter="12" class="report-grid">
      <el-col :xs="24" :md="12">
        <el-card class="report-card" shadow="never">
          <el-tag :type="heatStatus.level === 'safe' ? 'success' : 'warning'" effect="light">
            🐕 견종별 체감온도
          </el-tag>
          <strong>{{ formatWeatherTemperature(breedFeelsLike) }} · {{ heatStatus.label }}</strong>
          <small>
            기상 체감온도 {{ formatWeatherTemperature(city.feelsLike) }}에 견종·털 길이·체중을
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

    <el-card class="inner-card" shadow="never">
      <div class="section-heading">
        <h4>⭐ 산책 시작 시간 추천</h4>
        <el-tag
          v-if="walkTimes.best"
          :type="walkTimes.best.score >= 80 ? 'success' : 'warning'"
          effect="dark"
          round
        >
          추천 {{ formatWalkTime(walkTimes.best.time) }}
        </el-tag>
        <el-tag v-else type="info" round>추천 시간 없음</el-tag>
      </div>

      <el-form class="walk-settings" label-position="top" @submit.prevent>
        <el-form-item label="산책 가능한 시간대">
          <el-select v-model="availability" aria-label="산책 가능한 시간대">
            <el-option label="시간 제한 없음" value="all" />
            <el-option label="아침 (06:00~10:00)" value="morning" />
            <el-option label="저녁 (17:00~22:00)" value="evening" />
            <el-option label="직접 설정" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="1회 산책 시간">
          <el-select v-model="durationMinutes" aria-label="1회 산책 시간">
            <el-option
              v-for="minutes in [15, 30, 45, 60, 90]"
              :key="minutes"
              :label="`${minutes}분`"
              :value="minutes"
            />
          </el-select>
        </el-form-item>
        <div v-if="availability === 'custom'" class="custom-time-window">
          <label :for="`${timeInputId}-start`">
            산책 가능한 시작 시각
            <input
              :id="`${timeInputId}-start`"
              v-model="startTime"
              type="time"
              required
              :aria-invalid="Boolean(settingsError)"
              :aria-describedby="`${timeInputId}-hint`"
            />
          </label>
          <label :for="`${timeInputId}-end`">
            산책 가능한 종료 시각
            <input
              :id="`${timeInputId}-end`"
              v-model="endTime"
              type="time"
              required
              :aria-invalid="Boolean(settingsError)"
              :aria-describedby="`${timeInputId}-hint`"
            />
          </label>
          <small :id="`${timeInputId}-hint`">
            {{ settingsError || '종료 시각이 더 이르면 다음 날까지 이어지는 시간대로 설정돼요.' }}
          </small>
        </div>
      </el-form>
      <p class="walk-method">
        정시 출발을 기준으로 {{ durationMinutes }}분 산책이 끝날 때까지의 날씨를 확인해요. 시간 단위
        예보이므로 출발과 종료 시각 양쪽의 시간 경계까지 보수적으로 평가해요.
      </p>
      <el-alert
        v-if="!walkTimes.best"
        :title="walkTimes.message || '조건에 맞는 산책 시간을 찾지 못했어요.'"
        :type="settingsError ? 'error' : 'info'"
        show-icon
        :closable="false"
      />
      <div v-if="walkTimes.groups.length" class="start-time-groups">
        <strong>산책 시작 가능 시간</strong>
        <p>최고 점수와 3점 이내이며 날씨와 주의 조건도 비슷한 출발 시간을 묶었어요.</p>
        <div v-for="group in walkTimes.groups" :key="group.startTime" class="start-time-group">
          <strong>
            {{ formatWalkTime(group.startTime) }}
            <template v-if="group.startTime !== group.endTime">
              ~ {{ formatWalkTime(group.endTime) }}
            </template>
          </strong>
          <span>
            {{
              group.minScore === group.maxScore
                ? `${group.minScore}점`
                : `${group.minScore}~${group.maxScore}점`
            }}
            · 출발 후보 {{ group.count }}개
          </span>
        </div>
      </div>

      <VChart class="walk-chart" :option="walkChartOption" autoresize @click="selectChartSlot" />
      <div class="chart-legend">
        <span class="good">● 쾌적한 후보</span>
        <span class="careful">● 주의 조건 있는 후보</span>
        <span class="excluded">● 추천에서 제외</span>
        <small>출발 후보를 선택하면 산책 구간의 날씨와 제외 이유를 확인할 수 있어요.</small>
      </div>

      <div v-if="selectedSlot" class="slot-detail">
        <label class="slot-picker" :for="`${timeInputId}-candidate`">
          출발 후보 상세 보기
          <select
            :id="`${timeInputId}-candidate`"
            :value="selectedSlot.time"
            @change="selectedSlotTime = $event.target.value"
          >
            <option v-for="slot in walkTimes.slots" :key="slot.time" :value="slot.time">
              {{ formatWalkTime(slot.time) }} ·
              {{ slot.score === null ? '정보 부족' : slot.eligible ? '추천 후보' : '추천 제외' }}
            </option>
          </select>
        </label>
        <el-tag
          :type="
            selectedSlot.eligible
              ? selectedSlot.cautionFlags.length
                ? 'warning'
                : 'success'
              : selectedSlot.score === null
                ? 'info'
                : 'danger'
          "
          effect="light"
        >
          {{
            selectedSlot.score === null
              ? '정보 부족'
              : selectedSlot.eligible
                ? selectedSlot.cautionFlags.length
                  ? '주의 후보'
                  : '추천 후보'
                : '추천 제외'
          }}
        </el-tag>
        <template v-if="selectedSlot.evaluation">
          <h4>구간 최저점의 감점 내역</h4>
          <p>
            평가 시각 {{ formatWalkTime(selectedSlot.evaluatedAt) }} · 강수는
            {{ formatWalkTime(selectedSlot.rainInterval.startTime) }}~{{
              formatWalkTime(selectedSlot.rainInterval.endTime)
            }}
            구간 예보를 적용했어요.
          </p>
          <dl class="walk-details">
            <div v-for="item in selectedSlot.deductions" :key="item.code">
              <dt>{{ item.label }}</dt>
              <dd>{{ formatMetric(item.points, '점 감점') }} · {{ item.detail }}</dd>
            </div>
          </dl>
          <small
            >항목과 총점의 표시 반올림으로 합계가 조금 다를 수 있어요. 위험 조건은 점수보다
            우선해요.</small
          >
          <p v-if="selectedSlot.score === 60 && selectedSlot.unroundedScore < 60">
            반올림 전 {{ selectedSlot.unroundedScore }}점으로 추천 기준 60점에 미달해요.
          </p>
        </template>
        <dl class="walk-details">
          <div>
            <dt>출발 · 종료</dt>
            <dd>
              {{ formatWalkTime(selectedSlot.time) }} ~ {{ formatWalkTime(selectedSlot.endTime) }}
            </dd>
          </div>
          <div>
            <dt>산책 구간 최저 점수</dt>
            <dd>{{ formatMetric(selectedSlot.score, '점') }}</dd>
          </div>
          <div>
            <dt>출발 이후 점수 변화</dt>
            <dd>
              {{
                selectedSlot.score === null
                  ? '정보 부족'
                  : selectedSlot.deterioration > 0
                    ? `${selectedSlot.deterioration}점 하락`
                    : '점수 하락 없음'
              }}
            </dd>
          </div>
          <div>
            <dt>출발 기온 · 체감온도</dt>
            <dd>
              {{ formatWeatherTemperature(selectedSlot.temp) }} ·
              {{ formatWeatherTemperature(selectedSlot.feelsLike) }}
            </dd>
          </div>
          <div>
            <dt>구간 최고 강수확률</dt>
            <dd>{{ formatMetric(selectedSlot.peakRainChance, '%') }}</dd>
          </div>
          <div>
            <dt>구간 최고 풍속</dt>
            <dd>{{ formatMetric(selectedSlot.peakWind, 'm/s') }}</dd>
          </div>
          <div>
            <dt>구간 최고 자외선 지수</dt>
            <dd>{{ formatMetric(selectedSlot.peakUv, '') }}</dd>
          </div>
          <div>
            <dt>구간 최고 대기질 지수</dt>
            <dd>{{ formatMetric(selectedSlot.peakAqi, ' AQI') }}</dd>
          </div>
        </dl>
        <div v-if="selectedSlot.blockedReasons.length" class="slot-reasons">
          <strong>추천에서 제외한 이유</strong>
          <el-space wrap>
            <el-tag v-for="reason in selectedSlot.blockedReasons" :key="reason" type="warning">
              {{ reason }}
            </el-tag>
          </el-space>
        </div>
      </div>
    </el-card>

    <el-alert
      v-if="petProfileStore.storageError || profileStatus"
      :title="petProfileStore.storageError || profileStatus"
      :type="petProfileStore.storageError ? 'warning' : 'success'"
      show-icon
      :closable="false"
    />

    <el-collapse v-model="profilePanels" class="profile-panel">
      <el-collapse-item name="profile">
        <template #title>
          <strong>🐶 강아지 프로필 {{ profileSaved ? '수정' : '등록' }}</strong>
        </template>
        <p class="plan-note">수정한 내용은 프로필을 저장하면 산책 추천에 반영돼요.</p>
        <el-form class="profile-form" label-position="top" @submit.prevent="saveProfile">
          <el-form-item label="이름">
            <el-input v-model.trim="draft.name" required maxlength="20" placeholder="예: 몽이" />
          </el-form-item>
          <el-form-item label="견종">
            <el-select
              v-model="draft.breedName"
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
            <el-input-number v-model="draft.age" :min="0" :max="30" controls-position="right" />
          </el-form-item>
          <el-form-item label="몸무게(kg)">
            <el-input-number
              v-model="draft.weight"
              :min="0.5"
              :max="120"
              :step="0.1"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="털 길이">
            <el-select v-model="draft.coatLength">
              <el-option label="짧음" value="short" />
              <el-option label="보통" value="medium" />
              <el-option label="김" value="long" />
            </el-select>
          </el-form-item>
          <el-form-item label="활동량">
            <el-select v-model="draft.activity">
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
              :disabled="!validDraft"
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
        <el-tag
          :type="
            progressStatus === 'success'
              ? 'success'
              : progressStatus === 'warning'
                ? 'warning'
                : 'danger'
          "
          effect="dark"
          round
        >
          {{ personalizedScore === null ? '정보 부족' : `맞춤 ${personalizedScore}점` }}
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
          <small>설정에 맞는 추천 출발 시간</small>
          <strong v-if="walkPlan.bestTime && walkPlan.bestTimeScore >= 60">
            {{ formatWalkTime(walkPlan.bestTime) }}
          </strong>
          <strong v-else>조건에 맞는 시간 없음</strong>
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.walk-settings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 14px;
  margin-top: 12px;
}

.walk-settings :deep(.el-select) {
  width: 100%;
}

.custom-time-window {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
}

.custom-time-window label,
.slot-picker {
  display: grid;
  min-width: 0;
  gap: 8px;
  color: #42594b;
  font-size: 13px;
}

.custom-time-window small {
  grid-column: 1 / -1;
}

.custom-time-window input,
.slot-picker select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 44px;
  padding: 8px 10px;
  border: 1px solid #bfcfc3;
  border-radius: 8px;
  color: #34483e;
  background: #fff;
  font: inherit;
}

.custom-time-window input:focus-visible,
.slot-picker select:focus-visible {
  outline: 3px solid #19724e;
  outline-offset: 2px;
}

.walk-method,
.start-time-groups p {
  color: #5f7067;
  font-size: 12px;
  line-height: 1.6;
}

.walk-method {
  margin: 8px 0 16px;
}

.start-time-groups {
  display: grid;
  gap: 8px;
  margin: 16px 0;
}

.start-time-groups p {
  margin: 0;
}

.start-time-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border: 1px solid #cfe1d3;
  border-radius: 10px;
  color: #315a48;
  background: #f2f8f1;
  font-size: 13px;
}

.start-time-group span {
  color: #5f7067;
}

.slot-detail {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #dce8de;
  border-radius: 12px;
  background: #f8fbf7;
}

.slot-detail > .el-tag {
  justify-self: start;
}

.walk-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
  font-size: 13px;
}

.walk-details > div:first-child {
  grid-column: 1 / -1;
}

.walk-details dt {
  color: #5f7067;
  font-size: 12px;
}

.walk-details dd {
  margin: 6px 0 0;
  color: #34483e;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.slot-reasons {
  display: grid;
  gap: 8px;
  font-size: 13px;
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
  color: #896015;
}

.chart-legend .excluded {
  color: #596e60;
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

  .profile-form,
  .walk-settings {
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
