<!-- src/views/admin/AdminMembers.vue -->
<template>
  <v-container class="py-6">
    <!-- A1) 守衛載入中：顯示進度條 -->
    <v-progress-linear v-if="guard.loading" indeterminate color="primary" class="mb-4" />

    <!-- A2) 非管理員（或驗證失敗）顯示訊息；實際上已被 composable redirect -->
    <v-alert v-else-if="guard.error" type="error" class="mb-4">{{ guard.error }}</v-alert>

    <!-- A3) 通過檢查才渲染原本內容 -->
    <template v-else>
      <h1 class="text-h5 font-weight-bold mb-4">社區成員管理</h1>

      <v-tabs v-model="tab" class="mb-4">
        <v-tab value="members">成員與管理員</v-tab>
        <v-tab value="requests">加入申請</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <!-- 成員 / 管理員 -->
        <v-window-item value="members">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="text-subtitle-1">成員列表</div>
              <div class="d-flex align-center ga-2">
                <!-- 上傳預留 -->
                <v-btn variant="text" prepend-icon="mdi-cloud-upload" @click="triggerUpload">
                  上傳附件（預留）
                </v-btn>
                <!-- 之後可用 composable 控制顯示/禁用 -->
                <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openAddDialog">
                  新增成員
                </v-btn>
              </div>
            </v-card-title>

            <v-data-table
              :headers="memberHeaders"
              :items="members"
              :loading="loadingMembers"
              density="comfortable"
              class="px-2"
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

              <template #item.actions="{ item }">
                <v-btn
                  v-if="!isAdminId(item._id)"
                  size="small"
                  variant="text"
                  prepend-icon="mdi-shield-plus"
                  @click="promoteToAdmin(item)"
                >
                  設為管理員
                </v-btn>

                <v-btn
                  v-else
                  size="small"
                  variant="text"
                  color="warning"
                  prepend-icon="mdi-shield-remove"
                  @click="demoteAdmin(item)"
                >
                  取消管理員
                </v-btn>

                <v-btn
                  size="small"
                  variant="text"
                  color="red"
                  prepend-icon="mdi-account-remove"
                  @click="removeMember(item)"
                >
                  移除成員
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <!-- 加入申請 -->
        <v-window-item value="requests">
          <v-card variant="outlined">
            <v-card-title class="d-flex align-center justify-space-between">
              <div class="text-subtitle-1">待審核申請</div>
              <v-btn variant="text" prepend-icon="mdi-refresh" @click="fetchRequests">
                重新整理
              </v-btn>
            </v-card-title>

            <v-data-table
              :headers="requestHeaders"
              :items="requests"
              :loading="loadingRequests"
              density="comfortable"
              class="px-2"
              item-key="_id"
            >
              <template #item.user="{ item }">
                {{ item.user?.name || '—' }}
              </template>
              <template #item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              <template #item.actions="{ item }">
                <v-btn
                  size="small"
                  color="success"
                  variant="text"
                  prepend-icon="mdi-check"
                  @click="reviewRequest(item, 'approved')"
                >
                  核准
                </v-btn>
                <v-btn
                  size="small"
                  color="red"
                  variant="text"
                  prepend-icon="mdi-close"
                  @click="reviewRequest(item, 'rejected')"
                >
                  拒絕
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- 新增成員對話框 -->
      <MemberAddDialog v-model="addDialog" :community-id="communityId" @added="onAddedMember" />
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { toId } from '@/utils/id'
import MemberAddDialog from '@/components/admin/MemberAddDialog.vue'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'
import { useAdminGuard } from '@/composables/useAdminGuard'

const route = useRoute()
// const communityId = toId(route.params.communityId)
const communityId = String(route.params.communityId || '')

/* ✅ A) 呼叫守衛 */
// const guard = useAdminGuard(communityId)
const guard = useAdminGuard(communityId, {
  redirectOnFail: false, // 先關掉，方便排錯
  verbose: true,
})

const tab = ref('members')

