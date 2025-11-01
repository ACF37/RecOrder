<script setup lang="ts">
import HotdogTracker from '../components/HotdogTracker.vue'
</script>

<template>
  <section class="view">
    <HotdogTracker />
  </section>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
