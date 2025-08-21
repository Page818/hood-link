<!-- src/layouts/AuthLayout.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 內容卡片最大寬（px / 任意長度） */
  maxWidth: { type: [Number, String], default: 480 },
  /** 標題與副標題（也可用具名 slot 覆蓋） */
  title: { type: String, default: '登入《好鄰聚》' },
  subtitle: { type: String, default: '' },
  /** 笑臉粒子區寬度（建議 18~28vw） */
  sideWidth: { type: String, default: '22vw' },
})

/* 粒子參數：笑臉字元（不需載圖），輕微飄浮 */
const particleOptions = computed(() => ({
  background: { color: 'transparent' },
  detectRetina: true,
  fpsLimit: 60,
  fullScreen: { enable: false }, // 由容器控制尺寸
  particles: {
    number: { value: 0 }, // 用 density+emitters 控制數量
    move: { enable: true, speed: 0.6, direction: 'none', outModes: { default: 'out' } },
    opacity: { value: 0.9 },
    size: { value: 18, random: { enable: true, minimumValue: 10 } },
    shape: {
      type: 'char',
      character: {
        value: ['☺', '🙂', '😊'], // 笑臉
        font: 'Inter, Noto Sans TC, sans-serif',
        style: '',
        weight: '700',
      },
    },
    color: { value: '#1F2937' }, // 深色笑臉
  },
  emitters: [
    {
      position: { x: 50, y: 0 },
      rate: { delay: 0.3, quantity: 1 },
      size: { width: 100, height: 0 },
    },
  ],
  interactivity: {
    events: { onHover: { enable: false }, resize: true },
  },
}))
</script>

<template>
  <!-- 以視窗高度為上限；整頁不捲動 -->
  <v-container fluid class="auth-root">
    <!-- 左側粒子區 -->
    <div class="particles-side left" :style="{ width: sideWidth }">
      <Particles id="left-smiles" :options="particleOptions" />
    </div>

    <!-- 右側粒子區 -->
    <div class="particles-side right" :style="{ width: sideWidth }">
      <Particles id="right-smiles" :options="particleOptions" />
    </div>

    <!-- 中央卡片：海報感 -->
    <div class="auth-center">
      <v-card class="auth-card poster round-xl soft-shadow">
        <!-- 可愛旗串 -->
        <div class="bunting" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </div>

        <!-- 標題區（slot 可覆蓋） -->
        <div class="text-center px-6 pt-4">
          <slot name="logo">
            <div class="brand text-h6">🏘️ <strong>好鄰聚</strong></div>
          </slot>
          <slot name="title"
            ><div class="section-title mt-2">{{ title }}</div></slot
          >
          <slot name="subtitle" v-if="subtitle">
            <div class="subtitle-dim text-body-2 mt-1">{{ subtitle }}</div>
          </slot>
        </div>

        <div class="cloud-divider mt-4"></div>

        <!-- 表單區：若內容偏多，只在卡片內滾動 -->
        <div class="auth-body px-6 pb-6 pt-4">
          <slot />
        </div>
      </v-card>
    </div>
  </v-container>
</template>

<style scoped>
/* 讓整頁以視窗高度為上限，禁用全頁捲動 */
.auth-root {
  height: 100vh;
  overflow: hidden; /* ✅ 不要出現頁面 scrollbar */
  background: var(--c-cream); /* 奶油色背景 */
  position: relative;
  padding: 0; /* 無多餘內距，視覺更乾淨 */
  display: grid;
  place-items: center; /* 置中卡片 */
}

/* 中央卡片容器（避免被 side 區干擾點擊） */
.auth-center {
  position: relative;
  z-index: 2;
}

/* 海報感卡片：白底、黑框、圓角 */
.poster {
  background-color: #fff !important;
  border: 3px solid #111 !important; /* 粗黑框 */
}

/* 卡片寬高：手機 90vw，桌機 clamp 到 maxWidth；高度不超過視窗 */
.auth-card {
  inline-size: clamp(320px, 90vw, v-bind(maxWidth)); /* 讀 props（SFC v-bind in CSS） */
  max-height: min(92vh, 680px);
  display: flex;
  flex-direction: column;
}

/* 表單區內滾動（而不是整頁滾） */
.auth-body {
  overflow: auto;
  max-height: calc(92vh - 160px); /* 扣掉標題與上下裝飾的空間 */
}

/* 兩側粒子區：固定在左右，指標事件穿透 */
.particles-side {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}
.particles-side.left {
  left: 0;
}
.particles-side.right {
  right: 0;
}

/* 手機：側邊動畫縮小或隱藏（避免擁擠） */
@media (max-width: 768px) {
  .particles-side {
    display: none;
  }
  .auth-card {
    max-height: min(92vh, 720px);
  }
  .auth-body {
    max-height: calc(92vh - 150px);
  }
}
</style>
