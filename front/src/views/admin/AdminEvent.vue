<!-- src/views/admin/AdminEvent.vue -->
<template>
  <v-container class="py-6">
    <BackToAdminDashboard :communityId="route.params.communityId" />

    <h1 class="text-h5 font-weight-bold mb-6">活動管理</h1>

    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" @click="openCreateDialog">
        <v-icon start>mdi-plus</v-icon> 新增活動
      </v-btn>
    </div>

    <v-data-table
      :headers="headers"
      :items="events"
      :loading="loading"
      item-value="_id"
      class="elevation-1"
    >
      <template #item.date="{ item }">
        {{ formatDate(item.date) }}
      </template>

      <template #item.registrationDeadline="{ item }">
        {{ item.registrationDeadline ? formatDate(item.registrationDeadline) : '—' }}
      </template>

      <template #item.participants="{ item }">
        {{ (item.participants && item.participants.length) || 0 }}
      </template>

      <template #item.updatedAt="{ item }">
        {{ formatDate(item.updatedAt) }}
      </template>

      <template #item.actions="{ item }">
        <v-btn icon @click="openEditDialog(item)">
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn icon @click="confirmDelete(item._id)">
          <v-icon color="red">mdi-delete</v-icon>
        </v-btn>
        <v-btn icon @click="openParticipants(item._id)" :disabled="!item.participants?.length">
          <v-icon>mdi-account-multiple</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <EventFormDialog
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
import { toId } from '@/utils/id'
import EventFormDialog from '@/components/admin/EventFormDialog.vue'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const communityId = toId(route.params.communityId)

const events = ref([])
const loading = ref(false)
const dialog = ref(false)
const selected = ref(null)

const headers = [
  { title: '標題', key: 'title' },
  { title: '活動日期', key: 'date' },
  { title: '報名截止', key: 'registrationDeadline' },
  { title: '已報名人數', key: 'participants' },
  { title: '更新時間', key: 'updatedAt' },
  { title: '操作', key: 'actions', sortable: false },
]

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleString('zh-TW', { dateStyle: 'medium', timeStyle: 'short' })
}

const fetchEvents = async () => {
  loading.value = true
  try {
    const res = await api.get(`/events/community/${communityId}`)
    // 你的後端已經 date: 1 排序，這裡只保險再排序一次
    events.value = (res.data.events || []).sort((a, b) => new Date(a.date) - new Date(b.date))
  } catch (err) {
    console.error('❌ 無法取得活動清單', err)
    alert('取得活動清單失敗')
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

const confirmDelete = async (id) => {
  if (!confirm('確定要刪除這個活動嗎？')) return
  try {
    await api.delete(`/events/${toId(id)}`)
    alert('活動已刪除')
    fetchEvents()
  } catch (err) {
    console.error('❌ 刪除活動失敗', err)
    alert('刪除失敗')
  }
}

const handleSave = async (data) => {
  try {
    // 後端 create 需要 communityId；update 不強制，但帶著也沒差
    const payload = {
      ...data,
      communityId: toId(communityId),
      // 確保 date/registrationDeadline 是 ISO 字串（避免時區誤差）
      date: data.date ? new Date(data.date).toISOString() : null,
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline).toISOString()
        : null,
    }

    if (selected.value) {
      await api.put(`/events/${toId(selected.value)}`, payload)
    } else {
      await api.post('/events/create', payload)
    }

    alert('儲存成功')
    dialog.value = false
    fetchEvents()
  } catch (err) {
    console.error('❌ 儲存活動失敗', err)
    alert('儲存失敗')
  }
}

const openParticipants = async (eventId) => {
  // 這裡先示意：可以跳 Modal 顯示名單或導到另一頁
  try {
    const res = await api.get(`/events/participants/${toId(eventId)}`)
    const list = res?.data?.participants || []
    alert(`共 ${list.length} 人：\n` + list.map((u) => u.name || '(未命名)').join('\n'))
  } catch (err) {
    console.error('❌ 取得報名名單失敗', err)
    alert('取得報名名單失敗')
  }
}

onMounted(fetchEvents)
</script>
