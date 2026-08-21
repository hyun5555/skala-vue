<template>
  <div class="app-shell">
    <header>
      <h1>🌤️ Weather Router</h1>
      <nav aria-label="주요 메뉴">
        <RouterLink to="/">날씨 대시보드</RouterLink>
        <RouterLink to="/about">서비스 소개</RouterLink>
        <RouterLink to="/tips">날씨 생활 팁</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
@import '@/assets/exercise.css';

#app {
  display: block;
  width: 100%;
}

.app-shell {
  width: min(1100px, calc(100vw - 4rem));
  margin: 40px auto;
  color: #25324a;
}

.app-shell header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  margin-bottom: 22px;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 20px rgb(0 0 0 / 6%);
}

.app-shell h1 {
  margin: 0;
  font-size: 24px;
}

.app-shell nav {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.app-shell nav a {
  padding: 7px 10px;
  border-radius: 8px;
  color: #64748b;
}

.app-shell nav a.router-link-exact-active {
  background: #eaf2ff;
  color: #315ea8;
  font-weight: 700;
}

@media (max-width: 700px) {
  .app-shell {
    width: min(100% - 24px, 1100px);
    margin: 16px auto;
  }

  .app-shell header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
