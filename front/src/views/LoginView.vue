<template>
  <!-- 保持既有模板，重點是：container 用 login-root；欄位加 poster-input；卡片奶油色 -->
  <v-container fluid class="login-root d-flex align-center justify-center">
    <v-card class="login-card round-xl soft-shadow pa-6 pa-sm-8" elevation="0">
      <!-- <v-card-title class="text-h6 text-center pb-2">登入《好鄰聚》</v-card-title> -->
      <v-card-text class="pt-0">
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="form.account"
            label="手機號碼或 Email"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account"
            density="comfortable"
            hide-details="auto"
            class="mb-3 round-xl poster-input"
            variant="solo-filled"
            autocomplete="username"
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
        </v-form>

        <div class="text-caption mt-6 text-center">
          尚未註冊？<router-link to="/register">前往註冊</router-link>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api.js'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({ account: '', password: '' })
const loading = ref(false)
const showPwd = ref(false)

const rules = {
  required: (v) => !!v || '此欄位為必填',
}

const handleLogin = async () => {
  if (!form.account || !form.password) return
  loading.value = true
  try {
    const res = await api.post('/users/login', {
      account: form.account.trim(),
      password: form.password.trim(),
    })
    const { token } = res.data
    userStore.token = token
    localStorage.setItem('token', token)

    const meRes = await api.get('/users/me')
    const fullUser = meRes.data.user
    userStore.setUser(fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    const hasCommunity = Array.isArray(fullUser.community) && fullUser.community.length > 0
    router.push(hasCommunity ? '/dashboard' : '/community/join')
  } catch (err) {
    console.error('❌ 登入失敗', err)
    const msg = err?.response?.data?.message || '登入失敗，請檢查帳號密碼'
    alert(msg)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* .login-root {
  overflow: hidden;
  background: var(--c-cream);
  padding: 0;
  display: grid;
  place-items: center;
} */

/* .login-card {
  width: clamp(320px, 90vw, 460px);
  background: var(--c-cream) !important;
  border: none !important;
  max-height: none;
} */
/* ====== Login page container ====== */
.login-root {
  height: 100%; /* 配合 .app-frame: fixed + inset */
  overflow: hidden; /* 整頁不捲動 */
  background: var(--c-cream); /* 純奶油 */
  padding: 0;
  display: grid;
  place-items: center;
}

/* ====== Card ====== */
.login-card {
  width: clamp(320px, 90vw, 460px);
  background: var(--c-cream) !important; /* 與背景同色，避免雙框 */
  border: none !important;
  max-height: none; /* 兩欄位不需滾動 */
}

/* ====== Poster-style inputs（for variant="solo-filled"） ====== */
.poster-input :deep(.v-field) {
  border: 2px solid #111 !important; /* 黑框 */
  border-radius: 14px !important;
  background: var(--c-cream) !important; /* 奶油底 */
  box-shadow: 0 2px 0 rgba(17, 17, 17, 0.08) !important; /* 微貼紙感 */
}

/* 移除 filled/solo 的 overlay/outline 影響，維持我們的黑框與底色 */
.poster-input :deep(.v-field__outline) {
  display: none !important;
}
.poster-input :deep(.v-field__overlay) {
  background: var(--c-cream) !important;
}

/* Label / Icon 黑色 */
.poster-input :deep(.v-label) {
  color: #111 !important;
  opacity: 0.8;
}
.poster-input :deep(.v-icon),
.poster-input :deep(.v-field__prepend-inner .v-icon),
.poster-input :deep(.v-field__append-inner .v-icon) {
  color: #111 !important;
}

/* Focus：柔和外光暈 */
.poster-input :deep(.v-field.v-field--focused) {
  box-shadow:
    0 0 0 3px rgba(17, 17, 17, 0.12),
    0 2px 0 rgba(17, 17, 17, 0.12) !important;
}

/* Hover：奶油底微亮 */
.poster-input :deep(.v-field:hover) .v-field__overlay {
  background: #fff5e8 !important;
}
</style>
