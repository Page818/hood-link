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
        <v-icon v-if="item.pinned" color="orange" size="16" class="ml-1">mdi-pin</v-icon>
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
  background-color: transparent;
  border: 3px solid #111;
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

/* 選擇 v-list-item */
.announcement-list >>> .v-list-item {
  transition: background 0.2s;
}

/* hover */
.announcement-list >>> .v-list-item:hover {
  background-color: #fff2d9;
}

/* 選中 */
.announcement-list >>> .announcement-selected {
  background-color: #ffc857;
  border-left: 4px solid #111;
}
</style>
