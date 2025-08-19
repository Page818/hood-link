<!-- views/me/MeView.vue -->
<template>
  <div class="d-flex">
    <!-- 左側選單 -->
    <v-navigation-drawer width="220" permanent location="left" class="pa-4">
      <v-list density="comfortable" nav>
        <v-list-item
          prepend-icon="mdi-account-circle"
          title="我的資料"
          value="profile"
          @click="activeTab = 'profile'"
        />
        <v-list-item
          prepend-icon="mdi-post"
          title="我的貼文"
          value="posts"
          @click="activeTab = 'posts'"
        />
        <v-list-item
          prepend-icon="mdi-alert-circle-outline"
          title="我的回報"
          value="reports"
          @click="activeTab = 'reports'"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- 右側主內容 -->
    <div class="flex-grow-1 pa-6">
      <!-- 我的資料 -->
      <div v-if="activeTab === 'profile'">
        <div class="text-h6 font-weight-bold mb-4">我的資料</div>
        <v-card class="pa-4">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.name"
                label="名字"
                :error-messages="nameErr"
                @blur="touch.name = true"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.phone"
                label="電話"
                :error-messages="phoneErr"
                @blur="touch.phone = true"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profile.email"
                label="電子信箱"
                :error-messages="emailErr"
                @blur="touch.email = true"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="profile.lineId" label="Line ID（選填）" />
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row>
            <v-col cols="12" md="3">
              <v-switch v-model="profile.isElder" inset label="長者（需關懷）" />
            </v-col>
            <v-col cols="12" md="3">
              <v-switch v-model="profile.isLivingAlone" inset label="獨居" />
            </v-col>
            <v-col cols="12" md="3">
              <v-switch v-model="profile.receiveDailyCheck" inset label="每日關懷通知" />
            </v-col>
            <v-col cols="12" md="3">
              <v-switch v-model="profile.receiveDisasterCheck" inset label="災害關懷通知" />
            </v-col>
          </v-row>

          <div class="d-flex ga-2">
            <v-btn
              color="primary"
              :loading="savingProfile"
              :disabled="!profileValid"
              @click="updateProfile"
            >
              儲存修改
            </v-btn>
          </div>
        </v-card>
      </div>

      <!-- 我的貼文 -->
      <div v-else-if="activeTab === 'posts'">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-h6 font-weight-bold">我的貼文</div>
          <v-select
            v-model="postQ.category"
            :items="['全部', '鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']"
            density="comfortable"
            style="max-width: 180px"
            @update:modelValue="resetPosts"
          />
        </div>

        <v-skeleton-loader v-if="loadingPosts" type="card@3" />
        <v-alert v-else-if="postItems.length === 0" variant="tonal">目前沒有發表過貼文</v-alert>

        <v-row v-else>
          <v-col v-for="p in postItems" :key="p._id" cols="12" md="6" lg="4">
            <v-card class="h-100" @click="goPost(p)" hover>
              <v-card-title class="text-wrap">{{ p.title }}</v-card-title>
              <v-card-subtitle>{{ p.category }} · {{ fmt(p.createdAt) }}</v-card-subtitle>
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex justify-center ga-2 my-4" v-if="postTotalPages > 1">
          <v-btn size="small" :disabled="postPage <= 1" @click="prevPosts">上一頁</v-btn>
          <div class="d-flex align-center">第 {{ postPage }} / {{ postTotalPages }} 頁</div>
          <v-btn size="small" :disabled="postPage >= postTotalPages" @click="nextPosts"
            >下一頁</v-btn
          >
        </div>
      </div>

      <!-- 我的回報 -->
      <div v-else-if="activeTab === 'reports'">
        <div class="d-flex align-center justify-space-between mb-4">
          <div class="text-h6 font-weight-bold">我的回報</div>
          <div class="d-flex ga-2">
            <v-select
              v-model="reportQ.category"
              :items="['全部', '水電', '設備', '環境', '治安', '其他']"
              density="comfortable"
              style="max-width: 160px"
              @update:modelValue="resetReports"
            />
            <v-select
              v-model="reportQ.status"
              :items="['全部', '待處理', '處理中', '已完成']"
              density="comfortable"
              style="max-width: 160px"
              @update:modelValue="resetReports"
            />
          </div>
        </div>

        <v-skeleton-loader v-if="loadingReports" type="card@3" />
        <v-alert v-else-if="reportItems.length === 0" variant="tonal">目前沒有提交過回報</v-alert>

        <v-row v-else>
          <v-col v-for="r in reportItems" :key="r._id" cols="12" md="6" lg="4">
            <v-card class="h-100">
              <v-card-title class="text-wrap">{{ r.title }}</v-card-title>
              <v-card-subtitle>
                {{ r.category }}
                <v-chip size="small" class="ml-1">{{ r.status || 'open' }}</v-chip>
              </v-card-subtitle>
              <v-card-text class="text-caption text-medium-emphasis"
                >建立於 {{ fmt(r.createdAt) }}</v-card-text
              >
            </v-card>
          </v-col>
        </v-row>

        <div class="d-flex justify-center ga-2 my-4" v-if="reportTotalPages > 1">
          <v-btn size="small" :disabled="reportPage <= 1" @click="prevReports">上一頁</v-btn>
          <div class="d-flex align-center">第 {{ reportPage }} / {{ reportTotalPages }} 頁</div>
          <v-btn size="small" :disabled="reportPage >= reportTotalPages" @click="nextReports"
            >下一頁</v-btn
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'

// 用來處理資料驗證規則
const rules = {
  required: (v) => (v && String(v).trim().length) > 0 || '此欄位為必填',
  phone: (v) => !v || /^\d{8,15}$/.test(String(v)) || '電話格式不正確',
  email: (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)) || 'Email 格式不正確',
}

// 用來接收個人資料的欄位
const profile = ref({
  name: '',
  phone: '',
  email: '',
  lineId: '',
})

const touch = ref({
  name: false,
  phone: false,
  email: false,
})
const activeTab = ref('profile')

const nameErr = computed(() =>
  touch.value.name ? [rules.required(profile.value.name)].filter(Boolean) : [],
)
const phoneErr = computed(() =>
  touch.value.phone ? [rules.phone(profile.value.phone)].filter(Boolean) : [],
)
const emailErr = computed(() =>
  touch.value.email ? [rules.email(profile.value.email)].filter(Boolean) : [],
)

// 檢查是否有效
const isValid = computed(
  () =>
    rules.required(profile.value.name) === true &&
    rules.phone(profile.value.phone) === true &&
    rules.email(profile.value.email) === true,
)

// 用來取得並更新使用者資料
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

// 用來載入使用者資料
async function loadProfile() {
  try {
    const { data } = await api.get('/users/me')
    profile.value = { ...data.user }
  } catch (err) {
    console.error('❌ 載入資料失敗', err)
  }
}

// 更新使用者資料
async function updateProfile() {
  try {
    await userStore.ensureUser?.(api)
    await api.patch('/users/update', profile.value)
    alert('個人資料更新成功')
  } catch (err) {
    console.error('❌ 更新資料失敗', err)
  }
}

// 觸發資料載入
onMounted(loadProfile)
</script>
