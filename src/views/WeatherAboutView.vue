<script setup>
const dataSources = [
  {
    name: 'OpenWeatherMap',
    role: '현재 기온·체감온도·습도·풍속 관측 정보',
    url: 'https://openweathermap.org/api/current',
  },
  {
    name: 'OpenWeatherMap 5 Day',
    role: '5일 동안 3시간 간격으로 제공되는 기상 예보',
    url: 'https://openweathermap.org/api/forecast5',
  },
  {
    name: 'Open-Meteo Forecast',
    role: '추천 산책 시간 계산에 사용하는 시간별 기상 예보',
    url: 'https://open-meteo.com/en/docs',
  },
  {
    name: 'Open-Meteo · CAMS Air Quality',
    role: 'AQI·PM2.5·UV 등 시간별 대기질 예측 정보',
    url: 'https://open-meteo.com/en/docs/air-quality-api',
  },
  {
    name: 'Kakao Local REST API',
    role: '현재 위치 반경 2km의 반려동물 동반 장소 키워드 검색',
    url: 'https://developers.kakao.com/docs/ko/local/dev-guide',
  },
  {
    name: 'The Dog API breeds list',
    role: '견종 이름·그룹·체중 정보가 담긴 GitHub Gist 데이터',
    url: 'https://gist.github.com/arturschaefer/abf8f94bcff14ace1b88c7977d651a74',
  },
]

const features = [
  ['01', '지역 날씨', '전국 지역을 검색하고 실제 관측값과 5일 예보를 확인해요.'],
  ['02', '강아지 맞춤', '견종·나이·체중·털 길이·활동량을 반영한 산책 플랜을 만들어요.'],
  ['03', '안전 가이드', '고온, 노면, 비, 바람, 대기질 위험과 행동 요령을 정리해요.'],
  ['04', '주변 장소', '현재 위치와 가까운 펫 프렌들리 카페·식당을 거리순으로 찾아요.'],
]
</script>

<template>
  <main class="about-page">
    <header class="about-hero">
      <div>
        <el-tag effect="light" round>SKALA VUE PRACTICE</el-tag>
        <h1>날씨를 읽고,<br /><span>더 좋은 산책을 만들어요.</span></h1>
        <p>
          <strong>walkie</strong>는 SKALA Vue 실습 과정에서 만든 반려견 산책 날씨 서비스입니다. 여러
          외부 API를 Vue의 컴포넌트·라우터·상태 관리와 연결해 실제 생활 문제를 해결하는 것을 목표로
          했습니다.
        </p>
      </div>
      <div class="project-card">
        <span>PROJECT</span>
        <strong>SKALA<br />VUE</strong>
        <small>Weather for every walk</small>
      </div>
    </header>

    <section>
      <div class="section-title">
        <small>WHAT IT DOES</small>
        <h2>서비스 기능</h2>
      </div>
      <div class="feature-grid">
        <el-card v-for="[number, title, text] in features" :key="number" shadow="never">
          <span>{{ number }}</span>
          <h3>{{ title }}</h3>
          <p>{{ text }}</p>
        </el-card>
      </div>
    </section>

    <section class="source-section">
      <div class="section-title">
        <small>DATA &amp; API</small>
        <h2>API와 데이터 출처</h2>
      </div>
      <div class="source-list">
        <a
          v-for="source in dataSources"
          :key="source.name"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div>
            <strong>{{ source.name }}</strong>
            <p>{{ source.role }}</p>
          </div>
          <span>↗</span>
        </a>
      </div>
      <el-alert
        title="Open-Meteo 대기질 데이터는 CAMS의 유럽·전지구 대기질 예측 자료를 기반으로 합니다. 장소 동반 가능 여부와 산책 권장안은 참고 정보이므로 방문 전 매장 확인과 개별 건강 상태 확인이 필요합니다."
        type="info"
        show-icon
        :closable="false"
      />
    </section>

    <section class="stack-section">
      <div>
        <small>BUILT WITH</small>
        <h2>Vue로 연결한 기술</h2>
      </div>
      <el-space wrap>
        <el-tag
          v-for="item in ['Vue 3', 'Vue Router', 'Pinia', 'Axios', 'Element Plus', 'Node.js']"
          :key="item"
          size="large"
          effect="plain"
          >{{ item }}</el-tag
        >
      </el-space>
      <RouterLink to="/"><el-button type="primary">오늘 날씨 확인하기</el-button></RouterLink>
    </section>
  </main>
</template>

<style scoped>
.about-page {
  display: grid;
  gap: 52px;
}

.about-hero,
.source-section,
.stack-section {
  padding: 42px;
  border: 1px solid #dce9e1;
  border-radius: 30px;
  background: #fff;
}

.about-hero {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 40px;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  margin: 18px 0 16px;
  font-size: clamp(40px, 6vw, 68px);
  line-height: 1.04;
  letter-spacing: -0.065em;
}

h1 span {
  color: #19724e;
}

.about-hero p {
  max-width: 700px;
  color: var(--app-muted);
  line-height: 1.8;
}

.project-card {
  display: grid;
  align-content: space-between;
  min-height: 270px;
  padding: 26px;
  border-radius: 24px;
  color: #fff;
  background: #19724e;
}

.project-card span,
.project-card small {
  color: rgb(255 255 255 / 65%);
  font-size: 10px;
  letter-spacing: 0.12em;
}

.project-card strong {
  font-size: 50px;
  line-height: 0.88;
  letter-spacing: -0.07em;
}

.section-title {
  margin-bottom: 20px;
}

.section-title small,
.stack-section small {
  color: #19724e;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.14em;
}

.section-title h2,
.stack-section h2 {
  font-size: 28px;
  letter-spacing: -0.04em;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.feature-grid .el-card {
  border-color: #e0ebe4;
}

.feature-grid span {
  color: #19724e;
  font-size: 11px;
  font-weight: 800;
}

.feature-grid h3 {
  margin: 22px 0 8px;
}

.feature-grid p,
.source-list p {
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.7;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}

.source-list a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px;
  border: 1px solid #e0ebe4;
  border-radius: 16px;
  transition: 0.2s ease;
}

.source-list a:hover {
  border-color: #71a789;
  background: #f4faf6;
}

.source-list a > span {
  color: #19724e;
  font-size: 20px;
}

.stack-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

@media (max-width: 860px) {
  .about-hero {
    grid-template-columns: 1fr;
  }

  .project-card {
    min-height: 220px;
  }

  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .about-page {
    gap: 34px;
  }

  .about-hero,
  .source-section,
  .stack-section {
    padding: 26px 22px;
    border-radius: 22px;
  }

  .feature-grid,
  .source-list {
    grid-template-columns: 1fr;
  }

  .stack-section {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
