<template>
  <!-- 背景要鋪滿請加 fluid -->
  <v-container fluid class="fill-height loginBg d-flex align-center justify-center">
    <v-row class="ma-0 w-100" align="center" justify="center">
      <v-col cols="12" class="d-flex justify-center">
        <!-- 卡片寬度由 loginCard 控制 -->
        <v-card class="pa-6 pa-sm-8 loginCard" elevation="6">
          <v-card-title class="text-h6 text-center pb-2">登入《好鄰聚》</v-card-title>
          <v-card-text class="pt-0">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.account"
                label="手機號碼或 Email"
                :rules="[rules.required]"
                prepend-inner-icon="mdi-account"
                density="comfortable"
                hide-details="auto"
                class="mb-3"
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
                class="mb-1"
                autocomplete="current-password"
              />

              <v-btn
                type="submit"
                color="primary"
                size="large"
                class="mt-4"
                block
                :loading="loading"
              >
                登入
              </v-btn>
            </v-form>

            <div class="text-caption mt-6 text-center">
              尚未註冊？<router-link to="/register">前往註冊</router-link>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
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
/* 背景鋪滿整個畫面寬度與高度 */
.loginBg {
  min-height: 100vh;
  background-color: #f9f5f0;
  background-image: url('/more-leaves-on-green.png');
  background-repeat: repeat;
  padding: 16px;
}

/* 內容卡片：手機 80%，桌機最多 450px */
.loginCard {
  width: 80%;
  max-width: 450px;
  border-radius: 20px;
}

/* 手機額外優化圓角與內距 */
@media (max-width: 599px) {
  .loginCard {
    border-radius: 16px;
    padding: 20px !important;
  }
}
</style>
