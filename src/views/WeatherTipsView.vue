<script setup>
const riskGuides = [
  {
    icon: '☀️',
    title: '고온·노면',
    text: '한낮을 피하고 손등으로 노면 열기를 확인한 뒤 그늘 위주로 걸어요.',
  },
  { icon: '❄️', title: '한파', text: '짧게 걷고 소형견·단모종은 보온과 발 보호를 준비해요.' },
  {
    icon: '🌧️',
    title: '비·눈',
    text: '미끄러운 길을 피하고 귀가 후 발가락 사이와 털을 완전히 말려요.',
  },
  {
    icon: '😷',
    title: '미세먼지',
    text: '대기질이 나쁘면 배변 산책만 짧게 하고 실내 노즈워크로 대체해요.',
  },
  {
    icon: '💧',
    title: '높은 습도',
    text: '헐떡임이 심해지지 않는지 살피고 물과 충분한 휴식을 제공해요.',
  },
  {
    icon: '💨',
    title: '강풍',
    text: '낙하물과 날리는 이물질을 피해 건물 안쪽의 짧은 동선을 선택해요.',
  },
]

const checklist = [
  ['출발 전', '날씨·노면·대기질과 반려견의 컨디션을 확인해요.'],
  ['산책 중', '물, 배변 봉투, 리드줄을 챙기고 호흡과 걸음 속도를 살펴요.'],
  ['귀가 후', '발바닥과 피부를 확인하고 물을 마신 뒤 충분히 쉬게 해요.'],
]
</script>

<template>
  <main class="safety-page">
    <header class="page-hero">
      <div>
        <el-tag effect="light" round>WALK SAFETY</el-tag>
        <h1>안전한 한 바퀴를 위한<br /><span>산책 가이드</span></h1>
        <p>홈 대시보드에서 분리한 날씨 위험 정보와 산책 전후 체크리스트를 모았어요.</p>
      </div>
      <span class="hero-dog" aria-hidden="true">🦮</span>
    </header>

    <section>
      <div class="section-heading">
        <span>01</span>
        <div>
          <small>WEATHER RISKS</small>
          <h2>날씨별 행동 요령</h2>
        </div>
      </div>
      <div class="risk-grid">
        <el-card v-for="guide in riskGuides" :key="guide.title" shadow="never">
          <span class="risk-icon">{{ guide.icon }}</span>
          <h3>{{ guide.title }}</h3>
          <p>{{ guide.text }}</p>
        </el-card>
      </div>
    </section>

    <section class="check-section">
      <div class="section-heading">
        <span>02</span>
        <div>
          <small>WALK ROUTINE</small>
          <h2>산책 전·중·후 체크</h2>
        </div>
      </div>
      <el-timeline>
        <el-timeline-item
          v-for="([title, text], index) in checklist"
          :key="title"
          :timestamp="title"
          :type="index === 1 ? 'success' : 'primary'"
        >
          {{ text }}
        </el-timeline-item>
      </el-timeline>
      <el-alert
        title="산책 지수는 생활 편의를 위한 참고 정보이며 의료 진단을 대신하지 않습니다. 기저질환이나 이상 증상이 있으면 수의사의 조언을 우선해 주세요."
        type="info"
        show-icon
        :closable="false"
      />
      <RouterLink to="/dog-walk"
        ><el-button type="primary">맞춤 산책 플랜 보기</el-button></RouterLink
      >
    </section>
  </main>
</template>

<style scoped>
.safety-page {
  display: grid;
  gap: 48px;
}

.page-hero,
.check-section {
  padding: 42px;
  border: 1px solid #dce9e1;
  border-radius: 30px;
  background: #fff;
}

.page-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  margin: 16px 0 12px;
  font-size: clamp(38px, 6vw, 62px);
  line-height: 1.05;
  letter-spacing: -0.06em;
}

h1 span {
  color: #19724e;
}

p {
  color: var(--app-muted);
  line-height: 1.7;
}

.hero-dog {
  display: grid;
  width: 160px;
  aspect-ratio: 1;
  flex: none;
  border-radius: 50%;
  background: #edf8f1;
  font-size: 72px;
  place-items: center;
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.section-heading > span {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: #fff;
  background: #19724e;
  font-size: 12px;
  font-weight: 800;
  place-items: center;
}

.section-heading small {
  color: #799086;
  font-size: 10px;
  letter-spacing: 0.12em;
}

.section-heading h2 {
  font-size: 26px;
  letter-spacing: -0.04em;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.risk-grid .el-card {
  border-color: #e1ebe5;
}

.risk-icon {
  display: grid;
  width: 48px;
  height: 48px;
  margin-bottom: 20px;
  border-radius: 15px;
  background: #eff8f2;
  font-size: 24px;
  place-items: center;
}

.risk-grid h3 {
  margin-bottom: 8px;
}

.check-section .el-button {
  margin-top: 18px;
}

@media (max-width: 760px) {
  .safety-page {
    gap: 32px;
  }

  .page-hero,
  .check-section {
    padding: 26px 22px;
    border-radius: 22px;
  }

  .hero-dog {
    display: none;
  }

  .risk-grid {
    grid-template-columns: 1fr;
  }
}
</style>
