<template>
  <div v-if="announcement" class="detail-wrapper">
    <!-- 標題與時間 -->
    <div class="mb-4">
      <h1 class="font-weight-bold">{{ announcement.title }}</h1>
      <p class="text-caption text-grey">更新時間：{{ formatDate(announcement.updatedAt) }}</p>
    </div>

    <!-- 圖片（可選） -->
    <v-img
      v-if="announcement.image"
      :src="announcement.image"
      max-height="400"
      cover
      class="mb-4 rounded"
    />

    <!-- 內文 -->
    <div class="text-body-1" style="white-space: pre-wrap">
      {{ announcement.content }}
    </div>
  </div>

  <!-- 尚未選中公告時的提示 -->
  <div v-else class="pa-4 text-grey text-center">請選擇一則公告以查看詳情</div>
</template>

<script setup>
defineProps({
  announcement: Object,
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<style scoped>
.detail-wrapper h1 {
  /* font-weight: 800; */
  margin-bottom: 8px;
  border-bottom: 2px dashed var(--ink-strong);
  padding-bottom: 4px;
  font-family: 'HoodBrandTitle';
  font-size: 2.2rem;
}
</style>
