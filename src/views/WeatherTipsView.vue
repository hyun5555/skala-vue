<template>
  <section class="page-card">
    <h2>💡 날씨 생활 팁</h2>
    <ul>
      <li>기온이 높을 때는 물과 선크림을 챙기세요.</li>
      <li>비나 눈이 예보되면 우산과 미끄럼 방지 신발을 준비하세요.</li>
      <li>풍속이 높은 날에는 야외 활동 시간을 줄이세요.</li>
    </ul>
    <RouterLink class="button-link" to="/">날씨 확인하기</RouterLink>
  </section>
</template>

<style scoped>
.page-card {
  padding: 24px;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  background: #fff;
}

h2 {
  margin-top: 0;
}

li {
  margin: 8px 0;
}

.button-link {
  display: inline-block;
  padding: 9px 14px;
  margin-top: 12px;
  border-radius: 8px;
  background: #315ea8;
  color: #fff;
}
</style>
