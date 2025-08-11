<template>
  <v-container class="py-8">
    <BackToDashboard />

    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h5 font-weight-bold">活動一覽</h1>
    </div>

    <v-row>
      <v-col cols="12" md="4" lg="3">
        <EventList
          :events="events"
          :selectedId="selectedId"
          :loading="loading.list"
          @select="handleSelect"
        />
      </v-col>

      <v-col cols="12" md="8" lg="9">
        <EventDetail
          :event="detail"
          :loading="loading.detail"
          :isRegistering="loading.register"
          :isCancelling="loading.cancel"
          :isSelfRegistered="isSelfRegistered"
          @register="registerEvent"
          @cancel="cancelRegistration"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { useCommunityId } from '@/composables/useCommunityId'
import EventList from '@/components/EventList.vue'
import EventDetail from '@/components/EventDetail.vue'
import BackToDashboard from '@/components/BackToDashboard.vue'

const router = useRouter()
const { communityId } = useCommunityId()

const events = ref([])
const selectedId = ref(null)
const detail = ref(null)
const loading = ref({ list: false, detail: false, register: false, cancel: false })

const currentUser = JSON.parse(localStorage.getItem('user') || 'null')
const myId = currentUser?._id
const isSelfRegistered = computed(() => {
  if (!detail.value || !Array.isArray(detail.value.participants)) return false
  return detail.value.participants.some((p) => (p?._id || p) === myId)
})

// 進頁
onMounted(async () => {
  if (!communityId.value) {
    router.push({ name: 'community.join' })
    return
  }
  await fetchList()
})

// 切換社區時刷新（交給 fetchList 處理重入）
watch(() => communityId.value, fetchList)

// ---- 防重入快取 ----
let lastFetchedCommunityId = null
let lastFetchedDetailId = null

// 取得清單
async function fetchList() {
  const id = communityId.value
  if (!id || id === lastFetchedCommunityId) return
  lastFetchedCommunityId = id

  // 切社區時先清空右側
  selectedId.value = null
  detail.value = null

  loading.value.list = true
  try {
    const { data } = await api.get(`/events/community/${id}`)
    events.value = data.events || []

    // 只在尚未選擇時設定預設值，避免和子元件互相觸發
    if (!selectedId.value && events.value.length) {
      const now = new Date()
      const upcoming = events.value
        .filter((e) => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      const defaultId = (upcoming[0] || events.value[0])._id
      if (selectedId.value !== defaultId) selectedId.value = defaultId
    }
  } catch (err) {
    console.error('❌ 取得活動清單失敗', err)
  } finally {
    loading.value.list = false
  }
}

// 取得詳情（同一 id 不重抓）
async function fetchDetail() {
  const id = selectedId.value
  if (!id || id === lastFetchedDetailId) return
  lastFetchedDetailId = id

  loading.value.detail = true
  try {
    const { data } = await api.get(`/events/id/${id}`)
    detail.value = data.event
  } catch (err) {
    console.error('❌ 取得活動詳情失敗', err)
  } finally {
    loading.value.detail = false
  }
}

// 只有 id 變化才更新，避免回圈
function handleSelect(id) {
  if (!id || id === selectedId.value) return
  selectedId.value = id
}

watch(selectedId, fetchDetail)

// 報名/取消
async function registerEvent() {
  if (!detail.value) return
  loading.value.register = true
  try {
    await api.post(`/events/register/${detail.value._id}`)
    await fetchDetail()
  } catch (err) {
    console.error('❌ 報名失敗', err)
    alert(err?.response?.data?.message || '報名失敗')
  } finally {
    loading.value.register = false
  }
}

async function cancelRegistration() {
  if (!detail.value) return
  loading.value.cancel = true
  try {
    await api.delete(`/events/register/${detail.value._id}`)
    await fetchDetail()
  } catch (err) {
    console.error('❌ 取消報名失敗', err)
    alert(err?.response?.data?.message || '取消報名失敗')
  } finally {
    loading.value.cancel = false
  }
}
</script>
