<!-- views/EventView.vue -->
<template>
  <v-container class="py-8">
    <BackToDashboard :community-id="communityId" />

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

    <!-- 通知 -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000" rounded="pill">
      {{ snackbar.message }}
    </v-snackbar>
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
import { toId } from '@/utils/id.js'
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()

const router = useRouter()
const { communityId } = useCommunityId()

const events = ref([])
const selectedId = ref(null)
const detail = ref(null)
const loading = ref({ list: false, detail: false, register: false, cancel: false })

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})
function showToast(message, color = 'success') {
  snackbar.value.message = message
  snackbar.value.color = color
  snackbar.value.show = true
}

const currentUser = userStore.user || {}
// const myId = toId(currentUser)

// const isSelfRegistered = computed(() => {
//   return (detail.value?.participants ?? []).includes(myId)
// })
const myId = computed(() => toId(userStore.user))
const isSelfRegistered = computed(() => (detail.value?.participants ?? []).includes(myId.value))
let lastFetchedDetailId = null

async function safeApiCall(promise) {
  try {
    return await promise
  } catch (err) {
    if ([400, 409].includes(err?.response?.status)) {
      await fetchDetail(true)
    }
    throw err
  }
}

// 初始化進頁
// onMounted(async () => {
//   if (!communityId.value) {
//     router.push({ name: 'community.join' })
//     return
//   }
//   await fetchList()
// })
onMounted(async () => {
  // 先確保 user 就緒（Pinia action，會在需要時呼叫 /users/me）
  await userStore.ensureUser(api)

  // 沒有社區就導去加入社區
  if (!communityId.value) {
    router.push({ name: 'community.join' })
    return
  }

  // 載入活動清單
  await fetchList()
}) // ← 注意：這裡同時關閉了函式的大括號 } 與 onMounted 的右括號 )

// 切換社區時刷新
watch(() => communityId.value, fetchList)

// 取得活動清單
async function fetchList() {
  const id = communityId.value
  if (!id) return

  selectedId.value = null
  detail.value = null

  loading.value.list = true
  try {
    const { data } = await api.get(`/events/community/${id}`)
    events.value = data.events || []

    if (!selectedId.value && events.value.length) {
      const now = new Date()
      const upcoming = events.value
        .filter((e) => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
      selectedId.value = toId(upcoming[0] || events.value[0])
    }

    if (selectedId.value) {
      await fetchDetail(true)
    }
  } catch (err) {
    console.error('❌ 取得活動清單失敗', err)
  } finally {
    loading.value.list = false
  }
}

// 取得活動詳情（可強制重抓）
async function fetchDetail(force = false) {
  const id = selectedId.value
  if (!id) return
  if (!force && id === lastFetchedDetailId) return
  lastFetchedDetailId = id

  loading.value.detail = true
  try {
    const { data } = await api.get(`/events/id/${id}`)
    if (data?.event) {
      data.event.participants = (data.event.participants ?? []).map(toId)
    }
    detail.value = data.event
  } catch (err) {
    console.error('❌ 取得活動詳情失敗', err)
    showToast(err?.response?.data?.message || '取得活動詳情失敗', 'error')
  } finally {
    loading.value.detail = false
  }
}

// 切換選單時載入詳情
function handleSelect(id) {
  if (!id || id === selectedId.value) return
  selectedId.value = id
}
watch(selectedId, () => fetchDetail(true))

// 報名
async function registerEvent() {
  if (!detail.value) return
  loading.value.register = true
  try {
    const eventId = toId(detail.value)
    const prevCount = detail.value?.participants?.length ?? 0

    const { data } = await safeApiCall(api.post(`/events/register/${eventId}`))

    if (data?.event) {
      data.event.participants = (data.event.participants ?? []).map(toId)
      detail.value = data.event
      const idx = events.value.findIndex((e) => toId(e) === toId(data.event))
      if (idx > -1) events.value[idx] = { ...events.value[idx], ...data.event }
    } else {
      await fetchDetail(true)
    }
    const newCount = detail.value?.participants?.length ?? prevCount

    showToast(`報名成功！目前已報名：${newCount} 人`, 'success')
  } catch (err) {
    console.error('❌ 報名失敗', err)
    showToast(err?.response?.data?.message || '報名失敗', 'error')
  } finally {
    loading.value.register = false
  }
}

// 取消報名
async function cancelRegistration() {
  if (!detail.value) return
  loading.value.cancel = true
  try {
    const eventId = toId(detail.value)
    const prevCount = detail.value?.participants?.length ?? 0

    const { data } = await safeApiCall(api.delete(`/events/register/${eventId}`))

    if (data?.event) {
      data.event.participants = (data.event.participants ?? []).map(toId)
      detail.value = data.event
      const idx = events.value.findIndex((e) => toId(e) === toId(data.event))
      if (idx > -1) events.value[idx] = { ...events.value[idx], ...data.event }
    } else {
      await fetchDetail(true)
    }
    const newCount = detail.value?.participants?.length ?? prevCount

    showToast(`已取消報名，目前已報名：${newCount} 人`, 'success')
  } catch (err) {
    console.error('❌ 取消報名失敗', err)
    showToast(err?.response?.data?.message || '取消報名失敗', 'error')
  } finally {
    loading.value.cancel = false
  }
}
</script>
