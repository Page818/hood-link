<!-- AnnouncementView.vue -->

<template>
  <v-container class="py-10">
    <!-- 🔙 返回按鈕 -->
    <BackToDashboard />

    <h1 class="text-h5 mb-6 font-weight-bold">社區公告</h1>

    <!-- 載入狀態 -->
    <v-progress-circular v-if="loading" indeterminate color="primary" />

    <!-- 錯誤狀態 -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- 主內容 -->
    <v-row v-else>
      <!-- 左側：標題列表 -->
      <v-col cols="12" md="4">
        <AnnouncementList
          :announcements="announcements"
          :selectedId="selectedId"
          @select="handleSelect"
        />
      </v-col>

      <!-- 右側：公告詳情 -->
      <v-col cols="12" md="8">
        <AnnouncementDetail :announcement="selectedAnnouncement" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

// 子元件
import AnnouncementList from '@/components/AnnouncementList.vue'
import AnnouncementDetail from '@/components/AnnouncementDetail.vue'
import BackToDashboard from '@/components/BackToDashboard.vue'

// 路由參數
const route = useRoute()
const communityId = route.params.id

// 狀態
const announcements = ref([])
const selectedId = ref(null)
const loading = ref(true)
const error = ref('')

const selectedAnnouncement = computed(() =>
  announcements.value.find((a) => a._id === selectedId.value),
)

// 一開始載入資料
onMounted(async () => {
  try {
    const res = await api.get(`/announcements/community/${communityId}`)
    announcements.value = res.data.announcements

    // 選擇顯示：置頂公告 → 最新公告
    const pinned = announcements.value.find((a) => a.pinned)
    selectedId.value = pinned ? pinned._id : announcements.value[0]?._id
  } catch (err) {
    console.error('❌ 載入公告失敗', err)
    error.value = '無法載入公告列表，請稍後再試'
  } finally {
    loading.value = false
  }
})

// 使用者選擇某一則公告
const handleSelect = (id) => {
  selectedId.value = id
}
</script>