/** Cloudinary（預留） */
const { pickAndUpload, lastResult } = useCloudinaryUploadSigned()
const triggerUpload = async () => {
  await pickAndUpload()
  if (lastResult.value?.secure_url) console.log('已上傳附件：', lastResult.value.secure_url)
}

/** 成員/管理員清單 */
const members = ref([])
const admins = ref([])
const loadingMembers = ref(false)

const memberHeaders = [
  { title: '姓名', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: '電話', key: 'phone' },
  { title: '身分', key: 'role', sortable: false },
  { title: '操作', key: 'actions', sortable: false },
]

// 用於渲染徽章與切換按鈕狀態（非頁面權限）
const isAdminId = (uid) => admins.value.some((a) => toId(a) === toId(uid))

const fetchMembers = async () => {
  console.log('[members] communityId =', communityId)

  loadingMembers.value = true
  try {
    const res = await api.get(`/communities/${communityId}/members`)
    admins.value = res.data.admins || []
    members.value = res.data.members || []
  } catch (err) {
    console.error('❌ 取得成員失敗', err)
    alert(err?.response?.data?.message || '無法取得成員清單')
  } finally {
    loadingMembers.value = false
  }
}

const promoteToAdmin = async (user) => {
  if (!confirm(`將 ${user.name || '該使用者'} 設為管理員？`)) return
  try {
    await api.patch(`/communities/${communityId}/admins/add`, { userId: toId(user) })
    await fetchMembers()
  } catch (err) {
    console.error('❌ 指派管理員失敗', err)
    alert(err?.response?.data?.message || '指派管理員失敗')
  }
}

const demoteAdmin = async (user) => {
  if (!confirm(`取消 ${user.name || '該使用者'} 的管理員？`)) return
  try {
    await api.patch(`/communities/${communityId}/admins/remove`, { userId: toId(user) })
    await fetchMembers()
  } catch (err) {
    console.error('❌ 取消管理員失敗', err)
    alert(err?.response?.data?.message || '取消管理員失敗')
  }
}

const removeMember = async (user) => {
  if (!confirm(`移除成員：${user.name || '該使用者'}？`)) return
  try {
    await api.patch(`/communities/${communityId}/members/remove`, { userId: toId(user) })
    await fetchMembers()
  } catch (err) {
    console.error('❌ 移除成員失敗', err)
    alert(err?.response?.data?.message || '移除成員失敗')
  }
}

/** 申請清單 */
const requests = ref([])
const loadingRequests = ref(false)

const requestHeaders = [
  { title: '申請人', key: 'user' },
  { title: '申請時間', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false },
]

const fetchRequests = async () => {
  loadingRequests.value = true
  try {
    const res = await api.get(`/communities/${communityId}/join-requests`)
    requests.value = res.data.requests || []
  } catch (err) {
    console.error('❌ 取得申請失敗', err)
    alert(err?.response?.data?.message || '無法取得申請清單')
  } finally {
    loadingRequests.value = false
  }
}

const reviewRequest = async (item, decision) => {
  try {
    await api.post(`/communities/review-join-request`, {
      requestId: toId(item),
      decision, // 'approved' | 'rejected'
    })
    await Promise.all([fetchRequests(), fetchMembers()])
  } catch (err) {
    console.error('❌ 審核失敗', err)
    alert(err?.response?.data?.message || '審核失敗')
  }
}

/** 新增成員 Dialog */
const addDialog = ref(false)
const openAddDialog = () => (addDialog.value = true)
const onAddedMember = () => {
  addDialog.value = false
  fetchMembers()
}

/** 掛載：通過守衛後再載入資料 */
onMounted(async () => {
  // if (!guard.loading && !guard.isAdmin) return
  // guard.loading 初次可能還是 true，等下一個 tick 由模板控制不渲染；簡單做法：照常叫
  await Promise.all([fetchMembers(), fetchRequests()])
})

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleString('zh-TW', { hour12: false })
  } catch {
    return '—'
  }
}
</script>
