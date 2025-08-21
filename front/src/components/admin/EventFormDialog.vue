<!-- src/components/admin/EventFormDialog.vue -->
<template>
  <v-dialog v-model="isOpen" max-width="760">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ isEdit ? '編輯活動' : '新增活動' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field v-model="form.title" label="活動標題" :rules="[rules.required]" />
          <v-textarea v-model="form.content" label="活動內容" :rules="[rules.required]" />

          <div class="d-flex ga-4">
            <v-text-field
              v-model="form.date"
              type="datetime-local"
              label="活動日期"
              class="flex-1-1"
              :rules="[rules.required]"
            />
            <v-text-field
              v-model="form.registrationDeadline"
              type="datetime-local"
              label="報名截止（可選）"
              class="flex-1-1"
            />
          </div>

          <v-file-input
            label="上傳封面圖片"
            accept="image/*"
            :disabled="uploading"
            :multiple="false"
            prepend-icon="mdi-image"
            @update:modelValue="onPick"
          />
          <v-progress-linear v-if="uploading" :model-value="progress" height="6" class="mt-2" />

          <v-img
            v-if="form.image"
            :src="transform(form.image, 'w_800,q_auto,f_auto')"
            height="180"
            class="mt-4 rounded"
            cover
          />
          <div v-if="form.image" class="d-flex ga-2 mt-2">
            <v-btn size="small" variant="text" @click="openInNew">新視窗檢視</v-btn>
            <v-btn size="small" variant="text" @click="form.image = ''">移除圖片</v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text @click="emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" :loading="loading" @click="handleSubmit">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useCloudinaryUploadSigned } from '@/composables/useCloudinaryUploadSigned'
import { toId } from '@/utils/id'

const props = defineProps({
  modelValue: Boolean,
  initialData: Object,
  communityId: String, // 父層會補進來
})
const emit = defineEmits(['update:modelValue', 'submit'])

const isOpen = ref(false)
watch(
  () => props.modelValue,
  (v) => (isOpen.value = v),
)
watch(isOpen, (v) => emit('update:modelValue', v))

const formRef = ref(null)
const loading = ref(false)

const form = ref({
  title: '',
  content: '',
  date: '',
  registrationDeadline: '',
  image: '',
})

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

// 編輯模式帶入資料
watch(
  () => props.initialData,
  (val) => {
    if (!val) {
      form.value = { title: '', content: '', date: '', registrationDeadline: '', image: '' }
      formRef.value?.resetValidation?.()
      return
    }
    form.value = {
      title: val.title || '',
      content: val.content || '',
      // 從 ISO 轉回 datetime-local 可吃的字串（YYYY-MM-DDTHH:mm）
      date: val.date ? toLocalInput(val.date) : '',
      registrationDeadline: val.registrationDeadline ? toLocalInput(val.registrationDeadline) : '',
      image: val.image || '',
    }
    formRef.value?.resetValidation?.()
  },
  { immediate: true },
)

const toLocalInput = (iso) => {
  const d = new Date(iso)
  // pad
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const rules = {
  required: (v) => !!v || '此欄位為必填',
}

const handleSubmit = () => {
  if (!form.value.title || !form.value.content || !form.value.date) {
    alert('請填寫必填欄位')
    return
  }
  // 只回傳表單資料，父層會補 communityId 與轉 ISO
  emit('submit', { ...form.value })
  isOpen.value = false
}

const isEdit = computed(() => !!props.initialData)
</script>
