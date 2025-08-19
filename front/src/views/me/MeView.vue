<!-- views/me/MeView -->
<template>
  <v-container class="py-8" style="max-width: 1100px">
    <!-- 頂部使用者卡 -->
    <v-card class="pa-4 mb-4">
      <div class="d-flex align-center">
        <v-avatar size="64">
          <v-img v-if="me.avatarUrl" :src="me.avatarUrl" cover />
          <div v-else class="w-100 h-100 d-flex align-center justify-center bg-primary text-white">
            <span class="text-h6">{{ initials(me.name) }}</span>
          </div>
        </v-avatar>
        <div class="ml-4">
          <div class="text-h6 font-weight-bold">
            {{ me.salutation ? me.salutation + ' ' : '' }}{{ me.name || '—' }}
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ me.email || '—' }}</div>
          <div class="text-body-2 text-medium-emphasis">
            {{ me.phone || '—' }} <span v-if="me.lineId">· LINE: {{ me.lineId }}</span>
          </div>
        </div>
        <v-spacer />
        <v-btn variant="tonal" color="primary" @click="activeTab = 'profile'">編輯我的資料</v-btn>
      </div>
    </v-card>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="activity">我的活動</v-tab>
      <v-tab value="profile">我的資料</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="activity">
        <MyActivity />
      </v-window-item>
      <v-window-item value="profile">
        <MyProfile :me="me" @updated="refreshMe" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import MyActivity from './MyActivity.vue'
import MyProfile from './MyProfile.vue'

const me = ref({}) // { name, salutation, email, phone, lineId, avatarUrl }
const activeTab = ref('activity')

function initials(name = '') {
  return name.trim() ? name.trim()[0].toUpperCase() : 'U'
}

async function refreshMe() {
  const { data } = await api.get('/users/me')
  me.value = data.user || data
}

onMounted(refreshMe)
</script>
