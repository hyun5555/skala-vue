<template>
  <section class="not-found">
    <div class="icon">☀️❓</div>
    <h2>페이지를 찾을 수 없습니다.</h2>
    <p>요청한 주소가 존재하지 않습니다.</p>
    <RouterLink to="/">날씨 메인으로 이동</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  padding: 60px 24px;
  border-radius: 12px;
  background: #fff;
  text-align: center;
}

.icon {
  font-size: 64px;
}

a {
  display: inline-block;
  padding: 9px 14px;
  margin-top: 12px;
  border-radius: 8px;
  background: #315ea8;
  color: #fff;
}
</style>
