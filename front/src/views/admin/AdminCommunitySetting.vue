<template>
  <v-container class="py-10">
    <BackToAdminDashboard :communityId="route.params.communityId" />

    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">社區設定</h1>
    </div>

    <v-card elevation="2" class="pa-6">
      <v-form>
        <v-row dense>
          <!-- 社區名稱 -->
          <v-col cols="12" md="6">
            <v-text-field v-model="form.name" label="社區名稱" density="comfortable" clearable />
          </v-col>

          <!-- 縣市 -->
          <v-col cols="12" md="3">
            <v-select
              v-model="form.city"
              :items="cities"
              label="縣市"
              density="comfortable"
              @update:modelValue="form.district = ''"
            />
          </v-col>

          <!-- 區域 -->
          <v-col cols="12" md="3">
            <v-select
              v-model="form.district"
              :items="districtsForSelectedCity"
              :disabled="!form.city"
              label="區域"
              density="comfortable"
            />
          </v-col>

          <!-- 詳細地址 -->
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.detailAddress"
              label="詳細地址"
              density="comfortable"
              :disabled="!form.city || !form.district"
            />
          </v-col>

          <!-- 是否公開 -->
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-switch
              v-model="form.isPublic"
              inset
              color="primary"
              :label="form.isPublic ? '公開' : '需審核'"
            />
          </v-col>
        </v-row>

        <!-- 按鈕 -->
        <div class="d-flex gap-2 mt-4">
          <v-btn
            color="primary"
            :loading="loading.update"
            :disabled="isSaveDisabled"
            @click="updateCommunity"
          >
            儲存變更
          </v-btn>
          <v-btn variant="text" @click="resetForm">重置</v-btn>
        </div>
      </v-form>

      <v-expand-transition>
        <v-alert v-if="updateMsg" type="success" class="mt-4">
          {{ updateMsg }}
        </v-alert>
      </v-expand-transition>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import taiwanDistricts from '@/assets/taiwanDistricts.json'
import BackToAdminDashboard from '@/components/BakToAdminDashboard.vue'

const route = useRoute()
const communityId = route.params.communityId

const form = ref({
  name: '',
  city: '',
  district: '',
  detailAddress: '',
  isPublic: true,
})

const loading = ref({ fetch: false, update: false })
const updateMsg = ref('')

// 縣市資料
const cities = taiwanDistricts.map((c) => c.city)

// 動態取得該縣市的區域
const districtsForSelectedCity = computed(() => {
  const cityObj = taiwanDistricts.find((c) => c.city === form.value.city)
  return cityObj ? cityObj.districts : []
})

// 載入初始資料
async function fetchCommunity() {
  loading.value.fetch = true
  try {
    const { data } = await api.get(`/communities/${communityId}`)
    const community = data.community

    form.value.name = community.name
    form.value.isPublic = community.isPublic || false

    // 嘗試解析地址
    const matchedCity = taiwanDistricts.find((c) => community.address.startsWith(c.city))
    if (matchedCity) {
      form.value.city = matchedCity.city
      const matchedDistrict = matchedCity.districts.find((d) => community.address.includes(d))
      form.value.district = matchedDistrict || ''
      form.value.detailAddress = community.address
        .replace(matchedCity.city, '')
        .replace(matchedDistrict || '', '')
    } else {
      // 如果地址格式不符合
      form.value.detailAddress = community.address
    }
  } catch (err) {
    console.error('❌ 載入社區失敗:', err)
    alert(err?.response?.data?.message || '無法載入社區資料')
  } finally {
    loading.value.fetch = false
  }
}

// 更新社區
async function updateCommunity() {
  updateMsg.value = ''
  loading.value.update = true
  try {
    const address = `${form.value.city}${form.value.district}${form.value.detailAddress}`
    const payload = {
      communityId,
      name: form.value.name,
      address,
      isPublic: form.value.isPublic,
    }
    const { data } = await api.patch('/communities/update', payload)
    updateMsg.value = data.message || '社區資料已更新'
  } catch (err) {
    console.error('❌ 更新社區失敗:', err)
    alert(err?.response?.data?.message || '更新社區失敗')
  } finally {
    loading.value.update = false
  }
}

// 是否允許儲存
const isSaveDisabled = computed(() => {
  return !form.value.name || !form.value.city || !form.value.district || !form.value.detailAddress
})

// 重置表單
function resetForm() {
  fetchCommunity()
}

onMounted(fetchCommunity)
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
