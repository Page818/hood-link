<!-- /views/PostCreateView.vue -->
<template>
  <v-container class="py-8" style="max-width: 900px">
    <BackToDashboard />

    <v-card class="pa-4">
      <div class="text-h6 font-weight-bold mb-2">新增貼文</div>

      <v-row>
        <v-col cols="12">
          <v-text-field v-model="form.title" label="標題" variant="outlined" :rules="[rReq]" />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="form.category"
            :items="POST_CATEGORIES"
            label="分類"
            variant="outlined"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field v-model="form.image" label="圖片 URL（選填）" variant="outlined" />
        </v-col>

        <v-col cols="12">
          <v-textarea
            v-model="form.content"
            label="內容"
            auto-grow
            variant="outlined"
            :rules="[rReq]"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-end ga-2">
        <v-btn variant="tonal" @click="goBack">取消</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submit">建立貼文</v-btn>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2200" rounded="pill">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToDashboard from '@/components/BackToDashboard.vue'
import api from '@/services/api.js'
import { useUserStore } from '@/stores/user'
import { toId } from '@/utils/id.js'

const POST_CATEGORIES = ['鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const communityId = computed(() => toId(route.params.communityId))
const form = ref({ title: '', content: '', image: '', category: '其他' })
const submitting = ref(false)
const snackbar = ref({ show: false, color: 'success', message: '' })
const showToast = (m, color = 'success') => {
  snackbar.value = { show: true, color, message: m }
}
const rReq = (v) => !!v || '必填'

function goBack() {
  router.push({ path: `/community/${communityId.value}/posts`, query: { category: '全部' } })
}

async function submit() {
  if (!form.value.title || !form.value.content) return
  submitting.value = true
  try {
    await userStore.ensureUser?.(api)
    const payload = { ...form.value, communityId: communityId.value }
    const { data } = await api.post('/posts/create', payload)
    const newPost = data.post || data
    showToast('已建立貼文')
    router.push({
      name: 'post.detail',
      params: { communityId: communityId.value, postId: toId(newPost) },
      query: { category: form.value.category || '全部' },
    })
  } catch (e) {
    showToast(e?.response?.data?.message || '建立失敗', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
