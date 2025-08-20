<!-- src/components/admin/AnnouncementFormDialog.vue -->
<template>
  <v-dialog v-model="isOpen" max-width="700">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? '編輯公告' : '新增公告' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <!-- 標題 -->
          <v-text-field v-model="form.title" label="公告標題" :rules="[rules.required]" />

          <!-- 內文 -->
          <v-textarea v-model="form.content" label="公告內容" :rules="[rules.required]" />

          <!-- 是否置頂 -->
          <v-checkbox v-model="form.pinned" label="置頂公告" />

          <!-- 圖片上傳 -->
          <v-file-input
            label="上傳圖片"
            accept="image/*"
            :disabled="uploading"
            :multiple="false"
            prepend-icon="mdi-image"
            @update:modelValue="onPick"
          />
          <v-progress-linear v-if="uploading" :model-value="progress" height="6" class="mt-2" />

          <!-- 圖片預覽與操作 -->
          <v-img
            v-if="form.image"
            :src="transform(form.image, 'w_800,q_auto,f_auto')"
            height="180"
            class="mt-4 rounded"
            cover
          />
          <div class="d-flex ga-2 mt-2" v-if="form.image">
            <v-btn size="small" variant="text" @click="openInNew">新視窗檢視</v-btn>
            <v-btn size="small" variant="text" @click="form.image = ''">移除圖片</v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text @click="emit('cancel')">取消</v-btn>
        <v-btn color="primary" @click="handleSubmit" :loading="loading">儲存</v-btn>
      </v-card-actions>
    </v-card>
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

/* ---------- Dialog 狀態控制 ---------- */
const isOpen = ref(false)
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val),
)
watch(isOpen, (val) => emit('update:modelValue', val))

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

const onPick = async (files) => {
  const file = (Array.isArray(files) && files[0]) || files?.[0] || files
  if (!file) return
  uploading.value = true
  progress.value = 0
  try {
    const { secure_url } = await uploadImageSigned(file, (n) => (progress.value = n))
    form.value.image = secure_url
  } catch (e) {
    alert(e?.message || '圖片上傳失敗')
  } finally {
    uploading.value = false
  }
}

const openInNew = () => {
  if (form.value.image) window.open(form.value.image, '_blank')
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
    }
  },
  { immediate: true },
)

/* ---------- 驗證規則 ---------- */
const rules = {
  required: (v) => !!v || '此欄位為必填',
}

/* ---------- 表單送出 ---------- */
const handleSubmit = () => {
  if (!form.value.title || !form.value.content) {
    alert('請填寫所有欄位')
    return
  }
  emit('submit', { ...form.value })
  isOpen.value = false
}

/* ---------- 判斷是否為編輯 ---------- */
const isEdit = computed(() => !!props.initialData)
</script>
