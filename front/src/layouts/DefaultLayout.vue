<script setup>
defineProps({
  maxWidth: { type: [Number, String], default: 1200 }, // 想調整站寬很方便
})
</script>

<template>
  <!-- fluid 讓背景寬度滿版；內層用 mx-auto + max-width 控內容寬 -->
  <v-container fluid class="py-6">
    <div class="container-wrap mx-auto">
      <slot />
    </div>
  </v-container>
</template>

<style scoped>
.container-wrap {
  /* clamp(最小, 偏好, 最大) → 手機到桌機的自適應容器寬 */
  inline-size: clamp(320px, 92vw, 1200px);
}

/* 讓內距在小螢幕不擁擠 */
@media (max-width: 600px) {
  .container-wrap {
    padding-inline: 8px;
  }
}
</style>
