<script setup>
const props = defineProps({
  /** 左右裝飾區寬度（建議 18~28vw） */
  sideWidth: { type: String, default: '22vw' },
  /** 大標( hero )距離頂端的位置（例如 '12%'、'80px'） */
  heroTop: { type: String, default: '12%' },
  /** 是否顯示粒子（暫時無作用，但保留設定避免改動其他頁面） */
  showParticles: { type: Boolean, default: true },
})
</script>

<template>
  <!-- 整頁尺寸與置中 -->
  <v-container fluid class="auth-root">
    <!-- 粒子區塊：目前不顯示 -->
    <template v-if="showParticles">
      <div class="particles-side left" :style="{ width: sideWidth }"></div>
      <div class="particles-side right" :style="{ width: sideWidth }"></div>
    </template>

    <!-- 外層 HERO（卡片外的大標） -->
    <div class="hero" :style="{ top: heroTop }" aria-label="brand">
      <slot name="hero" />
    </div>

    <!-- 置中內容：讓各頁面自己決定卡片寬高與樣式 -->
    <div class="center-slot">
      <slot />
    </div>
  </v-container>
</template>

<style scoped>
.auth-root {
  height: 100%; /* 在 .app-frame 內用 100% 避免多餘 scrollbar */
  overflow: hidden; /* 整頁不出全域捲動 */
  position: relative;
  padding: 0;
  display: grid;
  place-items: center; /* 置中 default slot */
}

/* HERO 位置（不含樣式，讓頁面自己定字型/大小） */
.hero {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.center-slot {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
}
</style>
