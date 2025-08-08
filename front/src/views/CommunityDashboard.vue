<template>
  <v-container class="py-10">
    <!-- 歡迎區塊 -->
    <div class="text-center mb-10">
      <h1 class="text-h5 font-weight-bold">{{ communityName }}</h1>
      <p class="text-subtitle-2">歡迎來到 {{ communityName }} 社區！</p>
    </div>

    <!-- 功能卡片區塊 -->
    <v-row>
      <v-col v-for="(item, index) in features" :key="index" cols="12" sm="6" class="mb-6">
        <v-card class="text-center py-6" elevation="4" @click="navigateTo(item.route)" hover>
          <v-icon size="48" class="mb-2">{{ item.icon }}</v-icon>
          <div class="text-subtitle-1 font-weight-medium">
            {{ item.title }}
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()
const communityId = ref(route.params.id)

const communityName = ref('')
const loading = ref(true)

const fetchCommunityName = async () => {
  try {
    loading.value = true
    const res = await api.get('/users/me')
    const user = res.data.user

    const matchedCommunity = user.community.find((c) => c._id === communityId.value)

    communityName.value = matchedCommunity ? matchedCommunity.name : '未知社區'
  } catch (err) {
    console.error('❌ 載入使用者資料失敗', err)
    communityName.value = '載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCommunityName)

// ✅ 關鍵：監聽網址中的 id 有變化時重新取得資料
watch(
  () => route.params.id,
  (newId) => {
    communityId.value = newId
    fetchCommunityName()
  },
)

const features = [
  { title: '最新公告', icon: 'mdi-bullhorn-outline', route: 'announcement' },
  { title: '好鄰交流', icon: 'mdi-message-text-outline', route: 'posts' },
  { title: '異常回報', icon: 'mdi-map-marker-alert-outline', route: 'reports' },
  { title: '活動列表', icon: 'mdi-calendar-heart', route: 'events' },
]

const navigateTo = (target) => {
  router.push(`/community/${communityId.value}/${target}`)
}
</script>
