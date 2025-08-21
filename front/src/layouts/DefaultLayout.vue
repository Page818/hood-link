<!-- src/layouts/DefaultLayout.vue -->
<script setup>
const props = defineProps({
  /** 內容最大寬度（px or 任意 CSS 長度值），預設 1200 */
  maxWidth: { type: [Number, String], default: 1200 },
  /** 左右邊距（px / rem 等），預設 24px；手機會自動縮小 */
  gutter: { type: [Number, String], default: '24px' },
  /** 是否讓容器頂部「貼齊」app bar（偶爾需要做 hero 區塊貼齊） */
  bleedTop: { type: Boolean, default: false },
})
</script>

<template>
  <!-- fluid 讓背景滿版；用 CSS 變數把 props 傳給樣式層 -->
  <v-container
    fluid
    class="default-layout"
    :class="{ 'has-bleed-top': bleedTop }"
    :style="{
      '--content-max': typeof maxWidth === 'number' ? maxWidth + 'px' : String(maxWidth),
      '--content-gutter': typeof gutter === 'number' ? gutter + 'px' : String(gutter),
    }"
  >
    <div class="container-wrap">
      <slot />
    </div>
  </v-container>
</template>

<style scoped>
/* 外層：控制左右 gutter（與手機自動縮小） */
.default-layout {
  /* 讓容器本身不設 max-width，交給內層控制 */
  padding-inline: var(--content-gutter);
}

/* 內容容器：用 clamp 在 320px ~ 自訂最大寬之間自適應 */
.container-wrap {
  /* clamp(最小寬, 偏好寬, 最大寬)
     偏好寬 = 100% 減掉左右 gutter（避免在超寬螢幕時貼邊）
  */
  inline-size: clamp(320px, calc(100% - (var(--content-gutter) * 2)), var(--content-max));
  margin-inline: auto;
}

/* 小螢幕時自動縮小左右 padding，避免擁擠 */
@media (max-width: 600px) {
  .default-layout {
    padding-inline: 12px;
  }
}

/* 有些頁需要 hero 緊貼 AppBar，可加 bleedTop 取消上方 padding */
.has-bleed-top {
  padding-top: 0 !important;
}
</style>
