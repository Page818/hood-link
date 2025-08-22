<!-- src/views/LoginView.vue -->
<template>
  <!-- heroTop 可拉近/拉遠大標；sideWidth 控兩側粒子區寬度 -->
  <AuthLayout heroTop="12%" sideWidth="50vw">
    <!-- 卡片外的大標 -->
    <template #hero>
      <div class="hero-wrap">
        <span class="hero-emoji">🏘️</span>
        <span class="hero-text brand-title">好鄰聚</span>
      </div>
    </template>

    <!-- 卡片（純奶油底 + 黑框陰影） -->
    <v-card class="login-card round-xl" elevation="0">
      <div class="text-center text-h6 font-weight-bold mb-4">登入</div>

      <v-form @submit.prevent="handleLogin">
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
        />

        <v-btn type="submit" size="large" class="btn-bubble-pink" block :loading="loading">
          登入
        </v-btn>

        <div class="text-caption mt-6 text-center">
          尚未註冊？<router-link to="/register">前往註冊</router-link>
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

const rules = { required: (v) => !!v || '此欄位為必填' }

const handleLogin = async () => {
  if (!form.account || !form.password) return
  loading.value = true
  try {
    const { data } = await api.post('/users/login', {
      account: form.account.trim(),
      password: form.password.trim(),
    })
    const token = data.token
    userStore.token = token
    localStorage.setItem('token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    const meRes = await api.get('/users/me')
    const fullUser = meRes.data.user
    userStore.setUser(fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    const hasCommunity = Array.isArray(fullUser.community) && fullUser.community.length > 0
    router.push(hasCommunity ? '/dashboard' : '/community/join')
  } catch (err) {
    if (import.meta.env.DEV) console.error('❌ 登入失敗', err)
    alert(err?.response?.data?.message || '登入失敗，請檢查帳號密碼')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ==== HERO 外觀（卡片外大標） ==== */
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
@media (min-width: 1280px) {
  .hero-text {
    font-size: clamp(48px, 5vw, 96px);
  }
  .hero-emoji {
    font-size: 2.2em;
  }
}
@media (min-width: 1920px) {
  .hero-text {
    font-size: clamp(64px, 4vw, 128px);
  }
  .hero-emoji {
    font-size: 2.6em;
  }
}

/* 視窗較矮時字與位置自適應（高度靠 AuthLayout 的 heroTop 控） */
@media (max-height: 700px) {
  .hero-text {
    font-size: clamp(28px, 5vw, 48px);
  }
  .hero-emoji {
    font-size: 1.4em;
  }
}

/* ==== 卡片（奶油底 + 黑框陰影海報感） ==== */
.login-card {
  width: clamp(320px, 86vw, 520px);
  background: var(--c-cream) !important;
  border: 2px solid #111 !important;
  box-shadow:
    0 4px 0 #111,
    0 8px 16px rgba(0, 0, 0, 0.08) !important;
  padding: clamp(16px, 3.2vw, 28px);
}

/* ==== 黑框奶油底輸入（海報感） ==== */
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
