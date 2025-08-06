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
          <v-btn type="submit" color="primary" class="mt-4" block>登入</v-btn>
        </v-form>
        <div class="text-caption mt-4 text-center">
          尚未註冊？<router-link to="/register">前往註冊</router-link>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

import api from '@/services/api.js'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  account: '',
  password: '',
})

const rules = {
  required: (v) => !!v || '此欄位為必填',
}

const handleLogin = async () => {
  try {
    const res = await api.post('/api/users/login', {
      account: form.account,
      password: form.password,
    })

    const { token, user } = res.data
    userStore.token = token
    userStore.user = user
    localStorage.setItem('token', token)

    router.push('/dashboard') // 登入成功跳轉
  } catch (err) {
    console.error('❌ 登入失敗', err)
    alert('登入失敗，請檢查帳號密碼')
  }
}
</script>
