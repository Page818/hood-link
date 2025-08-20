<!-- src/views/admin/AdminCommunityDashboard.vue -->
<template>
  <v-container fluid class="d-flex pa-0">
    <!-- 左側功能列 -->
    <v-navigation-drawer width="200" permanent>
      <v-list nav dense>
        <v-list-item
          v-for="item in menuItems"
          :key="item.value"
          :title="item.title"
          :value="item.value"
          :active="activeTab === item.value"
          @click="activeTab = item.value"
        >
          <template #prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 右側內容區 -->
    <v-main class="pa-6">
      <component :is="activeComponent" />
    </v-main>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'

// 側邊功能清單
const menuItems = [
  { title: '公告', value: 'announcement', icon: 'mdi-bullhorn-outline' },
  { title: '活動', value: 'event', icon: 'mdi-calendar-check-outline' },
  { title: '通報', value: 'report', icon: 'mdi-alert-outline' },
  { title: '成員', value: 'members', icon: 'mdi-account-group-outline' },
  { title: '安否回報', value: 'checkin', icon: 'mdi-heart-pulse' },
  // 未來還要新增：社區設定
]

const activeTab = ref('announcement')

// 預先引入元件（未來逐步建立）
// import AnnouncementAdmin from '@/components/admin/AnnouncementAdmin.vue'
// import EventAdmin from '@/components/admin/EventAdmin.vue'
// import ReportAdmin from '@/components/admin/ReportAdmin.vue'
// import MembersAdmin from '@/components/admin/MembersAdmin.vue'
// import CheckInAdmin from '@/components/admin/CheckInAdmin.vue'

const componentsMap = {
  announcement: AnnouncementAdmin,
  event: EventAdmin,
  report: ReportAdmin,
  members: MembersAdmin,
  checkin: CheckInAdmin,
}

const activeComponent = computed(() => componentsMap[activeTab.value])
</script>
