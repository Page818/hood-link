<!-- src/views/admin/AdminReportDetail.vue -->
<template>
  <v-container class="py-8" v-if="!loading">
    <BackToAdminDashboard />
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center ga-3">
        <v-btn variant="text" @click="$router.back()">
          <v-icon start>mdi-arrow-left</v-icon> 返回
        </v-btn>
        <h1 class="text-h6 font-weight-bold mb-0">{{ report.title || '（無標題）' }}</h1>
      </div>

      <div class="d-flex align-center ga-3">
        <v-select
          density="compact"
          :items="statusOptions"
          v-model="report.status"
          style="min-width: 150px"
          @update:modelValue="updateStatus"
        />
        <v-btn variant="tonal" @click="openEdit()">編輯</v-btn>
        <v-btn color="red" variant="tonal" @click="onDelete">刪除</v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card variant="outlined" max-width="900" class="mx-auto">
      <v-img v-if="report.image" :src="report.image" height="260" cover class="rounded-t" />

      <v-card-subtitle class="text-caption text-medium-emphasis px-4 pt-3">
        <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon>{{ safeCategory(report.category) }}
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-account</v-icon
          >{{ report.creator?.name ?? '—' }}</span
        >
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-home-outline</v-icon
          >{{ report.community?.name ?? '—' }}</span
        >
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-clock-outline</v-icon
          >{{ fmt(report.createdAt) }}</span
        >
        <span v-if="report.location" class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-map-marker-outline</v-icon>{{ report.location }}</span
        >
      </v-card-subtitle>

      <v-divider class="mx-4 my-2" />

      <v-card-text class="px-4 pb-6 pt-2">
        <h3 class="text-subtitle-2 font-weight-medium mb-2">通報內容</h3>
        <div class="text-body-1" v-if="report.description">{{ report.description }}</div>
        <div class="text-medium-emphasis text-caption" v-else>（沒有內容）</div>
      </v-card-text>
    </v-card>

    <ReportFormDialog
      v-model="dialog"
      :communityId="communityId"
      :initialData="report"
      @submit="onEditSubmit"
    />
  </v-container>

  <v-container v-else class="py-8 d-flex justify-center">
    <v-progress-circular indeterminate color="primary" />
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'
import { toId } from '@/utils/id'
import ReportFormDialog from '@/components/admin/ReportFormDialog.vue'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const router = useRouter()
const communityId = toId(route.params.communityId)
const reportId = toId(route.params.reportId)

const loading = ref(true)
const error = ref('')
const report = ref({})

const statusOptions = ['待處理', '處理中', '已完成']

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await api.get(`/reports/${reportId}`)
    report.value = res.data.report
  } catch (e) {
    console.error('❌ 取得通報失敗', e)
    error.value = e?.response?.data?.message || '無法取得通報資料'
  } finally {
    loading.value = false
  }
}

const fmt = (iso) => (iso ? new Date(iso).toLocaleString('zh-TW') : '—')
const safeCategory = (v) => (typeof v === 'string' && v.trim() ? v : '其他')

const updateStatus = async (newStatus) => {
  try {
    await api.patch(`/reports/${reportId}/status`, { status: newStatus })
  } catch (e) {
    console.error('❌ 更新狀態失敗', e)
    alert(e?.response?.data?.message || '更新狀態失敗')
    fetchDetail()
  }
}

const dialog = ref(false)
const openEdit = () => (dialog.value = true)

const onEditSubmit = async (data) => {
  // 後端目前沒有 PUT /reports/:id（只有 updateReportStatus）
  // 若要可編輯內容，請確認你有這支 API；以下假設你補了：
  try {
    await api.put(`/reports/${reportId}`, {
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      image: data.image,
      communityId: communityId, // 防呆
    })
    alert('更新成功')
    fetchDetail()
  } catch (e) {
    console.error('❌ 更新通報內容失敗', e)
    alert(e?.response?.data?.message || '更新失敗')
  }
}

const onDelete = async () => {
  if (!confirm('確定刪除此通報？')) return
  try {
    await api.delete(`/reports/${reportId}`)
    alert('刪除成功')
    router.push(`/admin/${communityId}?tab=report`) // 依你的路由調整
  } catch (e) {
    console.error('❌ 刪除失敗', e)
    alert(e?.response?.data?.message || '刪除失敗')
  }
}

onMounted(fetchDetail)
</script>
