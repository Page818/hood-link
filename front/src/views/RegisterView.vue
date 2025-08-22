<!-- src/views/RegisterView.vue -->
<template>
  <AuthLayout :sideWidth="'50vw'">
    <!-- 卡片外的大標 -->
    <template #hero>
      <div class="hero-wrap">
        <span class="hero-emoji">🏘️</span>
        <span class="hero-text brand-title">好鄰聚</span>
      </div>
    </template>

    <!-- 卡片 -->
    <v-card class="register-card round-xl" elevation="0">
      <div class="text-center text-h6 font-weight-bold mb-4">註冊</div>

      <v-form @submit.prevent="handleRegister">
        <!-- 顯示名稱（必填） -->
        <v-text-field
          v-model="form.name"
          label="顯示名稱"
          :rules="[rules.required]"
          prepend-inner-icon="mdi-account"
          density="comfortable"
          hide-details="auto"
          class="mb-3 round-xl poster-input"
          variant="solo-filled"
          autocomplete="name"
        />

        <!-- 手機 / Email 二選一 -->
        <v-select
          v-model="method"
          :items="['手機', 'Email']"
          label="選擇註冊方式"
          density="comfortable"
          hide-details="auto"
          class="mb-3 round-xl poster-input"
          variant="solo-filled"
        />

        <!-- 手機 -->
        <v-text-field
          v-if="method === '手機'"
          v-model="form.phone"
          label="手機號碼"
          :rules="[rules.required, rules.phone]"
          :error-messages="phoneErrorMsg"
          :append-inner-icon="
            phoneChecking
              ? 'mdi-loading'
              : phoneAvailable === false
                ? 'mdi-close-circle'
                : phoneAvailable === true
                  ? 'mdi-check-circle'
                  : ''
          "
          prepend-inner-icon="mdi-phone"
          density="comfortable"
          hide-details="auto"
          class="mb-3 round-xl poster-input"
          variant="solo-filled"
          autocomplete="tel"
        />

        <!-- Email -->
        <v-text-field
          v-else
          v-model="form.email"
          label="Email"
          :rules="[rules.required, rules.email]"
          :error-messages="emailErrorMsg"
          :append-inner-icon="
            emailChecking
              ? 'mdi-loading'
              : emailAvailable === false
                ? 'mdi-close-circle'
                : emailAvailable === true
                  ? 'mdi-check-circle'
                  : ''
          "
          prepend-inner-icon="mdi-email"
          density="comfortable"
          hide-details="auto"
          class="mb-3 round-xl poster-input"
          variant="solo-filled"
          autocomplete="email"
        />

        <!-- 密碼 -->
        <v-text-field
          v-model="form.password"
          :type="showPwd ? 'text' : 'password'"
          label="密碼"
          :rules="[rules.required, rules.minLength]"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPwd ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPwd = !showPwd"
          density="comfortable"
          hide-details="auto"
          class="mb-2 round-xl poster-input"
          variant="solo-filled"
          autocomplete="new-password"
        />
        <!-- 密碼強度條 -->
        <v-progress-linear
          :model-value="pwdStrength.score"
          :color="pwdStrength.color"
          height="6"
          class="mb-4"
          rounded
        />

        <!-- 選填 -->
        <v-text-field
          v-model="form.lineId"
          label="LINE ID（選填）"
          prepend-inner-icon="mdi-chat"
          density="comfortable"
          hide-details="auto"
          class="mb-2 round-xl poster-input"
          variant="solo-filled"
        />
        <v-checkbox v-model="form.isElder" label="我是長者" density="comfortable" />
        <v-checkbox v-model="form.isLivingAlone" label="我是一人居住" density="comfortable" />
        <v-checkbox
          v-model="form.receiveDailyCheck"
          label="接收每日問候訊息"
          density="comfortable"
        />
        <v-checkbox
          v-model="form.receiveDisasterCheck"
          label="接收災害安否訊息"
          density="comfortable"
        />

        <v-btn type="submit" size="large" class="btn-bubble-pink mt-4" block :loading="loading">
          註冊
        </v-btn>

        <div class="text-caption mt-6 text-center">
          已有帳號？<router-link to="/login">回登入</router-link>
        </div>
      </v-form>
    </v-card>

    <!-- 註冊成功提示（用 setTimeout 導頁） -->
    <v-snackbar
      v-model="snack.show"
      color="success"
      location="top"
      :timeout="SNACK_TIMEOUT"
      rounded="lg"
      elevation="10"
      class="soft-shadow"
    >
      {{ snack.text }}
    </v-snackbar>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref, computed, watch, onBeforeUnmount } from 'vue' // ✅ 加入 onBeforeUnmount
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api.js'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = useRouter()
const userStore = useUserStore()

