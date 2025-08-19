<!-- views/me/Myprofile.vue -->
<template>
  <v-card class="pa-4">
    <div class="text-subtitle-1 font-weight-medium mb-3">我的資料</div>
    <v-row>
      <v-col cols="12" md="3">
        <v-select
          v-model="form.salutation"
          :items="['先生', '小姐', '博士', '老師']"
          label="稱謂"
          variant="outlined"
        />
      </v-col>
      <v-col cols="12" md="5">
        <v-text-field
          v-model="form.name"
          label="名字"
          variant="outlined"
          :error-messages="nameErrors"
          @blur="touched.name = true"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="form.phone"
          label="電話"
          variant="outlined"
          :error-messages="phoneErrors"
          @blur="touched.phone = true"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.lineId" label="LINE ID" variant="outlined" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          :model-value="me.email"
          label="電子信箱（登入用）"
          variant="outlined"
          disabled
        />
      </v-col>
    </v-row>

    <div class="d-flex justify-end ga-2">
      <v-btn variant="tonal" :disabled="!dirty" @click="reset">還原</v-btn>
      <v-btn color="primary" :disabled="!valid || !dirty" :loading="saving" @click="save"
        >儲存</v-btn
      >
    </div>
  </v-card>

  <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2200" rounded="pill">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import api from '@/services/api'

const props = defineProps({ me: { type: Object, default: () => ({}) } })
const emit = defineEmits(['updated'])

const form = ref({ salutation: '', name: '', phone: '', lineId: '' })
const base = ref({})
const saving = ref(false)
const snackbar = ref({ show: false, color: 'success', message: '' })
const toast = (m, c = 'success') => (snackbar.value = { show: true, color: c, message: m })

watch(
  () => props.me,
  (v) => {
    base.value = {
      salutation: v.salutation || '',
      name: v.name || '',
      phone: v.phone || '',
      lineId: v.lineId || '',
    }
    form.value = { ...base.value }
  },
  { immediate: true },
)

const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(base.value))

const touched = ref({ name: false, phone: false })
const rules = {
  required: (v) => (v && v.trim().length) > 0 || '必填',
  phone: (v) => !v || /^0\d{8,10}$/.test(v) || '電話格式不正確',
}
const nameErrors = computed(() =>
  !touched.value.name ? [] : [rules.required(form.value.name)].filter(Boolean),
)
const phoneErrors = computed(() =>
  !touched.value.phone ? [] : [rules.phone(form.value.phone)].filter(Boolean),
)
const valid = computed(
  () => rules.required(form.value.name) === true && rules.phone(form.value.phone) === true,
)

function reset() {
  form.value = { ...base.value }
}

async function save() {
  if (!valid.value || !dirty.value) return
  saving.value = true
  try {
    await api.patch('/users/update', form.value)
    toast('資料已更新')
    emit('updated')
  } catch (e) {
    toast(e?.response?.data?.message || '更新失敗', 'error')
  } finally {
    saving.value = false
  }
}
</script>
