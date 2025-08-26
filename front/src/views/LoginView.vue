<!-- src/views/LoginView.vue -->
<template>
  <AuthLayout heroTop="12%" sideWidth="50vw">
    <!-- hero 區塊 -->
    <template #hero>
      <div class="hero-wrap">
        <span class="hero-emoji">🏘️</span>
        <span class="hero-text brand-title">好鄰聚</span>
      </div>
    </template>

    <!-- 登入卡片 -->
    <v-card class="login-card round-xl" elevation="0">
      <div class="text-center text-h6 font-weight-bold mb-4">登入</div>

      <!-- 錯誤提示 -->
      <v-alert v-if="errorMsg" type="error" density="compact" class="mb-4">
        {{ errorMsg }}
      </v-alert>

      <v-form @submit.prevent="handleLogin">
        <!-- 帳號 -->
        <v-text-field
          v-model="form.account"
          label="手機號碼或 Email"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-account"
          density="comfortable"
          hide-details="auto"
          class="mb-3 round-xl poster-input"
          autocomplete="username"
          variant="solo-filled"
        />

        <!-- 密碼 -->
        <v-text-field
          v-model="form.password"
          :type="showPwd ? 'text' : 'password'"
          label="密碼"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPwd = !showPwd"
          density="comfortable"
          hide-details="auto"
          class="mb-4 round-xl poster-input"
          autocomplete="current-password"
          variant="solo-filled"
          :aria-label="showPwd ? '隱藏密碼' : '顯示密碼'"
        />

        <!-- 登入按鈕 -->
        <v-btn
          type="submit"
          size="large"
          class="btn-bubble-pink"
          block
          :loading="loading"
          :disabled="loading"
        >
          登入
        </v-btn>

        <!-- 前往註冊 -->
        <div class="text-caption mt-6 text-center">
          尚未註冊？
          <router-link to="/register">前往註冊</router-link>
        </div>
      </v-form>
    </v-card>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api.js'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const showPwd = ref(false)
const errorMsg = ref('')

const rules = { required: (v) => !!v || '此欄位為必填' }

const handleLogin = async () => {
  if (!form.account || !form.password) return
  loading.value = true
  errorMsg.value = ''
  try {
    // 1. 登入拿 Token
    const { data } = await api.post('/users/login', {
      account: form.account.trim(),
      password: form.password.trim(),
    })
    const token = data.token
    userStore.token = token
    localStorage.setItem('token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    // 2. 取得完整使用者資料
    const meRes = await api.get('/users/me')
    const fullUser = meRes?.data?.user || null
    if (!fullUser) throw new Error('無法取得使用者資料')

    userStore.setUser(fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    // 3. 判斷導向
    const hasCommunity = Array.isArray(fullUser.community) && fullUser.community.length > 0
    router.push(hasCommunity ? '/dashboard' : '/community/join')
  } catch (err) {
    console.error('❌ 登入失敗', err)
    errorMsg.value = err?.response?.data?.message || '登入失敗，請檢查帳號密碼'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ==== HERO 樣式 ==== */
.hero-wrap {
  display: inline-flex;
  white-space: nowrap;
  align-items: center;
  gap: 10px;
}
.brand-title {
  font-family:
    'HoodBrandTitle', 'Taipei Sans TC', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei',
    sans-serif;
}
.hero-text {
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #111;
  line-height: 1;
  font-size: clamp(36px, 6vw, 64px);
}
.hero-emoji {
  font-size: 1.8em;
}

/* ==== 登入卡片 ==== */
.login-card {
  width: clamp(320px, 86vw, 520px);
  background: var(--c-cream) !important;
  border: 2px solid #111 !important;
  box-shadow:
    0 4px 0 #111,
    0 8px 16px rgba(0, 0, 0, 0.08) !important;
  padding: clamp(16px, 3.2vw, 28px);
}

/* ==== 奶油底輸入框 ==== */
.poster-input :deep(.v-field) {
  border: 2px solid #111 !important;
  border-radius: 14px !important;
  background: var(--c-cream) !important;
  box-shadow: 0 2px 0 rgba(17, 17, 17, 0.08) !important;
}
.poster-input :deep(.v-field__outline) {
  display: none !important;
}
.poster-input :deep(.v-field__overlay) {
  background: var(--c-cream) !important;
}
.poster-input :deep(.v-label) {
  color: #111 !important;
  opacity: 0.8;
}
.poster-input :deep(.v-icon),
.poster-input :deep(.v-field__prepend-inner .v-icon),
.poster-input :deep(.v-field__append-inner .v-icon) {
  color: #111 !important;
}
.poster-input :deep(.v-field.v-field--focused) {
  box-shadow:
    0 0 0 3px rgba(17, 17, 17, 0.12),
    0 2px 0 rgba(17, 17, 17, 0.12) !important;
}
.poster-input :deep(.v-field:hover) .v-field__overlay {
  background: #fff5e8 !important;
}
</style>
