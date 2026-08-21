<script setup>
defineProps({
  query: {
    type: String,
    default: '',
  },
  showOutingIndex: Boolean,
})

defineEmits(['update-query', 'toggle-outing'])
</script>

<template>
  <div class="search-bar">
    <label for="component-city-search">도시 이름</label>
    <div class="search-controls">
      <input
        id="component-city-search"
        type="text"
        :value="query"
        placeholder="검색할 도시 이름 입력"
        @input="$emit('update-query', $event.target.value)"
      />
      <button type="button" @click="$emit('update-query', '')">초기화</button>
      <button type="button" @click="$emit('toggle-outing')">
        외출 지수 {{ showOutingIndex ? '숨기기' : '보기' }}
      </button>
    </div>
    <p>
      검색 중인 도시: <strong>{{ query || '없음' }}</strong>
    </p>
  </div>
</template>

<style scoped>
label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.search-controls {
  display: flex;
  gap: 8px;
}

input {
  flex: 1;
  width: auto;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 15px;
}

button {
  padding: 9px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

p {
  margin: 10px 0 0;
}

@media (max-width: 560px) {
  .search-controls {
    flex-direction: column;
  }
}
</style>
