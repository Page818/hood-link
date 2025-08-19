<template>
  <v-container class="py-8 post-detail-container">
    <BackToDashboard :communityId="route.params.communityId || communityId" />

    <v-row>
      <!-- 貼文內容區 -->
      <v-col cols="12" md="8">
        <v-card>
          <!-- 圖片（瀏覽模式） -->
          <v-img v-if="post?.image && !isEditing" :src="post.image" height="300" cover />

          <!-- 標題列：返回 + 編輯/刪除 -->
          <v-card-title class="d-flex align-center">
            <span class="text-h6 font-weight-bold">
              {{ isEditing ? '編輯貼文' : post?.title || '' }}
            </span>
            <v-spacer />
            <v-btn variant="tonal" prepend-icon="mdi-chevron-left" @click="goBack">返回列表</v-btn>
            <template v-if="isOwner">
              <v-btn
                v-if="!isEditing"
                class="ml-2"
                variant="tonal"
                color="primary"
                @click="startEdit"
                >編輯</v-btn
              >
              <v-btn
                v-if="!isEditing"
                class="ml-2"
                variant="tonal"
                color="error"
                @click="deletePost"
                >刪除貼文</v-btn
              >
            </template>
          </v-card-title>

          <!-- 資訊列（瀏覽模式） -->
          <v-card-subtitle v-if="!isEditing">
            {{ post?.category }}・{{ formatTime(post?.createdAt) }}
          </v-card-subtitle>

          <!-- 內容（瀏覽模式） -->
          <v-card-text v-if="!isEditing">
            <div class="mb-3">{{ post?.content }}</div>
          </v-card-text>

          <!-- ===== 編輯模式 ===== -->
          <v-card-text v-else>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="form.title"
                  label="標題"
                  variant="outlined"
                  :rules="[(v) => !!v || '必填']"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="form.category"
                  label="分類"
                  :items="POST_CATEGORIES"
                  variant="outlined"
                />
              </v-col>

              <!-- 自填 URL（選填） -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="form.image"
                  label="圖片 URL（選填）"
                  variant="outlined"
                  placeholder="https://…"
                />
              </v-col>

              <!-- Cloudinary 簽名上傳（選填） -->
              <v-col cols="12" md="6">
                <v-file-input
                  accept="image/*"
                  label="更換圖片（選填）"
                  variant="outlined"
                  prepend-icon="mdi-image"
                  :disabled="uploading"
                  :multiple="false"
                  @update:modelValue="onPickEdit"
                />
                <v-progress-linear
                  v-if="uploading"
                  :model-value="progress"
                  height="6"
                  class="mt-2"
                />
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
                  :rules="[(v) => !!v || '必填']"
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-end ga-2">
              <v-btn variant="tonal" @click="cancelEdit">取消</v-btn>
              <v-btn color="primary" :loading="saving" :disabled="uploading" @click="saveEdit"
                >儲存</v-btn
              >
            </div>
          </v-card-text>
        </v-card>

        <v-alert v-if="error" type="error" class="mt-4">{{ error }}</v-alert>
        <v-skeleton-loader v-if="loading" class="mt-4" type="article" />
      </v-col>

      <!-- 留言區 -->
      <v-col cols="12" md="4">
        <CommentsPane :postId="postId" :current-user-id="myId" />
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2200" rounded="pill">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api.js'
import BackToDashboard from '@/components/BackToDashboard.vue'
import CommentsPane from '@/components/comments/CommentsPane.vue'
import { useDisplay } from 'vuetify'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { useUserStore } from '@/stores/user'
import { toId } from '@/utils/id.js'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'

const { uploadImageSigned, transform } = useCloudinaryUploadSigned()
const POST_CATEGORIES = ['鄰里閒聊', '推薦分享', '二手交換', '失物招領', '求助協尋', '其他']

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { mobile } = useDisplay()

const isMobile = computed(() => mobile.value)
const communityId = computed(() => route.params.communityId)
const postId = computed(() => route.params.postId)

const post = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const snackbar = ref({ show: false, color: 'success', message: '' })
const showToast = (m, color = 'success') => {
  snackbar.value = { show: true, color, message: m }
}

const myId = computed(() => toId(userStore.user))
const isOwner = computed(() => toId(post.value?.creator) === myId.value)

const isEditing = ref(false)
const form = ref({ title: '', category: '其他', image: '', imagePublicId: '', content: '' })

const formatTime = (time) =>
  time ? format(new Date(time), 'yyyy-MM-dd HH:mm', { locale: zhTW }) : ''

async function fetchPost() {
  try {
    loading.value = true
    await userStore.ensureUser?.(api)
    const res = await api.get(`/posts/${postId.value}`)
    post.value = res.data.post || res.data
  } catch (e) {
    error.value = e?.response?.data?.message || '無法取得貼文'
  } finally {
    loading.value = false
  }
}

function goBack() {
  const category = route.query.category || '全部'
  router.push({ path: `/community/${communityId.value}/posts`, query: { category } })
}

function startEdit() {
  if (!post.value) return
  isEditing.value = true
  form.value = {
    title: post.value.title || '',
    category: post.value.category || '其他',
    image: post.value.image || '',
    imagePublicId: post.value.imagePublicId || '',
    content: post.value.content || '',
  }
}

function cancelEdit() {
  isEditing.value = false
}

function openInNew() {
  if (form.value.image) window.open(form.value.image, '_blank')
}
function removeImage() {
  form.value.image = ''
  form.value.imagePublicId = ''
}

/** 編輯模式：簽名上傳圖片 */
const uploading = ref(false)
const progress = ref(0)
async function onPickEdit(files) {
  const file = (Array.isArray(files) && files[0]) || files?.[0] || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url, public_id } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
    form.value.imagePublicId = public_id
  } catch (e) {
    showToast(e?.message || '上傳失敗', 'error')
  } finally {
    uploading.value = false
  }
}

async function saveEdit() {
  if (!isOwner.value) return
  saving.value = true
  try {
    const payload = {
      title: form.value.title,
      content: form.value.content,
      category: form.value.category,
      image: form.value.image || '',
      imagePublicId: form.value.imagePublicId || '',
    }
    const { data } = await api.put(`/posts/${postId.value}`, payload)
    post.value = data.post || post.value
    showToast('已更新貼文')
    isEditing.value = false
  } catch (e) {
    showToast(e?.response?.data?.message || '更新失敗', 'error')
  } finally {
    saving.value = false
  }
}

async function deletePost() {
  if (!isOwner.value || !post.value) return
  if (!confirm('確定要刪除這篇貼文嗎？')) return
  try {
    await api.delete(`/posts/${postId.value}`)
    showToast('已刪除貼文')
    goBack()
  } catch (e) {
    showToast(e?.response?.data?.message || '刪除失敗', 'error')
  }
}

onMounted(fetchPost)
</script>

<style scoped>
.post-detail-container {
  max-width: 1200px;
  width: 1200px;
  margin: 0 auto;
}
</style>
