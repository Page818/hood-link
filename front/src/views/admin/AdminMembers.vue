<template>
  <v-container class="py-6">
    <BackToAdminDashboard :communityId="route.params.communityId" />
    <h1 class="text-h5 font-weight-bold mb-4">社區成員管理</h1>

    <!-- 守衛檢查 -->
    <v-progress-linear v-if="guardLoading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="guardError" type="error" class="mb-4">
      {{ guardError }}
    </v-alert>

    <template v-else>
      <!-- Tabs -->
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
              <!-- 顯示身分 -->
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

              <!-- 操作欄 -->
              <template #item.actions="{ item }">
                <div class="d-flex flex-wrap ga-2">
                  <!-- 指派管理員 -->
                  <v-btn
                    v-if="!isAdminId(item._id)"
                    size="small"
                    variant="tonal"
                    color="indigo"
                    :loading="isRowLoading(item._id, 'assign')"
                    :disabled="isSelf(item._id)"
                    @click="openDialog('assign', item)"
                  >
                    指派管理員
                  </v-btn>

                  <!-- 取消管理員 -->
                  <v-btn
                    v-else
                    size="small"
                    variant="tonal"
                    color="orange"
                    :loading="isRowLoading(item._id, 'revoke')"
                    :disabled="isSelf(item._id) || isLastAdmin(item._id)"
                    @click="openDialog('revoke', item)"
                  >
                    取消管理員
                  </v-btn>

                  <!-- 移除成員 -->
                  <v-btn
                    size="small"
                    variant="tonal"
                    color="red"
                    :loading="isRowLoading(item._id, 'remove')"
                    :disabled="isSelf(item._id) || isLastAdmin(item._id)"
                    @click="openDialog('remove', item)"
                  >
                    移除成員
                  </v-btn>
                </div>
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

  <!-- 通用確認對話框 -->
  <v-dialog v-model="confirmDialog.show" max-width="420">
    <v-card>
      <v-card-title class="text-h6">{{ confirmDialog.title }}</v-card-title>
      <v-card-text>{{ confirmDialog.message }}</v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="confirmDialog.show = false">取消</v-btn>
        <v-btn color="primary" @click="confirmAction">確認</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

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
import { useUserStore } from '@/stores/user'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const communityId = route.params.communityId

// 守衛：檢查是否為社區管理員
const { isAdmin, loading: guardLoading, error: guardError } = useAdminGuard(communityId)
const userStore = useUserStore()
const currentUserId = () => userStore?.user?.id || userStore?.user?._id

// 狀態管理
const tab = ref('members')
const members = ref([])
const admins = ref([])
const requests = ref([])
const loadingMembers = ref(false)
const loadingRequests = ref(false)
const rowLoading = ref({})

// 確認對話框狀態
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  action: null,
  item: null,
})

// 表格欄位
const memberHeaders = [
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '電話', key: 'phone' },
  { title: '身分', key: 'role', sortable: false },
  { title: '操作', key: 'actions', sortable: false },
]
const requestHeaders = [
  { title: '申請者姓名', key: 'user.name' },
  { title: 'Email', key: 'user.email' },
  { title: '申請時間', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false },
]

// helpers
const isAdminId = (uid) => admins.value.some((a) => String(a._id) === String(uid))
const isSelf = (uid) => String(uid) === String(currentUserId())
const isLastAdmin = (uid) => isAdminId(uid) && admins.value.length <= 1
const setRowLoading = (uid, key, val) => {
  const cur = rowLoading.value[uid] || {}
  rowLoading.value = { ...rowLoading.value, [uid]: { ...cur, [key]: val } }
}
const isRowLoading = (uid, key) => !!rowLoading.value?.[uid]?.[key]

// API：取得成員列表
const fetchMembers = async () => {
  try {
    loadingMembers.value = true
    const res = await api.get(`/communities/${communityId}/members`)
    members.value = res.data?.members || []
    admins.value = res.data?.admins || []
  } finally {
    loadingMembers.value = false
  }
}

// API：取得加入申請
const fetchRequests = async () => {
  try {
    loadingRequests.value = true
    const res = await api.get(`/communities/${communityId}/join-requests`)
    requests.value = res.data?.requests || []
  } finally {
    loadingRequests.value = false
  }
}

// Toast
const toast = ref({ show: false, message: '', color: 'success' })
const showToast = (msg, type = 'success') => {
  toast.value.message = msg
  toast.value.color = type
  toast.value.show = true
}

// 開啟對話框
const openDialog = (type, item) => {
  confirmDialog.value.show = true
  confirmDialog.value.item = item
  confirmDialog.value.action = type

  switch (type) {
    case 'assign':
      confirmDialog.value.title = '指派管理員'
      confirmDialog.value.message = `確定要指派「${item.name}」為管理員嗎？`
      break
    case 'revoke':
      confirmDialog.value.title = '取消管理員'
      confirmDialog.value.message = `確定要取消「${item.name}」的管理員權限嗎？`
      break
    case 'remove':
      confirmDialog.value.title = '移除成員'
      confirmDialog.value.message = `確定要移除「${item.name}」嗎？`
      break
  }
}

// 點擊確認後執行
const confirmAction = async () => {
  const { action, item } = confirmDialog.value
  confirmDialog.value.show = false

  if (action === 'assign') await handleAssignAdmin(item)
  else if (action === 'revoke') await handleRevokeAdmin(item)
  else if (action === 'remove') await handleRemoveMember(item)
}

// API：指派管理員
const handleAssignAdmin = async (item) => {
  setRowLoading(item._id, 'assign', true)
  try {
    await api.patch(`/communities/${communityId}/admins/add`, { userId: item._id })
    showToast(`已指派「${item.name}」為管理員`)
    await fetchMembers()
  } catch (err) {
    showToast(err?.response?.data?.message || '指派管理員失敗', 'error')
  } finally {
    setRowLoading(item._id, 'assign', false)
  }
}

// API：取消管理員
const handleRevokeAdmin = async (item) => {
  setRowLoading(item._id, 'revoke', true)
  try {
    await api.patch(`/communities/${communityId}/admins/remove`, { userId: item._id })
    showToast(`已取消「${item.name}」的管理員`)
    await fetchMembers()
  } catch (err) {
    showToast(err?.response?.data?.message || '取消管理員失敗', 'error')
  } finally {
    setRowLoading(item._id, 'revoke', false)
  }
}

// API：移除成員
const handleRemoveMember = async (item) => {
  setRowLoading(item._id, 'remove', true)
  try {
    await api.patch(`/communities/${communityId}/members/remove`, { userId: item._id })
    showToast(`已移除「${item.name}」`)
    await fetchMembers()
  } catch (err) {
    showToast(err?.response?.data?.message || '移除成員失敗', 'error')
  } finally {
    setRowLoading(item._id, 'remove', false)
  }
}

// 初始化
onMounted(async () => {
  await fetchMembers()
  await fetchRequests()
})
</script>
