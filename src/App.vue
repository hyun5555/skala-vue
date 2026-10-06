<script setup>
import { computed } from 'vue'
import { Compass, House, InfoFilled, Sunny } from '@element-plus/icons-vue'
import UnitToggler from '@/components/UnitToggler.vue'
import { useConfigStore } from '@/stores/configStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'

const configStore = useConfigStore()
const favoriteStore = useFavoriteStore()
const storageMessage = computed(() =>
  [...new Set([configStore.storageError, favoriteStore.storageError].filter(Boolean))].join(' '),
)
const dismissStorageMessage = () => {
  configStore.clearStorageError()
  favoriteStore.clearStorageError()
}

const navItems = [
  { to: '/', label: '오늘 날씨', icon: House },
  { to: '/dog-walk', label: '강아지 산책', icon: Compass },
  { to: '/tips', label: '안전 가이드', icon: Sunny },
  { to: '/about', label: '서비스 소개', icon: InfoFilled },
]
</script>

<template>
  <el-container class="app-shell">
    <el-header class="app-header" height="auto">
      <div class="header-inner">
        <RouterLink class="brand" to="/" aria-label="펫웨더 홈">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <ellipse cx="6" cy="7" rx="2.2" ry="3" />
              <ellipse cx="11" cy="4.8" rx="2.2" ry="3" />
              <ellipse cx="16" cy="6" rx="2.2" ry="3" />
              <ellipse cx="19" cy="10.5" rx="2.1" ry="2.8" />
              <path
                d="M12.5 9.1c-3.7 0-7.2 3.7-7.2 7.2 0 2.3 1.8 3.5 3.8 3.5 1.3 0 2.2-.7 3.4-.7 1.1 0 2 .7 3.3.7 2 0 3.8-1.2 3.8-3.5 0-3.5-3.4-7.2-7.1-7.2Z"
              />
            </svg>
          </span>
          <span class="brand-copy">
            <strong>walkie</strong>
            <small>weather for every walk</small>
          </span>
        </RouterLink>

        <nav class="desktop-nav" aria-label="주요 메뉴">
          <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
            <el-icon><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </RouterLink>
        </nav>

        <UnitToggler />
      </div>
    </el-header>

    <el-main class="app-main">
      <el-alert
        v-if="storageMessage"
        class="storage-notice"
        :title="storageMessage"
        type="warning"
        show-icon
        @close="dismissStorageMessage"
      />
      <RouterView v-slot="{ Component }">
        <KeepAlive include="WeatherHomeView">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </el-main>

    <nav class="mobile-nav" aria-label="모바일 주요 메뉴">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <el-backtop :right="20" :bottom="92" />
  </el-container>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  z-index: 20;
  top: 0;
  padding: 0;
  border-bottom: 1px solid rgb(37 72 55 / 8%);
  background: rgb(255 255 255 / 92%);
  backdrop-filter: blur(20px);
}

.header-inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: min(1280px, calc(100% - 48px));
  min-height: 76px;
  margin: auto;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  width: max-content;
}

.brand-mark {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 50% 50% 46% 54%;
  color: #fff;
  background: #19724e;
  box-shadow: 0 8px 20px rgb(31 107 79 / 20%);
  font-size: 20px;
  place-items: center;
}

.brand-mark svg {
  width: 24px;
  height: 24px;
  fill: currentcolor;
}

.brand-copy strong,
.brand-copy small {
  display: block;
}

.brand-copy strong {
  color: #17392c;
  font-size: 21px;
  letter-spacing: -0.04em;
}

.brand-copy small {
  color: #829087;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.desktop-nav {
  display: flex;
  gap: 4px;
  padding: 5px;
  border: 1px solid #e1e8df;
  border-radius: 999px;
  background: #fff;
}

.desktop-nav a {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  color: #69776f;
  font-size: 13px;
  font-weight: 700;
  transition: 0.2s ease;
}

.desktop-nav a:hover,
.desktop-nav a.router-link-exact-active {
  color: #fff;
  background: #1f6b4f;
}

.header-inner > :deep(.unit-toggler) {
  justify-self: end;
}

.app-main {
  width: min(1220px, calc(100% - 48px));
  margin: 0 auto;
  padding: 30px 0 72px;
  overflow: visible;
}

.storage-notice {
  margin-bottom: 18px;
}

.mobile-nav {
  display: none;
}

@media (max-width: 760px) {
  .header-inner,
  .app-main {
    width: min(100% - 28px, 1220px);
  }

  .header-inner {
    grid-template-columns: 1fr auto;
    min-height: 66px;
  }

  .brand-copy small,
  .desktop-nav {
    display: none;
  }

  .brand-mark {
    width: 38px;
    height: 38px;
  }

  .app-main {
    padding-top: 18px;
    padding-bottom: 108px;
  }

  .mobile-nav {
    position: fixed;
    z-index: 30;
    right: 14px;
    bottom: 12px;
    left: 14px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 7px;
    border: 1px solid rgb(255 255 255 / 70%);
    border-radius: 24px;
    background: rgb(26 55 43 / 94%);
    box-shadow: 0 16px 38px rgb(20 46 35 / 30%);
    backdrop-filter: blur(18px);
  }

  .mobile-nav a {
    display: grid;
    gap: 3px;
    padding: 8px 4px;
    border-radius: 17px;
    color: rgb(255 255 255 / 58%);
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    place-items: center;
  }

  .mobile-nav .el-icon {
    font-size: 18px;
  }

  .mobile-nav a.router-link-exact-active {
    color: #18382b;
    background: #d9f271;
  }
}
</style>
