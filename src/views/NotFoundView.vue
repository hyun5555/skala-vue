<template>
  <el-card class="not-found" shadow="never">
    <el-result
      icon="warning"
      title="페이지를 찾을 수 없습니다"
      sub-title="요청한 주소가 존재하지 않습니다."
    >
      <template #extra>
        <RouterLink to="/"><el-button type="primary">날씨 메인으로 이동</el-button></RouterLink>
      </template>
    </el-result>
  </el-card>
</template>

<style scoped>
.not-found {
  border: 0;
  box-shadow: 0 20px 50px rgb(29 61 46 / 8%);
}
</style>
