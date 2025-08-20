<!-- views/reports/ReportDetailView.vue -->
<template>
  <v-container class="py-8">
    <BackToDashboard :community-id="communityId" />

    <v-progress-circular v-if="loading" indeterminate color="primary" />

    <v-alert v-else-if="error" type="error" class="my-4">
      {{ error }}
    </v-alert>

    <v-card v-else class="mx-auto" max-width="800" variant="outlined">
      <!-- 圖片（若有） -->
      <v-img
        v-if="report.image"
        :src="report.image"
        alt="通報圖片"
        height="240"
        cover
        class="rounded-t"
      />

      <!-- 標題 -->
      <v-card-title class="text-h6 font-weight-bold">
        {{ report.title || '（無標題）' }}
      </v-card-title>

      <!-- 資訊欄：分類、建立者、社區、時間 -->
      <v-card-subtitle class="text-caption text-medium-emphasis px-4">
        <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon>{{ safeCategory(report.category) }}
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-account</v-icon
          >{{ report.creator?.name || '—' }}</span
        >
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-home-outline</v-icon
          >{{ report.community?.name || '—' }}</span
        >
        <span class="ml-3"
          ><v-icon size="16" class="mr-1">mdi-clock-outline</v-icon
          >{{ formatDate(report.createdAt) }}</span
        >
      </v-card-subtitle>

      <v-divider class="mx-4 my-2" />

      <!-- 狀態與地點 -->
      <v-card-text class="px-4 d-flex flex-wrap align-center gap-3">
        <div>
          <span class="text-medium-emphasis text-caption mr-1">狀態：</span>
          <v-chip
            :color="getStatusColor(report.status)"
            variant="flat"
            size="small"
            class="text-white"
          >
            {{ report.status }}
          </v-chip>
        </div>
        <div v-if="report.location">
          <span class="text-medium-emphasis text-caption mr-1">地點：</span>
          <span class="text-body-2">{{ report.location }}</span>
        </div>
      </v-card-text>

      <v-divider class="mx-4 my-2" />

      <!-- 內容描述 -->
      <v-card-text class="px-4 pb-6 pt-2">
        <h3 class="text-subtitle-2 font-weight-medium mb-2">通報內容</h3>
        <div v-if="report.description" class="text-body-1">
          {{ report.description }}
        </div>
        <div v-else class="text-medium-emphasis text-caption">（沒有內容）</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import BackToDashboard from '@/components/BackToDashboard.vue'

const route = useRoute()
const communityId = route.params.communityId
const reportId = route.params.reportId

const loading = ref(true)
const error = ref('')
const report = ref({})
const getStatusColor = (status) => {
  switch (status) {
    case '待處理':
      return 'grey'
    case '處理中':
      return 'warning'
    case '已完成':
      return 'success'
    default:
      return 'default'
  }
}
const fetchReport = async () => {
  try {
    const res = await api.get(`/reports/${reportId}`)
    report.value = res.data.report
  } catch (err) {
    console.error('❌ 取得通報失敗', err)
    error.value = err?.response?.data?.message || '無法取得通報資料'
  } finally {
    loading.value = false
  }
}

const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

const safeCategory = (v) => (typeof v === 'string' && v.trim() ? v : '其他')

onMounted(fetchReport)
</script>
