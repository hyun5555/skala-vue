<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <section class="dashboard-card">
    <h3>{{ title }}</h3>
    <slot />
  </section>
</template>

<style scoped>
.dashboard-card {
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid #dfe7f1;
  border-radius: 12px;
  background: #f7f9fc;
}

h3 {
  margin: 0 0 14px;
  color: #25324a;
}
</style>
