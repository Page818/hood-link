<!-- src/views/admin/AdminCommunityDashboard.vue -->
<template>
  <v-container class="py-8">
    
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold">社區後台選單</h1>
      <div class="text-medium-emphasis">滑動卡片或點擊進入各管理頁</div>
    </div>

    <!-- Swiper 入口卡片 -->
    <Swiper
      :modules="modules"
      :slides-per-view="breakpointSlides"
      :space-between="16"
      :navigation="true"
      :pagination="{ clickable: true }"
      class="admin-swiper"
    >
      <SwiperSlide v-for="item in cards" :key="item.value">
        <v-card
          class="h-100 d-flex flex-column justify-space-between hover:shadow-lg cursor-pointer"
          @click="go(item)"
        >
          <v-card-text class="py-6">
            <div class="d-flex align-center ga-3">
              <v-avatar size="44" variant="tonal" color="primary">
                <v-icon size="28">{{ item.icon }}</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">{{ item.title }}</div>
                <div class="text-medium-emphasis">{{ item.subtitle }}</div>
              </div>
            </div>

            <div class="mt-4 text-body-2 text-medium-emphasis">
              {{ item.desc }}
            </div>
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn variant="tonal" color="primary" append-icon="mdi-arrow-right"> 前往 </v-btn>
          </v-card-actions>
        </v-card>
      </SwiperSlide>
    </Swiper>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toId } from '@/utils/id'

// Swiper
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, A11y } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const modules = [Navigation, Pagination, A11y]

const route = useRoute()
const router = useRouter()
const communityId = toId(route.params.communityId)

const cards = [
  {
    title: '公告管理',
    subtitle: 'Announcement',
    value: 'announcement',
    icon: 'mdi-bullhorn-outline',
    desc: '新增、編輯、置頂公告與圖片上傳。',
    // 對應到你的路由名稱
    to: { name: 'admin.community.announcement', params: { communityId } },
  },
  {
    title: '活動管理',
    subtitle: 'Events',
    value: 'event',
    icon: 'mdi-calendar-check-outline',
    desc: '建立活動、報名與名單匯出。',
    to: { name: 'admin.community.event', params: { communityId } },
  },
  {
    title: '通報管理',
    subtitle: 'Reports',
    value: 'report',
    icon: 'mdi-alert-outline',
    desc: '住戶通報事項受理、派工與追蹤。',
    to: { name: 'admin.community.report', params: { communityId } },
  },
  {
    title: '社區成員',
    subtitle: 'Members',
    value: 'members',
    icon: 'mdi-account-group-outline',
    desc: '住戶與管理員權限設定。',
    to: { name: 'admin.community.members', params: { communityId } },
  },
  {
    title: '安否回報',
    subtitle: 'Check-in',
    value: 'checkin',
    icon: 'mdi-heart-pulse',
    desc: '災時安否回覆與統計儀表板。',
    to: { name: 'admin-checkin', params: { communityId } },
  },
  {
    title: '社區設定',
    subtitle: 'Settings',
    value: 'settings',
    icon: 'mdi-cog-outline',
    desc: '社區基本資料與設定。',
    to: { name: 'admin.community.settings', params: { communityId } },
  },
]

// RWD：手機 1 張、平板 2 張、桌機 3~4 張
const breakpointSlides = computed(() => {
  const w = window.innerWidth
  if (w < 600) return 1.05
  if (w < 960) return 2
  if (w < 1280) return 3
  return 4
})

const go = (item) => {
  // 確保 communityId 一律為字串
  const to = { ...item.to, params: { ...item.to.params, communityId: toId(communityId) } }
  router.push(to)
}
</script>

<style scoped>
.admin-swiper :deep(.swiper-slide) {
  height: 240px; /* 卡片高度 */
}
.cursor-pointer {
  cursor: pointer;
}
.hover\:shadow-lg:hover {
  box-shadow: var(--v-shadow-6);
}
</style>
