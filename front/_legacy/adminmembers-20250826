<template>
  <v-container class="py-6">
    <h1 class="text-h5 font-weight-bold mb-4">社區成員管理</h1>

    <!-- 守衛檢查 -->
    <v-progress-linear v-if="guardLoading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="guardError" type="error" class="mb-4">
      {{ guardError }}
    </v-alert>

    <!-- 只有管理員才能看到 -->
    <template v-else>
      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="members">成員與管理員</v-tab>
        <v-tab value="requests">加入申請</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- 成員列表 -->
        <v-window-item value="members">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="text-subtitle-1">成員列表</div>
              <v-btn variant="text" prepend-icon="mdi-refresh" @click="fetchMembers">
                重新整理
              </v-btn>
            </v-card-title>

            <v-data-table
              :headers="memberHeaders"
              :items="members"
              :loading="loadingMembers"
              density="comfortable"
              item-key="_id"
            >
              <template #item.role="{ item }">
                <v-chip
                  v-if="isAdminId(item._id)"
                  color="deep-purple"
                  size="small"
                  class="text-white"
                >
                  管理員
                </v-chip>
                <span v-else>—</span>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- 加入申請 -->
        <v-window-item value="requests">
          <v-card variant="outlined" class="pa-4">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="text-subtitle-1">待審核加入申請</div>
              <v-btn variant="text" prepend-icon="mdi-refresh" @click="fetchRequests">
                重新整理
              </v-btn>
            </v-card-title>

            <!-- 無申請 -->
            <v-alert v-if="requests.length === 0" type="info" variant="tonal" class="mt-4">
              目前沒有待審核的申請
            </v-alert>

            <!-- 有申請 -->
            <v-data-table
              v-else
              :headers="requestHeaders"
              :items="requests"
              :loading="loadingRequests"
              density="comfortable"
              item-key="_id"
            >
              <template #item.user.name="{ item }">
                {{ item.user?.name || '—' }}
              </template>
              <template #item.user.email="{ item }">
                {{ item.user?.email || '—' }}
              </template>
              <template #item.createdAt="{ item }">
                {{ new Date(item.createdAt).toLocaleString() }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  size="small"
                  color="green"
                  variant="tonal"
                  @click="reviewRequest(item._id, true)"
                >
                  核准
                </v-btn>
                <v-btn
                  size="small"
                  color="red"
                  variant="tonal"
                  class="ml-2"
                  @click="reviewRequest(item._id, false)"
                >
                  拒絕
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>
    </template>
  </v-container>

  <!-- 全域 Toast -->
  <v-snackbar v-model="toast.show" :color="toast.color" timeout="3000" location="top">
    {{ toast.message }}
  </v-snackbar>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { useAdminGuard } from '@/composables/useAdminGuard'

const route = useRoute()
const communityId = route.params.communityId

// 用守衛檢查管理員身分
const { isAdmin, loading: guardLoading, error: guardError } = useAdminGuard(communityId)

const tab = ref('members')
const members = ref([])
const admins = ref([])
const requests = ref([])
const loadingMembers = ref(false)
const loadingRequests = ref(false)

/* ---------- 表格設定 ---------- */
const memberHeaders = [
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '電話', key: 'phone' },
  { title: '身分', key: 'role', sortable: false },
]

const requestHeaders = [
  { title: '申請者姓名', key: 'user.name' },
  { title: 'Email', key: 'user.email' },
  { title: '申請時間', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false },
]

const isAdminId = (uid) => admins.value.some((a) => String(a._id) === String(uid))

/* ---------- 取得成員列表 ---------- */
const fetchMembers = async () => {
  try {
    loadingMembers.value = true
    const res = await api.get(`/communities/${communityId}/members`)
    members.value = res.data?.members || []
    admins.value = res.data?.admins || []
  } catch (err) {
    console.error('[AdminMembers] 成員列表載入失敗', err)
  } finally {
    loadingMembers.value = false
  }
}

/* ---------- 取得加入申請 ---------- */
const fetchRequests = async () => {
  try {
    loadingRequests.value = true
    const res = await api.get(`/communities/${communityId}/join-requests`)
    requests.value = res.data?.requests || []
    console.log('[AdminMembers] 待審核申請:', requests.value)
  } catch (err) {
    console.error('[AdminMembers] 申請列表載入失敗', err)
  } finally {
    loadingRequests.value = false
  }
}

/* ---------- Toast 設定 ---------- */
const toast = ref({
  show: false,
  message: '',
  color: 'success',
})

const showToast = (msg, type = 'success') => {
  toast.value.message = msg
  toast.value.color = type
  toast.value.show = true
}

/* ---------- 審核申請 ---------- */
const reviewRequest = async (requestId, approve) => {
  try {
    const { data } = await api.post(`/communities/${communityId}/review-join-request`, {
      requestId,
      decision: approve ? 'approved' : 'rejected',
    })

    if (data.success) {
      showToast(approve ? '✅ 已核准該申請' : '❌ 已拒絕該申請', 'success')
    } else {
      showToast(data.message || '操作失敗，請稍後再試', 'error')
    }

    // 操作成功 → 同時刷新
    await fetchRequests()
    await fetchMembers()
  } catch (err) {
    console.error('[AdminMembers] 審核失敗', err)
    showToast('伺服器發生錯誤', 'error')
  }
}

/* ---------- 初始化 ---------- */
onMounted(async () => {
  await fetchMembers()
  await fetchRequests()
})
</script>