const method = ref('手機')
const loading = ref(false)
const showPwd = ref(false)

/* ✅ Snackbar 狀態與計時器 */
const SNACK_TIMEOUT = 1200
const snack = ref({ show: false, text: '註冊成功，歡迎加入好鄰聚！', nextPath: '/dashboard' })
let snackTimer = null
onBeforeUnmount(() => {
  if (snackTimer) clearTimeout(snackTimer)
})

// 狀態：查重與錯誤
const emailChecking = ref(false)
const emailAvailable = ref(null) // true | false | null
const phoneChecking = ref(false)
const phoneAvailable = ref(null)

const form = reactive({
  name: '',
  phone: '',
  email: '',
  password: '',
  lineId: '',
  isElder: false,
  isLivingAlone: false,
  receiveDailyCheck: false,
  receiveDisasterCheck: false,
})

/* ========== 規則 ========== */
const TW_MOBILE = /^09\d{8}$/ // 台灣手機：09xxxxxxxx
const EMAIL_RGX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const rules = {
  required: (v) => !!v || '此欄位為必填',
  email: (v) => !v || EMAIL_RGX.test(v) || 'Email 格式不正確',
  phone: (v) => !v || TW_MOBILE.test(v) || '手機格式不正確（09 開頭，共 10 碼）',
  minLength: (v) => (v && v.length >= 6) || '密碼至少 6 碼',
}

/* ========== 除抖 ========== */
function debounce(fn, delay = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), delay)
  }
}

/* ========== 查重 API（可選） ========== */
async function checkAvailability(payload) {
  try {
    const { data } = await api.get('/users/check', { params: payload })
    if (typeof data?.available === 'boolean') return { available: data.available }
    if (typeof data?.exists === 'boolean') return { available: !data.exists }
    return { available: null }
  } catch {
    return { available: null } // 後端沒有此路由就忽略
  }
}

const debouncedCheckEmail = debounce(async (email) => {
  if (!email || !EMAIL_RGX.test(email)) {
    emailAvailable.value = null
    return
  }
  emailChecking.value = true
  const { available } = await checkAvailability({ email })
  emailAvailable.value = available
  emailChecking.value = false
}, 300)

const debouncedCheckPhone = debounce(async (phone) => {
  if (!phone || !TW_MOBILE.test(phone)) {
    phoneAvailable.value = null
    return
  }
  phoneChecking.value = true
  const { available } = await checkAvailability({ phone })
  phoneAvailable.value = available
  phoneChecking.value = false
}, 300)

watch(
  () => form.email,
  (v) => {
    emailAvailable.value = null
    debouncedCheckEmail(v?.trim())
  },
)
watch(
  () => form.phone,
  (v) => {
    phoneAvailable.value = null
    debouncedCheckPhone(v?.trim())
  },
)

/* ========== 密碼強度 ========== */
const pwdStrength = computed(() => {
  const v = form.password || ''
  let score = 0
  if (v.length >= 6) score += 25
  if (/[a-z]/.test(v)) score += 15
  if (/[A-Z]/.test(v)) score += 20
  if (/\d/.test(v)) score += 20
  if (/[^A-Za-z0-9]/.test(v)) score += 20
  if (v.length >= 12) score += 10
  if (score > 100) score = 100
  const color = score >= 80 ? 'green' : score >= 60 ? 'light-green' : score >= 40 ? 'amber' : 'red'
  return { score, color }
})

/* ========== 錯誤訊息聚合 ========== */
const emailErrorMsg = computed(() => {
  if (method.value !== 'Email') return ''
  if (form.email && !EMAIL_RGX.test(form.email)) return 'Email 格式不正確'
  if (emailAvailable.value === false) return '此 Email 已被使用'
  return ''
})

const phoneErrorMsg = computed(() => {
  if (method.value !== '手機') return ''
  if (form.phone && !TW_MOBILE.test(form.phone)) return '手機格式不正確（09 開頭，共 10 碼）'
  if (phoneAvailable.value === false) return '此手機號碼已被使用'
  return ''
})

