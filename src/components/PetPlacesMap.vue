<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight, LocationFilled, Position } from '@element-plus/icons-vue'
import { getNearbyPetPlaces } from '@/services/weatherApi.js'

const places = ref([])
const loading = ref(false)
const hasSearched = ref(false)
const errorMessage = ref('')
const placeSlider = ref(null)

const slidePlaces = (direction) => {
  const slider = placeSlider.value
  const card = slider?.firstElementChild
  if (!card) return
  slider.scrollBy({ left: direction * (card.clientWidth + 12), behavior: 'smooth' })
}

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error('이 브라우저는 위치 기능을 지원하지 않습니다.'))
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    })
  })

const showPlaces = async () => {
  hasSearched.value = true
  loading.value = true
  errorMessage.value = ''
  try {
    const position = await getCurrentPosition()
    places.value = await getNearbyPetPlaces(position.coords.latitude, position.coords.longitude)
  } catch (error) {
    errorMessage.value =
      error.code === 1
        ? '현재 위치 권한이 필요합니다. 브라우저 설정에서 위치 접근을 허용해 주세요.'
        : (error.response?.data?.message ?? error.message)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="places-section">
    <div class="places-heading">
      <div class="heading-copy">
        <span class="section-number">04</span>
        <div>
          <small>산책 후 들를 곳</small>
          <h2>내 주변 펫 프렌들리 스팟</h2>
          <p>Kakao 장소 검색으로 현재 위치 반경 2km의 동반 카페·식당을 가까운 순으로 찾아요.</p>
          <p>
            버튼을 누르면 현재 위치를 Kakao 장소 검색에 사용합니다. 위치는 앱에 저장하지 않습니다.
          </p>
        </div>
      </div>
      <div class="heading-actions">
        <el-button type="primary" round :loading="loading" @click="showPlaces">
          <el-icon><Position /></el-icon> 내 위치로 찾기
        </el-button>
        <el-button-group v-if="places.length > 1" class="slider-controls">
          <el-button aria-label="이전 장소" @click="slidePlaces(-1)">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button aria-label="다음 장소" @click="slidePlaces(1)">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" />
    <el-skeleton v-else-if="loading" :rows="3" animated />

    <div
      v-else-if="places.length"
      ref="placeSlider"
      class="place-list"
      tabindex="0"
      aria-label="가까운 펫 프렌들리 장소 슬라이더"
    >
      <el-card
        v-for="(place, index) in places"
        :key="place.id"
        class="place-item"
        :class="{ nearest: index === 0 }"
        shadow="hover"
      >
        <div class="place-title">
          <span class="place-icon"
            ><el-icon><LocationFilled /></el-icon
          ></span>
          <el-tag v-if="index === 0" size="small" effect="dark" round>가장 가까움</el-tag>
        </div>
        <strong class="place-name">{{ place.place_name }}</strong>
        <p>{{ place.road_address_name || place.address_name }}</p>
        <div class="place-actions">
          <strong class="distance">
            {{
              Number(place.distance) >= 1000
                ? `${(place.distance / 1000).toFixed(1)}km`
                : `${place.distance}m`
            }}
          </strong>
          <el-link
            :href="place.place_url"
            :disabled="!place.place_url"
            type="primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            장소 보기 <el-icon><ArrowRight /></el-icon>
          </el-link>
        </div>
      </el-card>
    </div>
    <el-empty
      v-else-if="!errorMessage"
      :description="
        hasSearched ? '주변 검색 결과가 없습니다.' : '내 위치로 찾기를 눌러 주변 장소를 확인하세요.'
      "
      :image-size="88"
    />

    <el-alert
      class="notice"
      title="동반 가능 여부와 이용 조건은 방문 전 매장에 확인해 주세요."
      type="info"
      show-icon
      :closable="false"
    />
  </section>
</template>

<style scoped>
.places-section {
  padding: 34px;
  overflow: hidden;
  border: 1px solid #dce9e1;
  border-radius: 30px;
  color: var(--app-ink);
  background: #fff;
}

.places-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 26px;
}

.heading-copy {
  display: flex;
  align-items: center;
  gap: 14px;
}

.heading-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-controls :deep(.el-button) {
  color: #19724e;
  border-color: #cbded2;
  background: #f3f9f5;
}

.section-number {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  border-radius: 50%;
  color: #fff;
  background: #19724e;
  font-size: 12px;
  font-weight: 900;
  place-items: center;
}

h2,
p {
  margin: 0;
}

h2 {
  margin: 1px 0 3px;
  font-size: clamp(22px, 3vw, 30px);
  letter-spacing: -0.045em;
}

.places-heading small,
.places-heading p {
  color: var(--app-muted);
}

.places-heading small {
  font-size: 11px;
}

.places-heading p,
.place-item p {
  font-size: 12px;
}

.place-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.place-list::-webkit-scrollbar {
  display: none;
}

.place-item {
  min-width: 0;
  flex: 0 0 calc((100% - 36px) / 4);
  color: var(--app-ink);
  border: 0;
  background: #f9fbfa;
  scroll-snap-align: start;
  transition: 0.2s ease;
}

.place-item:hover {
  transform: translateY(-3px);
}

.place-item.nearest {
  background: #eff8e3;
}

.place-title,
.place-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.place-icon {
  display: grid;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  color: #1f6b4f;
  background: #edf4f0;
  font-size: 18px;
  place-items: center;
}

.place-name {
  display: block;
  margin-top: 18px;
  font-size: 18px;
  letter-spacing: -0.03em;
}

.place-item p {
  min-height: 40px;
  margin: 7px 0 18px;
  color: #78867e;
}

.distance {
  color: #1f6b4f;
  font-size: 18px;
}

.notice {
  margin-top: 14px;
  border-color: #dfeae3;
  background: #f2f8f4;
}

.notice :deep(.el-alert__title),
.notice :deep(.el-alert__icon) {
  color: #5f786b;
}

@media (max-width: 1100px) {
  .place-item {
    flex-basis: calc((100% - 24px) / 3);
  }
}

@media (max-width: 800px) {
  .place-item {
    flex-basis: calc((100% - 12px) / 2);
  }
}

@media (max-width: 640px) {
  .places-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .places-section {
    padding: 24px 20px;
    border-radius: 22px;
  }

  .heading-actions {
    justify-content: space-between;
  }

  .place-item {
    flex-basis: 88%;
  }
}
</style>
