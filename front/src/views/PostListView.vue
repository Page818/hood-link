<template>
  <v-container class="py-6" fluid>
    <BackToDashboard :communityId="route.params.communityId || communityId" />

    <v-row justify="center">
      <v-col cols="12" style="max-width: 1200px">
        <div class="d-flex justify-space-between align-center mb-4">
          <h2 class="text-h6 font-weight-bold">貼文牆</h2>
          <v-btn color="primary" @click="goToCreate">新增貼文</v-btn>
        </div>

        <v-row>
          <!-- 分類選單 -->
          <v-col cols="12" md="3" style="min-width: 200px">
            <v-card flat class="pa-4">
              <h3 class="text-subtitle-1 mb-2">分類篩選</h3>
              <v-btn
                v-for="c in categories"
                :key="c"
                variant="text"
                class="mb-2 text-no-wrap"
                :color="category === c ? 'primary' : ''"
                @click="handleCategoryChange(c)"
              >
                {{ c }}
              </v-btn>
            </v-card>
          </v-col>

          <!-- 貼文清單 -->
          <v-col cols="12" md="9">
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-skeleton-loader v-if="loading" type="card@6" />

            <template v-else>
              <v-row v-if="posts.length">
                <v-col v-for="post in posts" :key="post._id" cols="12" sm="6" md="4">
                  <v-card
                    class="pa-4 cursor-pointer"
                    hover
                    :ripple="true"
                    style="height: 200px"
                    @click="handleOpen(post)"
                  >
                    <div class="text-subtitle-1 font-weight-medium mb-1">{{ post.title }}</div>
                    <div class="text-caption mb-2">{{ categoryName(post.category) }}</div>
                    <div class="text-truncate">{{ post.content }}</div>
                  </v-card>
                </v-col>
              </v-row>

              <v-sheet v-else class="py-12 text-center text-medium-emphasis">
                目前沒有貼文
              </v-sheet>

              <!-- 分頁控制 -->
              <div class="d-flex align-center justify-space-between mt-6">
                <div class="text-caption">
                  共 {{ total }} 筆
                  <span v-if="totalPages > 0">・第 {{ page }} / {{ totalPages }} 頁</span>
                </div>
                <div class="d-flex">
                  <v-btn variant="tonal" class="mr-2" :disabled="!canPrev" @click="prevPage"
                    >上一頁</v-btn
                  >
                  <v-btn variant="tonal" :disabled="!canNext" @click="nextPage">下一頁</v-btn>
                </div>
              </div>
            </template>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api.js'
import { toId } from '@/utils/id.js'
import BackToDashboard from '@/components/BackToDashboard.vue'

const route = useRoute()
const router = useRouter()

// 狀態
const posts = ref([])
const loading = ref(false)
const error = ref('')

const page = ref(1)
const limit = ref(6)
const total = ref(0)

// 分類（注意：'全部' 不會送到後端）
const categories = ['全部', '鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']
const category = ref('全部')

// 衍生
const totalPages = computed(() => {
  if (!limit.value) return 0
  return total.value === 0 ? 0 : Math.ceil(total.value / limit.value)
})
const canPrev = computed(() => page.value > 1 && totalPages.value > 0 && !loading.value)
const canNext = computed(
  () => page.value < totalPages.value && totalPages.value > 0 && !loading.value,
)

// API
const fetchPosts = async () => {
  loading.value = true
  error.value = ''
  try {
    const communityId = toId(route.params.communityId)
    const params = { page: page.value, limit: limit.value }
    if (category.value && category.value !== '全部') params.category = category.value

    const { data } = await api.get(`/posts/community/${communityId}`, { params })
    posts.value = data.items || data.posts || []
    total.value = data.total ?? posts.value.length
  } catch (err) {
    error.value = err?.response?.data?.message || '載入貼文失敗'
  } finally {
    loading.value = false
  }
}

// 事件
const handleCategoryChange = (val) => {
  if (category.value === val) return
  category.value = val
  page.value = 1
  fetchPosts()
}

const prevPage = () => {
  if (!canPrev.value) return
  page.value -= 1
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const nextPage = () => {
  if (!canNext.value) return
  page.value += 1
  fetchPosts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleOpen = (post) => {
  if (!post?._id) return
  router.push({
    name: 'post.detail',
    params: {
      communityId: toId(route.params.communityId),
      postId: toId(post._id),
    },
    // 保留分類狀態（用 category，而非舊的 filter 名稱）
    query: { category: category.value },
  })
}

const categoryName = (key) => key || '未分類'

const goToCreate = () => {
  router.push({
    path: `/community/${toId(route.params.communityId)}/posts/create`,
  })
}

// 初始化：從 query 還原分類，再抓資料
onMounted(() => {
  if (route.query.category) category.value = String(route.query.category)
  fetchPosts()
})
</script>
