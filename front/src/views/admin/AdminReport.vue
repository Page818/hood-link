<template>
  <v-container class="py-6">
    <BackToAdminDashboard />
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">通報管理</h1>
      <div class="d-flex ga-3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="狀態過濾"
          class="mr-3"
          density="compact"
          style="max-width: 180px"
          clearable
        />
        <v-select
          v-model="categoryFilter"
          :items="categoryOptions"
          label="類別過濾"
          density="compact"
          style="max-width: 180px"
          clearable
        />
        <v-btn color="primary" @click="openCreateDialog">
          <v-icon start>mdi-plus</v-icon> 新增通報
        </v-btn>
      </div>
    </div>

    <v-data-table
      :headers="headers"
      :items="filteredReports"
      :loading="loading"
      loading-text="載入中..."
      item-value="_id"
      class="elevation-1"
    >
      <!-- 類別 -->
      <template #item.category="{ item }">
        <v-chip variant="tonal" size="small">{{ item.category }}</v-chip>
      </template>

      <!-- 狀態（可即時切換） -->
      <template #item.status="{ item }">
        <v-select
          density="compact"
          :items="statusOptions"
          v-model="item.status"
          style="min-width: 140px"
          @update:modelValue="(v) => onChangeStatus(item, v)"
        />
      </template>

      <!-- 建立者 -->
      <template #item.creatorName="{ item }">
        <span>{{ item.creator?.name ?? '—' }}</span>
      </template>

      <!-- 圖片 -->
      <template #item.image="{ item }">
        <div v-if="item.image" class="d-flex align-center ga-2">
          <v-btn size="small" variant="text" :href="item.image" target="_blank">查看</v-btn>
        </div>
        <span v-else>—</span>
      </template>

      <!-- 建立時間 -->
      <template #item.createdAt="{ item }">
        {{ formatDate(item.createdAt) }}
      </template>

      <!-- 操作 -->
      <template #item.actions="{ item }">
        <v-btn
          icon
          :to="{
            name: 'admin.community.report.detail',
            params: { communityId, reportId: item._id },
          }"
        >
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn icon @click="deleteReport(item._id)">
          <v-icon color="red">mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- 建立通報 Dialog -->
    <ReportFormDialog v-model="dialog" :communityId="communityId" @submit="handleCreate" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { toId } from '@/utils/id'
import ReportFormDialog from '@/components/admin/ReportFormDialog.vue'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const communityId = toId(route.params.communityId)

const reports = ref([])
const loading = ref(false)
const dialog = ref(false)

// 篩選
const statusFilter = ref(null)
const categoryFilter = ref(null)
const statusOptions = ['待處理', '處理中', '已完成']
const categoryOptions = ['水電', '設備', '環境', '治安', '其他']

const headers = [
  { title: '標題', key: 'title', width: 240 },
  { title: '類別', key: 'category', width: 120 },
  { title: '狀態', key: 'status', width: 160 },
  { title: '建立者', key: 'creatorName', width: 140 },
  { title: '地點', key: 'location', width: 180 },
  { title: '圖片', key: 'image', width: 100 },
  { title: '建立時間', key: 'createdAt', width: 160 },
  { title: '操作', key: 'actions', sortable: false, width: 120 },
]

const formatDate = (isoString) => {
  return new Date(isoString).toLocaleString('zh-TW', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const fetchReports = async () => {
  loading.value = true
  try {
    const res = await api.get(`/reports/community/${communityId}`)
    // 後端有 populate('creator','name')，保險起見補一個字段
    reports.value = (res.data.reports || []).map((r) => ({
      ...r,
      creatorName: r.creator?.name ?? '—',
    }))
  } catch (err) {
    console.error('❌ 無法取得通報清單', err)
    alert('取得通報失敗')
  } finally {
    loading.value = false
  }
}

const filteredReports = computed(() => {
  let list = reports.value
  if (statusFilter.value) list = list.filter((r) => r.status === statusFilter.value)
  if (categoryFilter.value) list = list.filter((r) => r.category === categoryFilter.value)
  return list
})

const openCreateDialog = () => {
  dialog.value = true
}

const handleCreate = async (data) => {
  try {
    const payload = {
      ...data,
      communityId: toId(communityId), // 後端需要 communityId
    }
    await api.post('/reports/create', payload)
    alert('新增成功')
    fetchReports()
  } catch (err) {
    console.error('❌ 新增通報失敗', err)
    alert('新增失敗')
  }
}

const onChangeStatus = async (item, newStatus) => {
  // 樂觀更新
  const old = item.status
  item.status = newStatus
  try {
    await api.patch(`/reports/${toId(item)}/status`, { status: newStatus })
  } catch (err) {
    console.error('❌ 更新狀態失敗', err)
    item.status = old
    alert('更新狀態失敗')
  }
}

const deleteReport = async (id) => {
  if (!confirm('確定要刪除這則通報嗎？')) return
  try {
    await api.delete(`/reports/${id}`)
    alert('刪除成功')
    fetchReports()
  } catch (err) {
    console.error('❌ 刪除通報失敗', err)
    alert('刪除失敗')
  }
}

onMounted(fetchReports)
</script>
