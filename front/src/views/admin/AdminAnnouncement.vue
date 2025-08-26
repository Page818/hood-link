<!-- src/views/admin/AdminAnnouncement.vue -->
<template>
  <v-container class="py-6">
    <!-- 旗串裝飾 -->
    <!-- <div class="bunting"><span></span><span></span><span></span><span></span><span></span></div> -->

    <BackToAdminDashboard :communityId="route.params.communityId" />
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold section-title">公告管理</h1>
      <v-btn color="primary" class="cta" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon> 新增公告
      </v-btn>
    </div>

    <div class="wave-divider mb-4"></div>

    <!-- 表格卡片外框，加上圓角與柔和陰影 -->
    <v-card class="round-xl soft-shadow">
      <v-data-table
        :headers="headers"
        :items="announcements"
        :loading="loading"
        item-value="_id"
        density="comfortable"
        class="round-xl"
      >
        <!-- 自訂「無資料」樣式 -->
        <template #no-data>
          <div class="pa-8">
            <div class="empty-state">
              <span class="emoji">📭</span>
              目前沒有公告，點右上角「新增公告」開始吧！
            </div>
          </div>
        </template>

        <!-- 置頂欄：彩色貼紙 -->
        <template #item.pinned="{ item }">
          <v-chip
            :color="item.pinned ? 'primary' : undefined"
            :variant="item.pinned ? 'flat' : 'tonal'"
            size="small"
            class="sticker"
          >
            <v-icon size="16" start>mdi-pin</v-icon>
            {{ item.pinned ? '置頂' : '否' }}
          </v-chip>
        </template>

        <!-- 標題欄：若置頂，加上小徽章 -->
        <template #item.title="{ item }">
          <div class="d-flex align-center gap-2">
            <span class="text-body-2">{{ item.title }}</span>
            <v-chip v-if="item.pinned" size="x-small" color="warning" variant="tonal" class="ml-2">
              📌 置頂
            </v-chip>
          </div>
        </template>

        <!-- 更新時間：美化日期 -->
        <template #item.updatedAt="{ item }">
          <span class="text-medium-emphasis">
            {{ formatDate(item.updatedAt) }}
          </span>
        </template>

        <!-- 操作按鈕 -->
        <template #item.actions="{ item }">
          <v-btn icon variant="text" @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon variant="text" @click="deleteAnnouncement(item._id)">
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </template>

        <!-- 載入中 -->
        <template #loading>
          <v-skeleton-loader type="table-row@4"></v-skeleton-loader>
        </template>
      </v-data-table>
    </v-card>

    <!-- 彈跳表單元件 -->
    <AnnouncementFormDialog
      v-model="dialog"
      :initialData="selected"
      :communityId="communityId"
      @submit="handleSave"
    />

    <!-- Snackbar 通知 -->
    <v-snackbar v-model="snackbar.show" :timeout="2400" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AnnouncementFormDialog from '@/components/admin/AnnouncementFormDialog.vue'
import { toId } from '@/utils/id'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const communityId = toId(route.params.communityId)

const announcements = ref([])
const loading = ref(false)
const dialog = ref(false)
const selected = ref(null)

const snackbar = ref({ show: false, text: '' })

const headers = [
  { title: '標題', key: 'title' },
  { title: '是否置頂', key: 'pinned', align: 'start', width: 120 },
  { title: '更新時間', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', sortable: false, width: 120 },
]

// ➤ 格式化日期
const formatDate = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleString('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    // 注意：你的 api instance 會自動加上 /api 前綴
    const res = await api.get(`/announcements/community/${communityId}`)
    // ➤ 排序：置頂優先，再依時間倒序
    announcements.value = (res.data.announcements || []).sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
    })
  } catch (err) {
    console.error('❌ 無法取得公告清單', err)
    showTip('取得公告失敗')
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  selected.value = null
  dialog.value = true
}

const openEditDialog = (item) => {
  selected.value = item
  dialog.value = true
}

const deleteAnnouncement = async (id) => {
  if (!confirm('確定要刪除這則公告嗎？')) return
  try {
    await api.delete(`/announcements/${toId(id)}`)
    showTip('公告已刪除')
    fetchAnnouncements()
  } catch (err) {
    console.error('❌ 刪除公告失敗', err)
    showTip('刪除失敗')
  }
}

const handleSave = async (data) => {
  try {
    const payload = {
      ...data,
      community: toId(communityId), // ✅ 記得帶上社區 ID
      pinned: !!data.pinned,
    }

    if (selected.value && selected.value._id) {
      // ✅ 編輯模式：用選取項目的 _id
      await api.put(`/announcements/${toId(selected.value._id)}`, payload)
    } else {
      // 新增模式
      await api.post(`/announcements/create`, payload)
    }

    showTip('儲存成功')
    dialog.value = false
    fetchAnnouncements()
  } catch (err) {
    console.error('❌ 儲存公告失敗', err)
    showTip('儲存失敗')
  }
}

const showTip = (text) => {
  snackbar.value.text = text
  snackbar.value.show = true
}

onMounted(fetchAnnouncements)
</script>

<style scoped>
/* 小間距工具 */
.gap-2 {
  gap: 8px;
}
</style>
