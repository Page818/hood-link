<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-6" max-width="400">
      <v-card-title>登入《好鄰聚》</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleLogin">
          <v-text-field
            v-model="form.account"
            label="手機號碼或 Email"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account"
          />
          <v-text-field
            v-model="form.password"
            label="密碼"
            type="password"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-lock"
          />
          <v-btn type="submit" color="primary" class="mt-4" block :loading="loading">登入</v-btn>
        </v-form>
        <div class="text-caption mt-4 text-center">
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

const rules = {
  required: (v) => !!v || '此欄位為必填',
}

const handleLogin = async () => {
  if (!form.account || !form.password) return
  loading.value = true
  try {
    // 1) 登入拿 token
    const res = await api.post('/users/login', {
      account: form.account.trim(),
      password: form.password.trim(),
    })
    const { token } = res.data

    // 2) 存 token（攔截器會自動帶 Authorization）
    userStore.token = token
    localStorage.setItem('token', token)

    // 3) 立刻刷新 /users/me，拿「經 transform」的完整 user
    const meRes = await api.get('/users/me')
    const fullUser = meRes.data.user

    // 4) 存到 store / localStorage
    // userStore.user = fullUser
    userStore.setUser(fullUser)
    localStorage.setItem('user', JSON.stringify(fullUser))

    // 5) 導頁
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
