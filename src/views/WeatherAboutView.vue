<template>
  <section class="page-card">
    <h2>ℹ️ 서비스 소개</h2>
    <p>
      Vue 3와 Vue Router로 만든 실습용 날씨 대시보드입니다. 지역별 현재 날씨와 외출 및
      반려견 산책 정보를 한눈에 확인할 수 있습니다.
    </p>
    <RouterLink class="button-link" to="/">메인 대시보드로 돌아가기</RouterLink>
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

.button-link {
  display: inline-block;
  padding: 9px 14px;
  margin-top: 12px;
  border-radius: 8px;
  background: #315ea8;
  color: #fff;
}
</style>
