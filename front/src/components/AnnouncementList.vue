<template>
  <v-list class="pa-0 announcement-list" lines="two" nav dense>
    <v-list-subheader>公告列表</v-list-subheader>
    <v-divider></v-divider>

    <v-list-item
      v-for="item in announcements"
      :key="item._id"
      :value="item._id"
      :class="{ 'announcement-selected': item._id === selectedId }"
      @click="$emit('select', item._id)"
    >
      <v-list-item-title>
        {{ item.title }}
        <v-icon v-if="item.pinned" color="primary" size="16" class="ml-1">mdi-pin</v-icon>
      </v-list-item-title>
      <v-list-item-subtitle>
        {{ formatDate(item.updatedAt) }}
      </v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup>
defineProps({
  announcements: Array,
  selectedId: String,
})
defineEmits(['select'])

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
.announcement-list {
  background-color: var(--ink-strong); /* 深色背景 */
  opacity: 0.88;
  filter: contrast(1.08) brightness(1.02);
  color: #fefefe; /* 預設文字顏色 */
  border: 3px solid var(--ink-strong); /* 反轉，淺色邊框 */
  outline: 3px dashed #fefefe;
  outline-offset: -6px;
  box-shadow: inset 0 0 6px rgba(255, 255, 255, 0.2);
  /* border-radius: 12px; */
  overflow: hidden;
}

/* v-list-subheader（標題） */
.announcement-list >>> .v-list-subheader {
  color: #fefefe;
  font-size: 1.7rem; /* 放大一點 */
  font-weight: bold;
  line-height: 3.8rem;
  /* font-style: italic; */
  display: block;
  text-align: center;
  font-family: 'HoodBrandTitle';
}

/* v-list-item 文字 */
.announcement-list >>> .v-list-item-title {
  color: #fefefe;
  font-size: 1.1rem; /* 放大一點 */
}

.announcement-list >>> .v-list-item-subtitle {
  color: #ddd; /* 淺灰，比主字淡 */
  font-size: 0.95rem;
}

/* hover */
.announcement-list >>> .v-list-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 選中 */
.announcement-list >>> .announcement-selected {
  background-color: #333;
  border-left: 4px solid #ffc857; /* 搭配亮色點綴 */
  border-right: 4px solid #ffc857;
  color: #ffc857;
}

/* .announcement-list {
  background-color: transparent;
  border: 3px solid #111;
  outline: 1px solid #111;
  outline-offset: -6px;
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  overflow: hidden;
}
.announcement-list::before {
  content: '';
  background: var(--tx-paper-frame);
  background-size: 520px auto;
  mix-blend-mode: multiply;
  opacity: 0.88;
  filter: contrast(1.08) brightness(1.02);
}

.announcement-list >>> .v-list-item {
  transition: background 0.2s;
}

.announcement-list >>> .v-list-item:hover {
  background-color: #fff2d9;
}

.announcement-list >>> .announcement-selected {
  background-color: #ffc857;
  border-left: 4px solid #111;
} */
</style>
