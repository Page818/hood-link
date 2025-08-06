<template>
  <v-container class="fill-height d-flex justify-center align-center">
    <v-card class="pa-6" max-width="500">
      <v-card-title>註冊《好鄰聚》</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="handleRegister">
          <!-- 必填：顯示名稱 -->
          <v-text-field
            v-model="form.name"
            label="顯示名稱"
            :rules="[rules.required]"
            prepend-inner-icon="mdi-account"
          />

          <!-- 手機 / Email 二選一 -->
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

          <!-- 密碼 -->
          <v-text-field
            v-model="form.password"
            label="密碼"
            type="password"
            :rules="[rules.required, rules.minLength]"
            prepend-inner-icon="mdi-lock"
          />

          <!-- 選填：LINE ID -->
          <v-text-field
            v-model="form.lineId"
            label="LINE ID（選填）"
            prepend-inner-icon="mdi-chat"
          />

          <!-- 選填：是否為長者 -->
          <v-checkbox v-model="form.isElder" label="我是長者"></v-checkbox>

          <!-- 選填：是否獨居 -->
          <v-checkbox v-model="form.isLivingAlone" label="我是一人居住"></v-checkbox>

          <!-- 選填：是否接收每日問候 -->
          <v-checkbox v-model="form.receiveDailyCheck" label="接收每日問候訊息"></v-checkbox>

          <!-- 選填：是否接收災害安否訊息 -->
          <v-checkbox v-model="form.receiveDisasterCheck" label="接收災害安否訊息"></v-checkbox>

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

const method = ref('手機')

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

const rules = {
  required: (v) => !!v || '此欄位為必填',
  email: (v) => /.+@.+\..+/.test(v) || 'Email 格式不正確',
  minLength: (v) => (v && v.length >= 6) || '密碼至少 6 碼',
}

const handleRegister = async () => {
  try {
    const payload = {
      name: form.name,
      password: form.password,
      lineId: form.lineId,
      isElder: form.isElder,
      isLivingAlone: form.isLivingAlone,
      receiveDailyCheck: form.receiveDailyCheck,
      receiveDisasterCheck: form.receiveDisasterCheck,
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

    userStore.token = token
    userStore.user = user
    localStorage.setItem('token', token)

    router.push('/dashboard')
  } catch (err) {
    console.error('❌ 註冊失敗', err)
    alert(err.response?.data?.message || '註冊失敗')
  }
}
</script>
