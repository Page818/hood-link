<template>
  <!-- 背景全寬，垂直水平置中 -->
  <v-container fluid class="auth-bg d-flex align-center justify-center">
    <div class="auth-card-wrap">
      <slot />
    </div>
  </v-container>
</template>

<style scoped>
.auth-bg {
  min-height: 100vh;
  background-color: #f9f5f0;
  background-image: url('/more-leaves-on-green.png');
  background-repeat: repeat;
  padding: 16px;
}

/* 內層卡片：手機 90vw，桌機最多 480px（可調為 420~520） */
.auth-card-wrap {
  inline-size: clamp(320px, 90vw, 480px);
}

/* 若你的 <RouterView> 內直接是 v-card，讓它吃滿容器寬 */
.auth-card-wrap :deep(.v-card) {
  width: 100%;
  border-radius: 20px;
}

/* 手機圓角略小，內距也稍微縮 */
@media (max-width: 600px) {
  .auth-card-wrap :deep(.v-card) {
    border-radius: 16px;
    padding: 20px !important;
  }
}
</style>
