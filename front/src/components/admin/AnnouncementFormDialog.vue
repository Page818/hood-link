<!-- src/components/admin/AnnouncementFormDialog.vue -->
<template>
  <v-dialog v-model="isOpen" max-width="720" transition="dialog-bottom-transition">
    <v-card class="round-xl soft-shadow">
      <v-card-title class="text-h6 font-weight-bold d-flex align-center justify-space-between">
        <span class="section-title">{{ isEdit ? '編輯公告' : '新增公告' }}</span>
        <v-chip
          v-if="form.pinned"
          size="small"
          color="warning"
          variant="tonal"
          class="sticker"
          prepend-icon="mdi-pin"
        >
          置頂
        </v-chip>
      </v-card-title>

      <div class="cloud-divider"></div>

      <v-card-text class="pt-4">
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- 標題 -->
          <v-text-field
            v-model.trim="form.title"
            label="公告標題"
            :rules="[rules.required, rules.max80]"
            variant="solo-filled"
            class="round-xl mb-3"
            :disabled="loading || uploading"
            clearable
          />

          <!-- 內文 -->
          <v-textarea
            v-model.trim="form.content"
            label="公告內容"
            :rules="[rules.required, rules.max1000]"
            variant="solo-filled"
            class="round-xl mb-2"
            auto-grow
            :disabled="loading || uploading"
            counter="1000"
            clearable
          />

          <!-- 是否置頂 + 小提醒 -->
          <div class="d-flex align-center justify-space-between mb-3">
            <v-checkbox
              v-model="form.pinned"
              label="置頂公告"
              :disabled="loading || uploading"
              density="comfortable"
              hide-details
            />
            <div class="text-caption subtitle-dim">
              每個社區僅建議保留<strong>一則</strong>置頂（會自動取消其他置頂）
            </div>
          </div>

          <!-- 圖片上傳 -->
          <v-file-input
            label="上傳圖片"
            accept="image/*"
            :disabled="uploading || loading"
            :multiple="false"
            prepend-icon="mdi-image"
            variant="outlined"
            density="comfortable"
            @update:modelValue="onPick"
            class="mb-2"
          />
          <v-progress-linear
            v-if="uploading"
            :model-value="progress"
            height="6"
            rounded
            class="mb-2"
          />

          <!-- 圖片預覽與操作 -->
          <v-img
            v-if="form.image"
            :src="transform(form.image, 'w_1000,q_auto,f_auto')"
            height="200"
            class="round-xl soft-shadow mb-2"
            cover
          />
          <div class="d-flex ga-2" v-if="form.image">
            <v-btn size="small" variant="text" @click="openInNew">新視窗檢視</v-btn>
            <v-btn size="small" variant="text" @click="form.image = ''">移除圖片</v-btn>
          </div>
        </v-form>
      </v-card-text>

      <div class="wave-divider"></div>

      <v-card-actions class="justify-end pa-4">
        <v-btn variant="tonal" class="cta-tonal" :disabled="loading || uploading" @click="close">
          取消
        </v-btn>
        <v-btn
          color="primary"
          class="cta"
          :loading="loading"
          :disabled="uploading"
          @click="handleSubmit"
        >
          儲存
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Snackbar 提示（取代 alert） -->
    <v-snackbar v-model="snackbar.show" :timeout="2400" location="top">
      {{ snackbar.text }}
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'
import { toId } from '@/utils/id'

/* ---------- Props & Emit ---------- */
const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  communityId: String,
})
const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

/* ---------- Dialog 狀態（用 computed 直接雙向綁定） ---------- */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

/* ---------- 表單狀態 ---------- */
const formRef = ref(null)
const loading = ref(false)
const form = ref({
  title: '',
  content: '',
  pinned: false,
  image: '',
})

/* ---------- 上傳狀態 ---------- */
const { uploadImageSigned, transform } = useCloudinaryUploadSigned()
const uploading = ref(false)
const progress = ref(0)

/* ---------- Snackbar ---------- */
const snackbar = ref({ show: false, text: '' })
const tip = (text) => {
  snackbar.value.text = text
  snackbar.value.show = true
}

/* ---------- 選檔上傳 ---------- */
const onPick = async (files) => {
  const file = (Array.isArray(files) && files[0]) || files?.[0] || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
    tip('圖片已上傳')
  } catch (e) {
    tip(e?.message || '圖片上傳失敗')
  } finally {
    uploading.value = false
  }
}

const openInNew = () => {
  if (form.value.image) window.open(form.value.image, '_blank', 'noopener')
}

/* ---------- 若有初始資料（編輯模式） ---------- */
watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.value = {
        title: val.title || '',
        content: val.content || '',
        pinned: !!val.pinned,
        image: val.image || '',
      }
      formRef.value?.resetValidation?.()
    } else {
      // 切回「新增」時清空
      form.value = { title: '', content: '', pinned: false, image: '' }
      formRef.value?.resetValidation?.()
    }
  },
  { immediate: true },
)

/* ---------- 驗證規則 ---------- */
const rules = {
  required: (v) => !!v || '此欄位為必填',
  max80: (v) => !v || v.length <= 80 || '最多 80 字',
  max1000: (v) => !v || v.length <= 1000 || '最多 1000 字',
}

/* ---------- 表單送出 ---------- */
const handleSubmit = async () => {
  // Vuetify v3 validate：回傳 { valid }
  const result = await formRef.value?.validate?.()
  if (!result?.valid) {
    tip('請先完成必填欄位')
    return
  }

  loading.value = true
  try {
    emit('submit', {
      ...form.value,
      communityId: toId(props.communityId),
    })
    // 由父層負責 API 成功與刷新；這邊僅先關閉
    isOpen.value = false
  } catch (err) {
    tip('送出失敗')
  } finally {
    loading.value = false
  }
}

/* ---------- 關閉 ---------- */
const close = () => {
  emit('cancel')
  isOpen.value = false
}

/* ---------- 判斷是否為編輯 ---------- */
const isEdit = computed(() => !!props.initialData)
</script>
