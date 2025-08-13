<template>
  <v-container class="py-8">
    <BackToDashboard />

    <v-breadcrumbs
      :items="[{ title: '貼文列表', to: backTo }, { title: '貼文詳情' }]"
      class="mb-4"
    />

    <v-skeleton-loader v-if="loading" type="image, article, chip" />
    <v-alert v-else-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <template v-else>
      <h1 class="text-h5 font-weight-bold mb-2">{{ post.title }}</h1>
      <div class="text-caption text-medium-emphasis mb-4">
        {{ post.category }}・{{ formatTime(post.createdAt) }}
      </div>
      <v-img v-if="post.image" :src="post.image" height="280" cover class="mb-4" />
      <div class="text-body-1">{{ post.content }}</div>
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import BackToDashboard from '@/components/BackToDashboard.vue'
import { toId } from '@/utils/id' // 你專案已有這個工具

const route = useRoute()

const post = ref(null)
const loading = ref(true)
const error = ref('')

// ✅ 只讀 communityId，符合你的 ESLint 規則
const communityId = computed(() => toId(route.params.communityId || ''))

// ✅ 避開 route.params.id：從 path 解析出 postId
const postId = computed(() => {
  // 支援 /posts/:id 或 /community/:communityId/posts/:id
  const m = route.path.match(/\/posts\/([^/?#]+)/)
  return m?.[1] || ''
})

const backTo = computed(() => ({
  name: 'community.posts',
  params: { communityId: communityId.value || post.value?.community || '' },
}))

const formatTime = (iso) => new Date(iso).toLocaleString()

// 🔁 這段就是你要的「替換版」fetchDetail（不碰 route.params.id）
const fetchDetail = async () => {
  loading.value = true
  error.value = ''
  try {
    if (!postId.value) throw new Error('無法解析貼文 ID')
    const { data } = await api.get(`/posts/${postId.value}`)
    post.value = data.post
  } catch (e) {
    console.error('❌ 載入貼文失敗', e)
    error.value = '載入貼文失敗'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)
</script>
