<!-- src/views/me/MeView.vue -->
<template>
  <v-container class="py-6" fluid>
    <div class="d-flex">
      <!-- 左側選單 -->
      <v-navigation-drawer width="220" permanent location="left" class="pa-4">
        <v-list density="comfortable" nav>
          <v-list-item
            prepend-icon="mdi-account-circle"
            title="我的資料"
            value="profile"
            :active="activeTab === 'profile'"
            @click="switchTab('profile')"
          />
          <v-list-item
            prepend-icon="mdi-post"
            title="我的貼文"
            value="posts"
            :active="activeTab === 'posts'"
            @click="switchTab('posts')"
          />
          <v-list-item
            prepend-icon="mdi-alert-circle-outline"
            title="我的回報"
            value="reports"
            :active="activeTab === 'reports'"
            @click="switchTab('reports')"
          />
        </v-list>
      </v-navigation-drawer>

      <!-- 右側主內容 -->
      <div class="flex-grow-1 pa-6" style="max-width: 1200px">
        <!-- 返回大廳 -->
        <div class="mb-4 d-flex align-center gap-2">
          <BackToDashboard v-if="communityId" :community-id="communityId" />
          <v-btn v-else prepend-icon="mdi-arrow-left" variant="text" @click="goLobby">
            返回大廳
          </v-btn>
        </div>

        <!-- 我的資料 -->
        <section v-if="activeTab === 'profile'">
          <h2 class="text-h6 font-weight-bold mb-4">我的資料</h2>
          <v-alert v-if="profile.loadError" type="error" variant="tonal" class="mb-4">
            {{ profile.loadError }}
          </v-alert>

          <v-card :loading="profile.loading" class="pa-4" v-if="profile.form">
            <v-form ref="profileForm" v-model="profile.valid">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="姓名"
                    v-model="profile.form.name"
                    :rules="[rules.required]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="Email"
                    v-model="profile.form.email"
                    type="email"
                    :rules="[rules.email]"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="手機" v-model="profile.form.phone" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field label="LINE ID" v-model="profile.form.lineId" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch label="長者（isElder）" v-model="profile.form.isElder" inset />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    label="獨居（isLivingAlone）"
                    v-model="profile.form.isLivingAlone"
                    inset
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch label="接收每日關懷" v-model="profile.form.receiveDailyCheck" inset />
                </v-col>
                <v-col cols="12" md="6">
                  <v-switch
                    label="接收災害安否確認"
                    v-model="profile.form.receiveDisasterCheck"
                    inset
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    label="新密碼（可留空）"
                    v-model="profile.form.password"
                    :append-inner-icon="ui.showPwd ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="ui.showPwd = !ui.showPwd"
                    :type="ui.showPwd ? 'text' : 'password'"
                  />
                </v-col>
              </v-row>

              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  :loading="profile.saving"
                  :disabled="!profile.valid"
                  @click="handleSaveProfile"
                >
                  儲存變更
                </v-btn>
                <v-btn variant="text" @click="resetProfileForm">還原</v-btn>
              </div>
            </v-form>
          </v-card>
        </section>

        <!-- 我的貼文 -->
        <section v-else-if="activeTab === 'posts'">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">我的貼文</h2>
            <div class="text-body-2 text-medium-emphasis">共 {{ posts.total }} 則</div>
          </div>

          <v-skeleton-loader
            v-if="posts.loading && posts.items.length === 0"
            type="card@3"
            class="mb-4"
          />
          <v-alert v-else-if="posts.error" type="error" variant="tonal" class="mb-4">{{
            posts.error
          }}</v-alert>

          <template v-else>
            <v-empty-state
              v-if="posts.items.length === 0"
              headline="目前沒有貼文"
              description="之後發表的貼文會顯示在這裡"
            />
            <v-row v-else>
              <v-col v-for="p in posts.items" :key="p._id" cols="12" md="6">
                <v-card
                  class="h-100 click-card"
                  variant="outlined"
                  @click="goToDetail('post', p._id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter="goToDetail('post', p._id)"
                >
                  <v-card-item>
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                      {{ p.title || '（無標題）' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon
                      >{{ safeCategory(p.category) }}
                      <span class="ml-2"
                        ><v-icon size="16" class="mr-1">mdi-home-outline</v-icon
                        >{{ p.community?.name || '—' }}</span
                      >
                      <span class="ml-2"
                        ><v-icon size="16" class="mr-1">mdi-clock-outline</v-icon
                        >{{ formatDate(p.createdAt) }}</span
                      >
                    </div>
                  </v-card-item>
                  <v-card-text class="text-body-2">{{ p.content || '—' }}</v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <div class="d-flex align-center justify-end mt-4 gap-2">
              <v-btn
                variant="tonal"
                :disabled="posts.page <= 1 || posts.loading"
                @click="changePostsPage(posts.page - 1)"
                >上一頁</v-btn
              >
              <div class="text-caption">第 {{ posts.page }} / {{ posts.totalPages }} 頁</div>
              <v-btn
                variant="tonal"
                :disabled="posts.page >= posts.totalPages || posts.loading"
                @click="changePostsPage(posts.page + 1)"
                >下一頁</v-btn
              >
            </div>
          </template>
        </section>

        <!-- 我的回報 -->
        <section v-else>
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-h6 font-weight-bold">我的回報</h2>
            <div class="text-body-2 text-medium-emphasis">共 {{ reports.total }} 則</div>
          </div>

          <v-skeleton-loader
            v-if="reports.loading && reports.items.length === 0"
            type="card@3"
            class="mb-4"
          />
          <v-alert v-else-if="reports.error" type="error" variant="tonal" class="mb-4">{{
            reports.error
          }}</v-alert>

          <template v-else>
            <v-empty-state
              v-if="reports.items.length === 0"
              headline="目前沒有回報"
              description="提交的通報會顯示在這裡"
            />
            <v-row v-else>
              <v-col v-for="r in reports.items" :key="r._id" cols="12" md="6">
                <v-card
                  class="h-100 click-card"
                  variant="outlined"
                  @click="goToDetail('report', r._id)"
                  role="button"
                  tabindex="0"
                  @keydown.enter="goToDetail('report', r._id)"
                >
                  <v-card-item>
                    <div class="text-subtitle-1 font-weight-medium mb-1">
                      {{ r.title || '（無標題）' }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      <v-icon size="16" class="mr-1">mdi-tag-outline</v-icon
                      >{{ safeCategory(r.category) }}
                      <span class="ml-2"
                        ><v-icon size="16" class="mr-1">mdi-home-outline</v-icon
                        >{{ r.community?.name || '—' }}</span
                      >
                      <span class="ml-2"
                        ><v-icon size="16" class="mr-1">mdi-clock-outline</v-icon
                        >{{ formatDate(r.createdAt) }}</span
                      >
                    </div>
                  </v-card-item>
                  <v-card-text class="text-body-2">{{ r.content || '—' }}</v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <div class="d-flex align-center justify-end mt-4 gap-2">
              <v-btn
                variant="tonal"
                :disabled="reports.page <= 1 || reports.loading"
                @click="changeReportsPage(reports.page - 1)"
                >上一頁</v-btn
              >
              <div class="text-caption">第 {{ reports.page }} / {{ reports.totalPages }} 頁</div>
              <v-btn
                variant="tonal"
                :disabled="reports.page >= reports.totalPages || reports.loading"
                @click="changeReportsPage(reports.page + 1)"
                >下一頁</v-btn
              >
            </div>
          </template>
        </section>
      </div>
    </div>
    <v-snackbar v-model="ui.snackbar.show" timeout="2000" location="top" color="success">{{
      ui.snackbar.text
    }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'
import BackToDashboard from '@/components/BackToDashboard.vue'

const router = useRouter()
const userStore = useUserStore()
const profileForm = ref(null)

const ROUTES = {
  post: 'post.detail',
  report: 'reports.detail',
  lobby: 'community.dashboard',
}

const communityId = computed(
  () => userStore.user?.community?._id || userStore.user?.community?.id || null,
)
const activeTab = ref('profile')
const ui = ref({ showPwd: false, snackbar: { show: false, text: '' } })

const profile = ref({
  loading: false,
  saving: false,
  loadError: '',
  valid: true,
  form: null,
  original: null,
})

const rules = {
  required: (v) => !!v || v === false || '此欄位為必填',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email 格式不正確',
}

const fetchMe = async () => {
  profile.value.loading = true
  profile.value.loadError = ''
  try {
    const res = await api.get('/users/me')
    const u = res.data.user
    profile.value.form = {
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      lineId: u.lineId || '',
      isElder: !!u.isElder,
      isLivingAlone: !!u.isLivingAlone,
      receiveDailyCheck: !!u.receiveDailyCheck,
      receiveDisasterCheck: !!u.receiveDisasterCheck,
      password: '',
    }
    profile.value.original = JSON.parse(JSON.stringify(profile.value.form))
  } catch (err) {
    console.error('❌ 載入個人資料失敗', err)
    profile.value.loadError = '無法載入資料，請重新整理或稍後再試'
  } finally {
    profile.value.loading = false
  }
}

const handleSaveProfile = async () => {
  const result = await profileForm.value?.validate()
  const isValid = typeof result === 'object' ? result.valid : !!result
  if (!isValid) return

  try {
    profile.value.saving = true
    const payload = {}
    const form = profile.value.form
    const orig = profile.value.original
    for (const k in form) {
      if (form[k] !== orig[k] && form[k] !== undefined) {
        if (k === 'password' && !form[k]) continue
        payload[k] = form[k]
      }
    }

    if (Object.keys(payload).length === 0) {
      ui.value.snackbar = { show: true, text: '沒有變更內容' }
      return
    }

    const res = await api.patch('/users/me', payload)
    const updated = res.data.user
    profile.value.form = { ...updated, password: '' }
    profile.value.original = JSON.parse(JSON.stringify(profile.value.form))
    userStore.setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
    ui.value.snackbar = { show: true, text: '已更新' }
  } catch (err) {
    console.error('❌ 更新失敗', err)
    const msg = err?.response?.data?.message || '更新失敗，請稍後再試'
    ui.value.snackbar = { show: true, text: msg }
  } finally {
    profile.value.saving = false
  }
}

const resetProfileForm = () => {
  profile.value.form = JSON.parse(JSON.stringify(profile.value.original))
  profile.value.form.password = ''
}

const posts = ref({
  loading: false,
  error: '',
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  loadedOnce: false,
})
const reports = ref({
  loading: false,
  error: '',
  items: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  loadedOnce: false,
})

const safeCategory = (v) => (typeof v === 'string' && v.trim() ? v : '其他')
const formatDate = (iso) => {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

const fetchMyPosts = async () => {
  posts.value.loading = true
  posts.value.error = ''
  try {
    const res = await api.get('/users/me/posts', {
      params: { page: posts.value.page, limit: posts.value.limit },
    })
    const { items, total, totalPages } = res.data
    posts.value.items = Array.isArray(items)
      ? items.map((x) => ({ ...x, category: safeCategory(x.category) }))
      : []
    posts.value.total = total || 0
    posts.value.totalPages = Math.max(1, totalPages || 1)
    posts.value.loadedOnce = true
  } catch (err) {
    console.error('❌ 取得我的貼文失敗', err)
    posts.value.error = '無法取得我的貼文'
  } finally {
    posts.value.loading = false
  }
}

const fetchMyReports = async () => {
  reports.value.loading = true
  reports.value.error = ''
  try {
    const res = await api.get('/users/me/reports', {
      params: { page: reports.value.page, limit: reports.value.limit },
    })
    const { items, total, totalPages } = res.data
    reports.value.items = Array.isArray(items)
      ? items.map((x) => ({ ...x, category: safeCategory(x.category) }))
      : []
    reports.value.total = total || 0
    reports.value.totalPages = Math.max(1, totalPages || 1)
    reports.value.loadedOnce = true
  } catch (err) {
    console.error('❌ 取得我的回報失敗', err)
    reports.value.error = '無法取得我的回報'
  } finally {
    reports.value.loading = false
  }
}

const changePostsPage = (p) => {
  posts.value.page = Math.min(Math.max(1, p), posts.value.totalPages)
  fetchMyPosts()
}
const changeReportsPage = (p) => {
  reports.value.page = Math.min(Math.max(1, p), reports.value.totalPages)
  fetchMyReports()
}

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'profile' && !profile.value.form) fetchMe()
  if (tab === 'posts' && !posts.value.loadedOnce) fetchMyPosts()
  if (tab === 'reports' && !reports.value.loadedOnce) fetchMyReports()
}

const goToDetail = (type, id) => {
  const name = ROUTES[type]

  // 從目前卡片中找到對應的社區 ID
  let communityIdFromItem = null
  if (type === 'post') {
    const item = posts.value.items.find((p) => p._id === id)
    communityIdFromItem = item?.community?._id || item?.community?.id || null
  } else if (type === 'report') {
    const item = reports.value.items.find((r) => r._id === id)
    communityIdFromItem = item?.community?._id || item?.community?.id || null
  }

  if (!name || !id || !communityIdFromItem) return

  router.push({
    name,
    params: { communityId: communityIdFromItem, [`${type}Id`]: id },
  })
}
const goLobby = () => {
  if (communityId.value) {
    router.push({ name: ROUTES.lobby, params: { communityId: communityId.value } })
  } else {
    router.push('/')
  }
}

onMounted(() => {
  fetchMe()
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
.click-card {
  cursor: pointer;
}
.click-card:focus {
  outline: 2px solid rgba(0, 0, 0, 0.2);
  outline-offset: 2px;
}
</style>
