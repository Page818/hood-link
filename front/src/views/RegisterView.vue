<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-6" max-width="400">
      <v-card-title>註冊《好鄰聚》</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleRegister">
          <v-select v-model="method" :items="['手機', 'Email']" label="選擇註冊方式" required />

          <v-text-field
            v-if="method === '手機'"
            v-model="form.phone"
            label="手機號碼"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-phone"
          />
          <v-text-field
            v-else
            v-model="form.email"
            label="Email"
            :rules="[rules.required, rules.email]"
            prepend-inner-icon="mdi-email"
          />

          <v-text-field
            v-model="form.password"
            label="密碼"
            type="password"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-lock"
          />

          <v-btn type="submit" color="primary" class="mt-4" block>註冊</v-btn>
        </v-form>
        <div class="text-caption mt-4 text-center">
          已有帳號？<router-link to="/login">回登入</router-link>
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'

const router = useRouter()
const userStore = useUserStore()

const method = ref('手機') // 預設為手機註冊

const form = reactive({
  phone: '',
  email: '',
  password: '',
})

const rules = {
  required: (v) => !!v || '此欄位為必填',
  email: (v) => /.+@.+\..+/.test(v) || 'Email 格式不正確',
}

const handleRegister = async () => {
  try {
    const payload = {
      password: form.password,
    }

    if (method.value === '手機') {
      if (!form.phone) return alert('請輸入手機號碼')
      payload.phone = form.phone
    } else {
      if (!form.email) return alert('請輸入 Email')
      payload.email = form.email
    }

    const res = await api.post('/api/users/register', payload)
    const { token, user } = res.data

    // 自動登入
    userStore.token = token
    userStore.user = user
    localStorage.setItem('token', token)

    router.push('/dashboard')
  } catch (err) {
    console.error('❌ 註冊失敗', err)
    alert('註冊失敗，請確認資料是否正確')
  }
}
</script>
