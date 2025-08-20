<!-- src/views/admin/AdminAnnouncement.vue -->
<template>
  <v-container class="py-6">
    <h1 class="text-h5 font-weight-bold mb-6">公告管理</h1>

    <!-- 新增公告按鈕 -->
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon> 新增公告
      </v-btn>
    </div>

    <!-- 公告清單 -->
    <v-data-table
      :headers="headers"
      :items="announcements"
      :loading="loading"
      loading-text="載入中..."
      item-value="_id"
      class="elevation-1"
    >
      <!-- pinned 欄位：顯示中文 -->
      <template #item.pinned="{ item }">
        <v-chip :color="item.pinned ? 'green' : 'grey'" variant="tonal" size="small">
          {{ item.pinned ? '是' : '否' }}
        </v-chip>
      </template>

      <!-- updatedAt 欄位：美化日期 -->
      <template #item.updatedAt="{ item }">
        {{ formatDate(item.updatedAt) }}
      </template>

      <!-- 操作按鈕 -->
      <template #item.actions="{ item }">
        <v-btn icon @click="openEditDialog(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon @click="deleteAnnouncement(item._id)">
          <v-icon color="red">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- 彈跳表單元件 -->
    <AnnouncementFormDialog
      v-model="dialog"
      :initialData="selected"
      :communityId="communityId"
      @submit="handleSave"
    />
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import AnnouncementFormDialog from '@/components/admin/AnnouncementFormDialog.vue'
import { toId } from '@/utils/id'

const route = useRoute()
const communityId = toId(route.params.communityId)
const announcements = ref([])
const loading = ref(false)
const dialog = ref(false)
const selected = ref(null)

const headers = [
  { title: '標題', key: 'title' },
  { title: '是否置頂', key: 'pinned' },
  { title: '更新時間', key: 'updatedAt' },
  { title: '操作', key: 'actions', sortable: false },
]

// ➤ 格式化日期
const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const fetchAnnouncements = async () => {
  loading.value = true
  try {
    const res = await api.get(`/announcements/community/${communityId}`)
    // ➤ 排序：置頂優先，再依時間倒序
    announcements.value = res.data.announcements.sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.updatedAt) - new Date(a.updatedAt)
      }
      return b.pinned - a.pinned
    })
  } catch (err) {
    console.error('❌ 無法取得公告清單', err)
    alert('取得公告失敗')
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
    await api.delete(`/announcements/${id}`)
    alert('公告已刪除')
    fetchAnnouncements()
  } catch (err) {
    console.error('❌ 刪除公告失敗', err)
    alert('刪除失敗')
  }
}

const handleSave = async (data) => {
  try {
    if (selected.value) {
      // 編輯模式
      await api.patch(`/announcements/${selected.value._id}`, { ...data, community: communityId })
    } else {
      // 新增模式
      await api.post(`/announcements/create`, { ...data, community: communityId })
    }
    alert('儲存成功')
    dialog.value = false
    fetchAnnouncements()
  } catch (err) {
    console.error('❌ 儲存公告失敗', err)
    alert('儲存失敗')
  }
}

onMounted(fetchAnnouncements)
</script>
