<template>
  <v-container class="py-8" style="max-width: 900px">
    <BackToDashboard :communityId="communityId" />

    <v-card class="pa-4">
      <div class="text-h6 font-weight-bold mb-3">異常回報</div>

      <v-row>
        <!-- 回報人（僅輔助：姓名/電話不入庫，會貼到 description 末端） -->
        <v-col cols="12" md="6">
          <v-text-field v-model="contact.name" label="稱謂(選填)" variant="outlined" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="contact.phone"
            label="連絡電話(選填)"
            type="tel"
            variant="outlined"
          />
        </v-col>

        <!-- 主要欄位（對齊後端） -->
        <v-col cols="12" md="6">
          <v-select v-model="form.category" :items="CATEGORIES" label="分類" variant="outlined" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="form.location"
            label="地點"
            variant="outlined"
            placeholder="例如：B棟 3F 電梯口"
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
            v-model="form.title"
            label="問題標題"
            variant="outlined"
            :counter="100"
            :error-messages="titleErrors"
            @blur="touch.title = true"
          />
        </v-col>

        <v-col cols="12">
          <v-textarea
            v-model="form.description"
            label="問題描述"
            auto-grow
            variant="outlined"
            :counter="3000"
            :error-messages="descErrors"
            @blur="touch.description = true"
            placeholder="請描述發生時間、位置、現象（例如：8/18 晚上 10:20，B棟 3F 電梯無法關門並持續警示音）"
          />
        </v-col>

        <!-- 圖片上傳（選填） -->
        <v-col cols="12" md="8">
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
            <v-btn size="small" variant="text" @click="form.image = ''">移除圖片</v-btn>
          </div>
        </v-col>
      </v-row>

      <div class="d-flex justify-end ga-2">
        <v-btn variant="tonal" @click="goBack">取消</v-btn>
        <v-btn
          color="primary"
          :loading="submitting"
          :disabled="!isValid || uploading"
          @click="submit"
        >
          提交
        </v-btn>
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
import api from '@/services/api'
import { useUserStore } from '@/stores/user'
import { toId } from '@/utils/id'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'

const { uploadImageSigned, transform } = useCloudinaryUploadSigned()
const CATEGORIES = ['設備', '環境', '治安', '水電', '其他']

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const communityId = computed(() => toId(route.params.communityId))
const touch = ref({ title: false, description: false })

// 對齊後端：title/description/category/location/image
const form = ref({ title: '', description: '', category: '其他', location: '', image: '' })

// 前端輔助欄位（不入庫，送出時會貼到 description 末端）
const contact = ref({ name: '', phone: '' })

const uploading = ref(false)
const progress = ref(0)
const submitting = ref(false)
const snackbar = ref({ show: false, color: 'success', message: '' })
const toast = (m, c = 'success') => (snackbar.value = { show: true, color: c, message: m })

const rules = {
  required: (v) => (v && String(v).trim().length) > 0 || '必填',
  max: (v, n) => !v || String(v).length <= n || `不可超過 ${n} 字`,
}
const titleErrors = computed(() =>
  !touch.value.title
    ? []
    : [rules.required(form.value.title), rules.max(form.value.title, 100)].filter(Boolean),
)
const descErrors = computed(() =>
  !touch.value.description
    ? []
    : [rules.required(form.value.description), rules.max(form.value.description, 3000)].filter(
        Boolean,
      ),
)
const isValid = computed(
  () =>
    rules.required(form.value.title) === true && rules.required(form.value.description) === true,
)

async function onPick(files) {
  const file = (Array.isArray(files) && files[0]) || files?.[0] || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
  } catch (e) {
    toast(e?.message || '圖片上傳失敗', 'error')
  } finally {
    uploading.value = false
  }
}
function openInNew() {
  if (form.value.image) window.open(form.value.image, '_blank')
}

// 🔁 一般用戶：返回/成功後都回社區大廳
function goBack() {
  router.push({ name: 'community.dashboard', params: { communityId: communityId.value } })
}

async function submit() {
  touch.value = { title: true, description: true }
  if (!isValid.value || submitting.value || uploading.value) return
  submitting.value = true
  try {
    await userStore.ensureUser?.(api)
    // 將姓名/電話附在描述尾端（有填才加）
    const extra = [
      contact.value.name && `\n\n回報人：${contact.value.name}`,
      contact.value.phone && `連絡電話：${contact.value.phone}`,
    ]
      .filter(Boolean)
      .join(' ')
    const payload = {
      communityId: communityId.value,
      title: form.value.title,
      description: form.value.description + (extra ? extra : ''),
      category: form.value.category,
      location: form.value.location || undefined,
      image: form.value.image || undefined,
    }
    await api.post('/reports/create', payload)
    toast('已送出回報，感謝！')
    // 導回社區大廳
    router.push({ name: 'community.dashboard', params: { communityId: communityId.value } })
  } catch (e) {
    toast(e?.response?.data?.message || '提交失敗', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
