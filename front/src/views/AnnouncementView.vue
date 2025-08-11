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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

// 共用：取得社區 ID（URL 優先，其次使用者/備援）
import { useCommunityId } from '@/composables/useCommunityId'

// 子元件
import AnnouncementList from '@/components/AnnouncementList.vue'
import AnnouncementDetail from '@/components/AnnouncementDetail.vue'
import BackToDashboard from '@/components/BackToDashboard.vue'

const router = useRouter()
const { communityId } = useCommunityId()

// 狀態
const announcements = ref([])
const selectedId = ref(null)
const loading = ref(true)
const error = ref('')

// 目前選中的公告
const selectedAnnouncement = computed(
  () => announcements.value.find((a) => a._id === selectedId.value) || null,
)

// 取公告清單
async function fetchAnnouncements() {
  if (!communityId.value) return // 沒有 ID 就不要打 /undefined
  loading.value = true
  error.value = ''

  try {
    // 你的 axios 已有 baseURL '/api'，這裡不用再加 '/api'
    const { data } = await api.get(`/announcements/community/${communityId.value}`)
    announcements.value = data.announcements || []

    // 預設顯示：置頂優先，否則最新一筆
    const pinned = announcements.value.find((a) => a.pinned)
    selectedId.value = pinned ? pinned._id : announcements.value[0]?._id || null
  } catch (err) {
    console.error('❌ 載入公告失敗', err)
    error.value = '無法載入公告列表，請稍後再試'
  } finally {
    loading.value = false
  }
}

// 初次進入
onMounted(async () => {
  if (!communityId.value) {
    // 沒有社區情境 → 導去加入社區
    router.push({ name: 'community.join' })
    return
  }
  await fetchAnnouncements()
})

// 若同頁切換了社區（URL 變了），自動重抓
watch(
  () => communityId.value,
  async () => {
    if (!communityId.value) return
    await fetchAnnouncements()
  },
)

function handleSelect(id) {
  selectedId.value = id
}
</script>
