<!-- 單一留言氣泡 -->
<!-- src/components/comments/CommentItem.vue-->

<template>
  <div class="d-flex align-start ga-3">
    <!-- 頭像 -->
    <v-avatar size="36">
      <template v-if="item.creator?.avatarUrl">
        <v-img :src="item.creator.avatarUrl" alt="avatar" cover />
      </template>
      <template v-else>
        <div
          class="w-100 h-100 d-flex align-center justify-center text-white"
          :style="{ backgroundColor: colorFromId(item.creator?._id || item.creator?.name || 'X') }"
        >
          <span class="text-body-2">{{ initials(item.creator?.name) }}</span>
        </div>
      </template>
    </v-avatar>

    <!-- 氣泡 -->
    <div class="bubble pa-3">
      <div class="text-caption text-medium-emphasis mb-1">
        {{ item.creator?.name || '使用者' }}
      </div>
      <div class="text-body-2">{{ item.content }}</div>
      <div class="text-caption text-disabled mt-1">{{ formatTime(item.createdAt) }}</div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: { type: Object, required: true },
})

// 取姓名縮寫（支援中文、英文）
const initials = (name = '') => {
  const n = name.trim()
  if (!n) return '用'
  const isAscii = /^[\x00-\x7F]+$/.test(n)
  return isAscii ? n[0].toUpperCase() : n.slice(0, 2)
}

// 根據 ID / 名稱生成穩定顏色
const colorFromId = (seed) => {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  const hue = h % 360
  return `hsl(${hue}, 55%, 55%)`
}

// 時間格式化
const formatTime = (iso) => {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return ''
  }
}
</script>

<style scoped>
.bubble {
  background: var(--v-theme-surface-variant);
  border-radius: 14px;
  max-width: 520px;
}
</style>
