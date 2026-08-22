<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { calculatePetWalkIndex, getPetCareTips, getPetWalkGuide } from '@/services/petWeather.js'
import { getWeatherDetail } from '@/services/weatherApi.js'
import { useConfigStore } from '@/stores/configStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'

const route = useRoute()
const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()
const city = ref(null)
const loading = ref(true)
const errorMessage = ref('')

const petWalkIndex = computed(() => (city.value ? calculatePetWalkIndex(city.value) : null))
const petCareTips = computed(() => (city.value ? getPetCareTips(city.value) : []))
const walkProgressStatus = computed(() => {
  if (petWalkIndex.value >= 80) return 'success'
  if (petWalkIndex.value >= 60) return 'warning'
  return 'exception'
})

const loadWeather = async () => {
  loading.value = true
  errorMessage.value = ''
  city.value = null
  try {
    city.value = await getWeatherDetail(route.params.cityId)
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '상세 날씨를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.cityId, loadWeather, { immediate: true })
</script>

<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="page-heading">
        <h2>📊 지역별 상세 기상관측 정보</h2>
        <RouterLink to="/"><el-button>← 대시보드</el-button></RouterLink>
      </div>
    </template>

    <el-skeleton v-if="loading" :rows="8" animated aria-live="polite" />

    <template v-else-if="city">
      <section class="weather-detail">
        <span class="weather-icon">{{ city.emoji }}</span>
        <div class="city-heading">
          <el-tag effect="dark">{{ city.status }}</el-tag>
          <h3>{{ city.name }}</h3>
          <p>반려동물과 함께 나가기 전 최신 관측값을 확인하세요.</p>
        </div>
        <el-button
          plain
          :aria-pressed="favoriteStore.favoriteCityIds.includes(route.params.cityId)"
          @click="favoriteStore.toggleFavorite(route.params.cityId)"
        >
          {{
            favoriteStore.favoriteCityIds.includes(route.params.cityId)
              ? '★ 관심 도시 해제'
              : '☆ 관심 도시 등록'
          }}
        </el-button>
      </section>

      <el-row :gutter="12" class="weather-stats">
        <el-col :xs="12" :sm="6">
          <el-card shadow="never">
            <el-statistic
              title="현재 기온"
              :value="configStore.unit === 'fahrenheit' ? (city.temp * 9) / 5 + 32 : city.temp"
              :precision="configStore.temperaturePrecision"
              :suffix="configStore.unitSymbol"
            />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card shadow="never">
            <el-statistic
              title="체감온도"
              :value="
                configStore.unit === 'fahrenheit' ? (city.feelsLike * 9) / 5 + 32 : city.feelsLike
              "
              :precision="configStore.temperaturePrecision"
              :suffix="configStore.unitSymbol"
            />
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card shadow="never"
            ><el-statistic title="습도" :value="city.humidity" suffix="%"
          /></el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card shadow="never"
            ><el-statistic title="풍속" :value="city.wind" suffix="m/s"
          /></el-card>
        </el-col>
      </el-row>

      <el-alert
        v-if="city.airQuality"
        :title="`대기질 AQI ${Math.round(city.airQuality.us_aqi)} · PM2.5 ${Math.round(city.airQuality.pm2_5)}㎍/㎥`"
        type="info"
        show-icon
        :closable="false"
      />

      <el-card class="pet-report" shadow="never">
        <div class="report-heading">
          <div>
            <h3>🐕 오늘의 반려동물 산책 리포트</h3>
            <p>{{ getPetWalkGuide(petWalkIndex) }}</p>
          </div>
          <el-progress
            type="circle"
            :percentage="petWalkIndex"
            :status="walkProgressStatus"
            :width="112"
            :stroke-width="9"
          >
            <template #default="{ percentage }">
              <span class="progress-score">
                <strong>{{ percentage }}</strong>
                <small>점</small>
              </span>
            </template>
          </el-progress>
        </div>
        <el-space wrap>
          <el-tag v-for="tip in petCareTips" :key="tip" type="success" effect="light">
            {{ tip }}
          </el-tag>
        </el-space>
      </el-card>

      <section class="forecast">
        <h3>🗓️ OpenWeatherMap 5일 예보</h3>
        <div class="forecast-grid">
          <el-card v-for="day in city.forecast" :key="day.date" shadow="hover">
            <strong>{{ day.date.slice(5).replace('-', '/') }}</strong>
            <span>{{ day.emoji }}</span>
            <span>{{ configStore.formatTemperature(day.temp) }}</span>
            <small>{{ day.status }} · 강수 {{ day.rainChance }}%</small>
          </el-card>
        </div>
      </section>
    </template>

    <el-result v-else icon="error" title="날씨를 불러오지 못했습니다" :sub-title="errorMessage">
      <template #extra
        ><el-button type="primary" @click="loadWeather">다시 시도</el-button></template
      >
    </el-result>
  </el-card>
</template>

<style scoped>
.page-card {
  border: 0;
  box-shadow: 0 20px 50px rgb(29 61 46 / 8%);
}

.page-heading,
.weather-detail,
.report-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

h2,
h3,
p {
  margin: 0;
}

.weather-detail {
  justify-content: flex-start;
  padding: 20px;
  border-radius: 16px;
  color: var(--app-ink);
  border: 1px solid #dce9e1;
  background: #f0f8f3;
}

.city-heading {
  flex: 1;
}

.city-heading h3 {
  margin: 6px 0 2px;
  font-size: 26px;
}

.city-heading p,
small {
  color: #7b8a82;
}

.weather-detail .city-heading p {
  color: #667e72;
}

.weather-icon {
  font-size: 64px;
}

.weather-stats {
  margin-top: 14px;
  margin-bottom: 14px;
}

.weather-stats .el-card {
  margin-bottom: 12px;
  text-align: center;
}

.pet-report,
.forecast {
  margin-top: 16px;
}

.pet-report {
  border-color: #dce6dc;
  background: #f3f7f1;
}

.report-heading {
  margin-bottom: 12px;
}

.progress-score strong,
.progress-score small {
  display: block;
  text-align: center;
}

.progress-score strong {
  color: var(--app-ink);
  font-size: 26px;
  line-height: 1;
}

.progress-score small {
  margin-top: 4px;
  color: #718078;
  font-size: 11px;
}

.pet-report :deep(.el-progress-circle__track) {
  stroke: #dfe8e1;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.forecast .el-card {
  display: grid;
  gap: 5px;
  text-align: center;
}

.forecast .el-card :deep(.el-card__body) {
  display: grid;
  gap: 6px;
}

.forecast .el-card span:first-of-type {
  font-size: 28px;
}

.forecast small {
  color: #64748b;
}

@media (max-width: 640px) {
  .weather-detail,
  .report-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .weather-icon {
    font-size: 48px;
  }

  .report-heading .el-progress {
    align-self: center;
  }
}
</style>
