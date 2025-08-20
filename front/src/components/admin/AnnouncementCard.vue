<!-- src/components/admin/AnnouncementCard.vue -->
<template>
  <v-card class="announcement-card" variant="outlined">
    <!-- 圖片區（若有） -->
    <v-img v-if="announcement.image" :src="announcement.image" height="160" cover />

    <!-- 文字區 -->
    <v-card-item>
      <v-card-title class="d-flex align-center">
        <v-icon v-if="announcement.pinned" color="deep-orange-darken-2" class="mr-1"
          >mdi-pin</v-icon
        >
        <span class="font-weight-bold text-truncate">{{ announcement.title || '（無標題）' }}</span>
      </v-card-title>

      <v-card-subtitle class="text-caption text-medium-emphasis">
        {{ formatDate(announcement.updatedAt) }}
      </v-card-subtitle>
    </v-card-item>

    <v-card-text class="text-body-2">
      <div class="two-line-ellipsis">
        {{ announcement.content || '（無內文）' }}
      </div>
    </v-card-text>

    <!-- 按鈕區 -->
    <v-card-actions class="justify-end">
      <v-btn icon variant="text" color="primary" @click="$emit('edit', announcement)">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <v-btn icon variant="text" color="error" @click="$emit('delete', announcement._id)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineProps({
  announcement: {
    type: Object,
    required: true,
  },
})

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleString('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
</script>

<style scoped>
.announcement-card {
  transition: box-shadow 0.2s ease;
}
.announcement-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.two-line-ellipsis {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