/* ========== 送出 ========== */
const handleRegister = async () => {
  try {
    loading.value = true

    // 前置檢查
    if (!form.name) return alert('請輸入顯示名稱')
    if (!form.password || form.password.length < 6) return alert('請輸入至少 6 碼密碼')

    if (method.value === '手機') {
      if (!form.phone) return alert('請輸入手機號碼')
      if (!TW_MOBILE.test(form.phone)) return alert('手機格式不正確（09 開頭，共 10 碼）')
      if (phoneAvailable.value === false) return alert('此手機號碼已被使用')
    } else {
      if (!form.email) return alert('請輸入 Email')
      if (!EMAIL_RGX.test(form.email)) return alert('Email 格式不正確')
      if (emailAvailable.value === false) return alert('此 Email 已被使用')
    }

    const payload = {
      name: form.name.trim(),
      password: form.password.trim(),
      lineId: form.lineId.trim() || undefined,
      isElder: form.isElder,
      isLivingAlone: form.isLivingAlone,
      receiveDailyCheck: form.receiveDailyCheck,
      receiveDisasterCheck: form.receiveDisasterCheck,
      ...(method.value === '手機' ? { phone: form.phone.trim() } : { email: form.email.trim() }),
    }

    // 註冊
    const { data } = await api.post('/users/register', payload)
    let token = data?.token

    // 後端若不回 token，退而用剛填的帳密登入一次
    if (!token) {
      const account = method.value === '手機' ? form.phone.trim() : form.email.trim()
      const loginRes = await api.post('/users/login', { account, password: form.password.trim() })
      token = loginRes.data?.token
    }

    if (!token) {
      alert('註冊成功，但未取得登入憑證，請改用登入或稍後再試')
      return
    }

    // 立即設定 Authorization，確保 /users/me 會帶 token
    userStore.token = token
    localStorage.setItem('token', token)
    api.defaults.headers.common.Authorization = `Bearer ${token}`

    // 取完整使用者
    const meRes = await api.get('/users/me')
    const fullUser = meRes.data.user
    userStore.setUser?.(fullUser) || (userStore.user = fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    // ✅ 顯示成功提示，排程導頁
    const hasCommunity = Array.isArray(fullUser?.community) && fullUser.community.length > 0
    snack.value.nextPath = hasCommunity ? '/dashboard' : '/community/join'
    snack.value.text = '註冊成功，歡迎加入好鄰聚！'
    snack.value.show = true
    if (snackTimer) clearTimeout(snackTimer)
    snackTimer = setTimeout(() => router.push(snack.value.nextPath), SNACK_TIMEOUT)
  } catch (err) {
    if (import.meta.env.DEV) console.error('❌ 註冊失敗', err)
    alert(err?.response?.data?.message || '註冊失敗，請稍後再試')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:global(body) {
  background: var(--c-cream);
}

/* Hero（同 Login）：不換行 + RWD 字級 */
.hero-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  flex-wrap: nowrap;
}
.brand-title {
  font-family:
    'HoodBrandTitle', 'Taipei Sans TC', 'Noto Sans TC', 'PingFang TC', 'Microsoft JhengHei',
    sans-serif;
  font-weight: 700;
}
.hero-wrap .hero-text.brand-title {
  line-height: 1;
  font-size: clamp(36px, 6vw, 64px);
  letter-spacing: 0.5px;
  color: #111;
}
@media (min-width: 1280px) {
  .hero-wrap .hero-text.brand-title {
    font-size: clamp(48px, 5vw, 96px);
  }
}
@media (min-width: 1920px) {
  .hero-wrap .hero-text.brand-title {
    font-size: clamp(64px, 4vw, 128px);
  }
}
.hero-wrap .hero-emoji {
  font-size: 1.8em;
}
@media (min-width: 1280px) {
  .hero-wrap .hero-emoji {
    font-size: 2.2em;
  }
}
@media (min-width: 1920px) {
  .hero-wrap .hero-emoji {
    font-size: 2.6em;
  }
}

/* 卡片：奶油底、海報陰影（與 Login 一致） */
.register-card {
  width: clamp(320px, 86vw, 520px);
  background: var(--c-cream) !important;
  border: 2px solid #111 !important;
  box-shadow:
    0 4px 0 #111,
    0 8px 16px rgba(0, 0, 0, 0.08) !important;
  padding: clamp(16px, 3.2vw, 28px);
}

/* 黑框奶油底輸入 */
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
