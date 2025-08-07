<!-- src/views/DashboardView.vue -->
<template>
  <v-container class="pa-6">
    <h1 class="text-h5 mb-6">歡迎回來，{{ user?.name || '使用者' }}</h1>

    <!-- Loading 狀態 -->
    <v-progress-circular v-if="loading" indeterminate color="primary" />

    <!-- 若 loading 中不顯示社區選單 -->

    <div v-else>
      <!-- 若尚未加入社區 -->
      <div v-if="user && user.community.length === 0" class="text-center py-12">
        <v-icon size="64" color="grey">mdi-home-off</v-icon>
        <p class="text-subtitle-1 mt-4">你尚未加入任何社區</p>

        <!-- <p class="text-body-2 text-grey">請輸入邀請碼或聯絡社區管理員協助加入</p> -->

        <v-btn color="primary" class="mt-4" @click="router.push('/community/join')">
          加入社區
        </v-btn>
      </div>

      <!-- 下拉選單：選擇社區 -->
      <div v-else>
        <v-select
          v-model="selectedCommunity"
          :items="user.community"
          item-title="name"
          item-value="_id"
          label="選擇社區"
          return-object
          dense
          outlined
          class="mb-6"
        />
        <!-- 動態按鈕顯示 -->
        <div v-if="selectedCommunity" class="d-flex gap-4">
          <v-btn color="secondary" @click="goToCommunity"> 進入社區 </v-btn>

          <v-btn v-if="isAdmin" color="primary" @click="goToAdmin"> 社區管理 </v-btn>
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)
const loading = ref(true)

const selectedCommunity = ref(null)

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/login') // 若沒登入，自動跳轉回登入頁
    return
  }
  try {
    const res = await api.get('/users/me')
    console.log('🟢 已取得 user 資料', res.data.user)

    user.value = res.data.user

    if (res.data && res.data.user) {
      user.value = res.data.user
      if (user.value.community?.length > 0) {
        selectedCommunity.value = user.value.community[0]
      }
    } else {
      throw new Error('無效的使用者資料')
    }
  } catch (err) {
    console.error('❌ 取得使用者資料失敗', err)
    alert('無法載入使用者資料，請重新登入')
  } finally {
    loading.value = false
  }
})

const isAdmin = computed(() => {
  if (!user.value || !selectedCommunity.value) return false
  return selectedCommunity.value.admins.includes(user.value.id)
})

const goToCommunity = () => {
  router.push(`/community/${selectedCommunity.value._id}`)
}

const goToAdmin = () => {
  router.push(`/admin/community/${selectedCommunity.value._id}`)
}
</script>
