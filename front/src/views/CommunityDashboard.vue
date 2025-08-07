<template>
  <v-container class="py-8">
    <!-- 歡迎區塊 -->
    <div class="text-center mb-10">
      <h1 class="text-h5 font-weight-bold">{{ communityName }}</h1>
      <p class="text-subtitle-2">歡迎來到 {{ communityName }} 社區！</p>
    </div>

    <!-- 功能卡片區塊 -->
    <v-row>
      <v-col
        v-for="(item, index) in features"
        :key="index"
        cols="12"
        sm="6"
        class="mb-6"
      >
        <v-card
          class="text-center py-6"
          elevation="4"
          @click="navigateTo(item.route)"
          hover
        >
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
import { ref } from 'vue'

const route = useRoute()
const router = useRouter()

// 假設你會從後端取得社區名稱
const communityName = ref("範例社區")

const features = [
  { title: '最新公告', icon: 'mdi-bullhorn-outline', route: 'announcement' },
  { title: '好鄰交流', icon: 'mdi-message-text-outline', route: 'posts' },
  { title: '異常回報', icon: 'mdi-map-marker-alert-outline', route: 'reports' },
  { title: '活動列表', icon: 'mdi-calendar-heart', route: 'events' },
]

const navigateTo = (target) => {
  router.push(`/community/${route.params.id}/${target}`)
}
</script>
