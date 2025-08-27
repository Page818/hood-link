// src/plugins/vuetify.js
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const light = {
  dark: false,
  colors: {
    // === Base surfaces (報紙奶油底 + 白面) ===
    background: '#FFF7EC', // cream
    surface: '#FFFFFF',

    // === Brand & accents ===
    primary: '#FF7A59', // coral（CTA、focus）
    secondary: '#00A6A6', // teal（輔助）
    info: '#7CC4FF', // poster blue / info
    warning: '#FFC857', // sunshine yellow（提醒/貼紙）
    error: '#D7263D',
    success: '#2E7D32',
    // 報紙 / 海報概念延伸色
    ink: '#111111', // 黑墨標題
    brickRed: '#b22222', // 紅磚紅
    posterBlue: '#1976d2', // 海報藍
    grassGreen: '#228b22', // 草綠
    neonYellow: '#ffeb3b', // 螢光黃
    // === Ink / text ===
    onBackground: '#1F2937', // ink
    onSurface: '#1F2937',

    // === Custom aliases（可在 class 直接用 bg-ink / text-ink 等）===
    ink: '#111111',
    gray: '#6B7280',
    sky: '#EAF5FF',
    cream: '#FFF7EC',
  },
  variables: {
    // === Global tokens（更貼近「粗線條 + 大圓角 + 報紙字距」）===
    'border-radius-root': '16px',
    'border-radius-lg': '22px',
    'font-size-root': '15px',
    'line-height-root': '1.6',
    // Divider / outline 看起來像報紙粗線
    'divider-thickness': '2px',
    'field-border-width': '2px',
  },
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: { light },
  },

  // === Component defaults：用來落地「扁平 + 粗黑線 + 膠囊」 ===
  defaults: {
    VAppBar: {
      flat: true,
      elevation: 0,
      color: 'transparent',
      height: 100, // 你現在使用的高度
    },
    VMain: {
      // 沒特別需求可留空，交給 layout
    },
    VBtn: {
      rounded: 'pill',
      elevation: 0,
      flat: true,
      ripple: true,
      // 文字別貼底、膠囊更像貼紙
      class: 'font-weight-bold',
      style: 'line-height:1', // 防止文字視覺下墜
      color: 'onSurface',
    },
    // 針對 icon 按鈕（頭像那顆）統一尺寸，易於對齊
    VBtnVariant: {
      // 留白：避免覆蓋自定義 class
    },
    VAvatar: {
      size: 40, // 和 appbar-btn--icon 配合
    },
    VTextField: {
      variant: 'outlined',
      color: 'primary', // 聚焦用 coral
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VCheckbox: {
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VSwitch: {
      color: 'primary',
      hideDetails: 'auto',
    },
    VCard: {
      rounded: 'lg',
      elevation: 0, // 扁平，陰影交給自家 class（soft-shadow 等）
    },
    VSheet: {
      elevation: 0,
      rounded: 'lg',
    },
    VDivider: {
      thickness: 2,
      color: 'ink',
    },
    VChip: {
      rounded: 'pill',
      elevation: 0,
      density: 'comfortable',
    },
    VList: {
      lines: 'two',
      density: 'comfortable',
    },
    VAppBarTitle: {
      class: 'font-weight-black',
    },
  },
})
