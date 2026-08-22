<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Location } from '@element-plus/icons-vue'
import PetPlacesMap from '@/components/PetPlacesMap.vue'
import DogWalkGuide from '@/components/practices/handson/weather-components/DogWalkGuide.vue'
import { calculatePetWalkIndex, getPetCareTips } from '@/services/petWeather.js'
import { getWeatherDetail, getWeatherList } from '@/services/weatherApi.js'

const route = useRoute()
const router = useRouter()
const cities = ref([])
const city = ref(null)
const selectedCityId = ref(String(route.query.city || 'city_01'))
const loading = ref(true)
const errorMessage = ref('')

const cityOptions = computed(() => {
  const options = city.value ? [city.value, ...cities.value] : cities.value
  return options.filter((item, index) => options.findIndex(({ id }) => id === item.id) === index)
})
const score = computed(() => (city.value ? calculatePetWalkIndex(city.value) : 0))
const careTips = computed(() => (city.value ? getPetCareTips(city.value) : []))

const loadDetail = async (cityId) => {
  loading.value = true
  errorMessage.value = ''
  try {
    city.value = await getWeatherDetail(cityId)
    router.replace({ name: 'dog-walk', query: { city: cityId } })
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '맞춤 산책 날씨를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

watch(selectedCityId, loadDetail, { immediate: true })
onMounted(async () => {
  try {
    cities.value = await getWeatherList()
  } catch {
    // 상세 날씨를 불러왔다면 맞춤 가이드는 계속 사용할 수 있다.
  }
})
</script>

<template>
  <main class="dog-page">
    <header class="dog-page-hero">
      <div>
        <el-tag effect="light" round>🐾 DOG WALK</el-tag>
        <h1>우리 강아지에게 맞는<br /><span>오늘의 한 바퀴</span></h1>
        <p>견종과 생활 패턴, 실시간 날씨를 함께 살펴 안전하고 즐거운 산책을 준비해요.</p>
      </div>
      <div class="route-art" aria-hidden="true">
        <span>HOME</span><i></i><strong>🐕</strong><i></i><span>PARK</span>
      </div>
      <div class="dog-page-actions">
        <el-select v-model="selectedCityId" filterable aria-label="산책 지역 선택">
          <template #prefix
            ><el-icon><Location /></el-icon
          ></template>
          <el-option
            v-for="option in cityOptions"
            :key="option.id"
            :label="`${option.name} · ${option.status}`"
            :value="option.id"
          />
        </el-select>
        <RouterLink to="/tips">
          <el-button plain
            >안전 가이드 <el-icon><ArrowRight /></el-icon
          ></el-button>
        </RouterLink>
      </div>
    </header>

    <el-skeleton v-if="loading" :rows="8" animated />
    <el-alert
      v-else-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />
    <DogWalkGuide v-else-if="city" :city="city" :score="score" :care-tips="careTips" />

    <PetPlacesMap />
  </main>
</template>

<style scoped>
.dog-page {
  display: grid;
  gap: 24px;
}

.dog-page-hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 28px;
  padding: 42px;
  overflow: hidden;
  border: 1px solid #dce9e1;
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 18px 50px rgb(29 82 57 / 7%);
}

h1,
p {
  margin: 0;
}

h1 {
  margin: 16px 0 12px;
  color: var(--app-ink);
  font-size: clamp(38px, 6vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.06em;
}

h1 span {
  color: #19724e;
}

p {
  max-width: 600px;
  color: var(--app-muted);
}

.route-art {
  display: flex;
  align-items: center;
  align-self: center;
  gap: 10px;
  width: min(360px, 30vw);
  padding: 22px;
  border-radius: 22px;
  color: #19724e;
  background: #eff8f2;
}

.route-art i {
  flex: 1;
  border-top: 2px dashed #8ab8a0;
}

.route-art span {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.route-art strong {
  font-size: 30px;
}

.dog-page-actions {
  display: flex;
  grid-column: 1 / -1;
  gap: 10px;
}

.dog-page-actions .el-select {
  width: min(100%, 360px);
}

@media (max-width: 760px) {
  .dog-page-hero {
    grid-template-columns: 1fr;
    padding: 28px 22px;
    border-radius: 22px;
  }

  .route-art {
    width: 100%;
  }

  .dog-page-actions {
    display: grid;
  }

  .dog-page-actions .el-select,
  .dog-page-actions a,
  .dog-page-actions .el-button {
    width: 100%;
  }
}
</style>
