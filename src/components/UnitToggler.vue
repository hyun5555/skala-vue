<script setup>
import { Setting } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/configStore.js'

const configStore = useConfigStore()
</script>

<template>
  <div class="unit-toggler">
    <el-popover placement="bottom-end" :width="250" trigger="click">
      <template #reference>
        <el-button class="settings-button" circle aria-label="날씨 표시 설정">
          <el-icon><Setting /></el-icon>
        </el-button>
      </template>
      <div class="settings-panel">
        <div>
          <strong>날씨 표시 설정</strong>
          <small>원하는 온도 단위와 자릿수를 선택하세요.</small>
        </div>
        <el-button-group>
          <el-button
            :type="configStore.unit === 'celsius' ? 'primary' : 'default'"
            @click="configStore.unit !== 'celsius' && configStore.toggleUnit()"
          >
            섭씨 ℃
          </el-button>
          <el-button
            :type="configStore.unit === 'fahrenheit' ? 'primary' : 'default'"
            @click="configStore.unit !== 'fahrenheit' && configStore.toggleUnit()"
          >
            화씨 ℉
          </el-button>
        </el-button-group>
        <el-switch
          :model-value="Boolean(configStore.temperaturePrecision)"
          active-text="소수점 표시"
          @change="configStore.toggleTemperaturePrecision"
        />
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
.settings-button {
  width: 42px;
  height: 42px;
  border-color: #dce6df;
  color: #315a48;
  background: #fff;
}

.settings-button:hover {
  color: #fff;
  border-color: #1f6b4f;
  background: #1f6b4f;
}

.settings-panel {
  display: grid;
  gap: 16px;
  padding: 4px;
}

.settings-panel strong,
.settings-panel small {
  display: block;
}

.settings-panel small {
  margin-top: 3px;
  color: #87948d;
  font-size: 11px;
}

.settings-panel .el-button-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
