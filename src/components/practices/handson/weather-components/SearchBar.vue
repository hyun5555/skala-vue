<script setup>
import { Delete, Loading, Search, Star } from '@element-plus/icons-vue'

defineProps({
  query: { type: String, default: '' },
  showOutingIndex: Boolean,
  favoriteCount: { type: Number, default: 0 },
  showOnlyFavorites: Boolean,
  loading: Boolean,
})

defineEmits(['update-query', 'toggle-outing', 'toggle-favorites'])
</script>

<template>
  <div class="search-bar">
    <el-input
      :model-value="query"
      size="large"
      clearable
      placeholder="전국 시·군·구 검색 (예: 강남구, 춘천 등)"
      aria-label="도시 이름"
      @update:model-value="$emit('update-query', $event)"
      @clear="$emit('update-query', '')"
    >
      <template #prefix
        ><el-icon><Search /></el-icon
      ></template>
      <template v-if="loading" #suffix>
        <el-icon class="is-loading"><Loading /></el-icon>
      </template>
    </el-input>

    <div class="search-actions">
      <el-tooltip content="검색 초기화" placement="top">
        <el-button circle aria-label="검색 초기화" @click="$emit('update-query', '')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
      <el-button :type="showOutingIndex ? 'primary' : 'default'" @click="$emit('toggle-outing')">
        {{ showOutingIndex ? '리포트 닫기' : '지역 비교' }}
      </el-button>
      <el-button
        :type="showOnlyFavorites ? 'warning' : 'default'"
        :aria-pressed="showOnlyFavorites"
        @click="$emit('toggle-favorites')"
      >
        <el-icon><Star /></el-icon> 관심 {{ favoriteCount }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.search-bar :deep(.el-input__wrapper) {
  min-height: 54px;
  padding: 0 18px;
  border-radius: 16px;
  background: #f6f7f3;
  box-shadow: none;
}

.search-bar :deep(.el-input__inner) {
  font-size: 15px;
}

.search-actions {
  display: flex;
  gap: 8px;
}

.search-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.search-actions .el-button {
  min-height: 54px;
  padding-right: 18px;
  padding-left: 18px;
  border-radius: 16px;
}

.search-actions .el-button.is-circle {
  width: 54px;
  padding: 0;
}

@media (max-width: 720px) {
  .search-bar {
    grid-template-columns: 1fr;
  }

  .search-actions {
    display: grid;
    grid-template-columns: 48px 1fr 1fr;
  }

  .search-actions .el-button,
  .search-actions .el-button.is-circle {
    width: 100%;
    min-height: 48px;
  }
}
</style>
