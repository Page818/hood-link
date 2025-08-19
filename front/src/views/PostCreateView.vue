<template>
  <v-container class="py-8" style="max-width: 900px">
    <BackToDashboard :communityId="communityId" />

    <v-card class="pa-4">
      <div class="text-h6 font-weight-bold mb-2">新增貼文</div>

      <v-row>
        <v-col cols="12">
          <v-text-field
            v-model="form.title"
            label="標題"
            variant="outlined"
            :counter="60"
            :error-messages="titleErrors"
            @blur="touch.title = true"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-select
            v-model="form.category"
            :items="POST_CATEGORIES"
            label="分類"
            variant="outlined"
          />
        </v-col>

        <!-- 仍保留「圖片 URL（選填）」 -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.image"
            label="圖片 URL（選填）"
            variant="outlined"
            :error-messages="imageErrors"
            @blur="touch.image = true"
            placeholder="https://…"
          />
        </v-col>

        <!-- ✅ Cloudinary 簽名上傳（選填） -->
        <v-col cols="12" md="6">
          <v-file-input
            accept="image/*"
            label="上傳圖片（選填）"
            variant="outlined"
            prepend-icon="mdi-image"
            :disabled="uploading"
            :multiple="false"
            @update:modelValue="onPick"
          />
          <v-progress-linear v-if="uploading" :model-value="progress" height="6" class="mt-2" />
          <v-img
            v-if="form.image"
            :src="transform(form.image, 'w_800,q_auto,f_auto')"
            height="180"
            class="mt-2 rounded-lg"
            cover
          />
          <div class="d-flex ga-2 mt-2" v-if="form.image">
            <v-btn size="small" variant="text" @click="openInNew">新視窗檢視</v-btn>
            <v-btn size="small" variant="text" @click="removeImage">移除圖片</v-btn>
          </div>
        </v-col>

        <v-col cols="12">
          <v-textarea
            v-model="form.content"
            label="內容"
            auto-grow
            variant="outlined"
            :counter="3000"
            :error-messages="contentErrors"
            @blur="touch.content = true"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-end ga-2">
        <v-btn variant="tonal" @click="goBack">取消</v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isValid || submitting || uploading"
          @click="submit"
        >
          建立貼文
        </v-btn>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2200" rounded="pill">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BackToDashboard from '@/components/BackToDashboard.vue'
import api from '@/services/api.js'
import { useUserStore } from '@/stores/user'
import { toId } from '@/utils/id.js'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'

const { uploadImageSigned, transform } = useCloudinaryUploadSigned()

const POST_CATEGORIES = ['鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const communityId = computed(() => toId(route.params.communityId))
const form = ref({ title: '', content: '', image: '', imagePublicId: '', category: '其他' })

const submitting = ref(false)
const snackbar = ref({ show: false, color: 'success', message: '' })
const showToast = (m, color = 'success') => {
  snackbar.value = { show: true, color, message: m }
}

const touch = ref({ title: false, content: false, image: false })
const rules = {
  required: (v) => (v && v.trim().length) > 0 || '此欄位為必填',
  max: (v, n) => !v || v.length <= n || `不可超過 ${n} 字`,
  url: (v) => !v || /^https?:\/\/\S+$/i.test(v) || '必須是有效的 URL',
  category: (v) => POST_CATEGORIES.includes(v) || '無效的分類',
}
const titleErrors = computed(() =>
  !touch.value.title
    ? []
    : [rules.required(form.value.title), rules.max(form.value.title, 60)].filter(Boolean),
)
const contentErrors = computed(() =>
  !touch.value.content
    ? []
    : [rules.required(form.value.content), rules.max(form.value.content, 3000)].filter(Boolean),
)
const imageErrors = computed(() =>
  !touch.value.image ? [] : [rules.url(form.value.image)].filter(Boolean),
)
const isValid = computed(
  () =>
    rules.required(form.value.title) === true &&
    rules.required(form.value.content) === true &&
    rules.max(form.value.title, 60) === true &&
    rules.max(form.value.content, 3000) === true &&
    rules.url(form.value.image) === true &&
    rules.category(form.value.category) === true,
)

// ===== 簽名上傳狀態/動作 =====
const uploading = ref(false)
const progress = ref(0)

async function onPick(files) {
  const file = (Array.isArray(files) && files[0]) || (files && files[0]) || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url, public_id } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
    form.value.imagePublicId = public_id
    touch.value.image = true
  } catch (e) {
    showToast(e?.message || '上傳失敗', 'error')
  } finally {
    uploading.value = false
  }
}
function removeImage() {
  form.value.image = ''
  form.value.imagePublicId = ''
}
function openInNew() {
  if (form.value.image) window.open(form.value.image, '_blank')
}

// ===== 返回與送出 =====
function goBack() {
  const category =
    route.query.category && POST_CATEGORIES.includes(String(route.query.category))
      ? String(route.query.category)
      : '全部'
  router.push({ path: `/community/${communityId.value}/posts`, query: { category } })
}

async function submit() {
  touch.value = { title: true, content: true, image: true }
  if (!isValid.value || submitting.value || uploading.value) return
  submitting.value = true
  try {
    await userStore.ensureUser?.(api)
    const payload = {
      title: form.value.title,
      content: form.value.content,
      category: form.value.category,
      image: form.value.image || '',
      imagePublicId: form.value.imagePublicId || '',
      communityId: communityId.value,
    }
    const { data } = await api.post('/posts/create', payload)
    const newPostId = toId(data.post)
    showToast('已建立貼文')
    router.push({
      name: 'post.detail',
      params: { communityId: communityId.value, postId: newPostId },
      query: { category: form.value.category || '全部' },
    })
  } catch (e) {
    showToast(e?.response?.data?.message || '建立失敗', 'error')
  } finally {
    submitting.value = false
  }
}

// 預選分類（若從列表帶 category 且合法）
onMounted(() => {
  const from = String(route.query.category || '')
  if (POST_CATEGORIES.includes(from)) form.value.category = from
})

// 草稿保護（可選）
const hasDirty = () => form.value.title || form.value.content || form.value.image
const beforeUnload = (e) => {
  if (submitting.value || !hasDirty()) return
  e.preventDefault()
  e.returnValue = ''
}
window.addEventListener('beforeunload', beforeUnload)
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>
