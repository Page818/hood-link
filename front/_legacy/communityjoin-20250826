<template>
  <v-container class="py-10">
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h5 font-weight-bold">加入或切換社區</h1>
    </div>

    <v-row>
      <!-- 左側：我的社區 -->
      <v-col cols="12" md="4">
        <v-card elevation="2">
          <v-card-title class="text-subtitle-1 font-weight-bold"> 我的社區 </v-card-title>
          <v-divider />
          <v-card-text>
            <v-skeleton-loader v-if="loading.my" type="list-item-two-line" class="mb-2" />
            <v-alert v-else-if="myCommunities.length === 0" type="info" variant="tonal">
              你目前尚未加入任何社區，請在右側輸入社區 ID 加入。
            </v-alert>
            <v-list v-else nav>
              <v-list-item
                v-for="c in myCommunities"
                :key="c._id"
                :title="c.name"
                :subtitle="c.address"
                class="rounded-lg"
              >
                <template #append>
                  <v-btn size="small" variant="tonal" color="primary" @click="goCommunity(c._id)">
                    進入
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 右側：加入入口 -->
      <v-col cols="12" md="8">
        <v-card elevation="2" class="mb-6">
          <v-card-title class="text-subtitle-1 font-weight-bold"> 以社區 ID 加入 </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row class="align-center" dense>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="form.communityId"
                  label="輸入社區 ID"
                  placeholder="例如：66a…e1f"
                  density="comfortable"
                  clearable
                  :disabled="loading.lookup || loading.join"
                />
              </v-col>
              <v-col cols="12" md="4" class="d-flex gap-2">
                <v-btn
                  color="primary"
                  :loading="loading.lookup"
                  :disabled="!form.communityId || loading.join"
                  @click="lookupCommunity"
                >
                  查詢
                </v-btn>
                <v-btn variant="tonal" :disabled="true" title="之後開放"> 附近社區 </v-btn>
              </v-col>
            </v-row>

            <!-- 查詢結果 -->
            <v-expand-transition>
              <v-alert v-if="lookup.error" type="error" class="mt-4">
                {{ lookup.error }}
              </v-alert>
            </v-expand-transition>

            <v-expand-transition>
              <v-card v-if="lookup.community" variant="tonal" class="mt-4">
                <v-card-title class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ lookup.community.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ lookup.community.address }}
                      <span class="ml-2">
                        · {{ lookup.community.isPublic ? '公開社區' : '需審核' }}
                      </span>
                    </div>
                  </div>
                  <v-btn
                    color="primary"
                    :loading="loading.join"
                    :disabled="joinButtonDisabled"
                    @click="joinCommunity"
                  >
                    {{ joinButtonText }}
                  </v-btn>
                </v-card-title>
              </v-card>
            </v-expand-transition>
          </v-card-text>
        </v-card>

        <!-- 建立新社區（保留） -->
        <v-card elevation="2">
          <v-card-title class="text-subtitle-1 font-weight-bold"> 建立新社區 </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field v-model="createForm.name" label="社區名稱" density="comfortable" />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="createForm.address" label="社區地址" density="comfortable" />
              </v-col>
              <v-col cols="12" md="2" class="d-flex align-center">
                <v-switch
                  v-model="createForm.isPublic"
                  inset
                  color="primary"
                  :label="createForm.isPublic ? '公開' : '需審核'"
                />
              </v-col>
            </v-row>

            <div class="d-flex gap-2 mt-2">
              <v-btn
                color="primary"
                :loading="loading.create"
                :disabled="!createForm.name || !createForm.address"
                @click="createCommunity"
              >
                建立
              </v-btn>
              <v-btn variant="text" @click="resetCreate">清空</v-btn>
            </div>

            <v-expand-transition>
              <v-alert v-if="createMsg" type="success" class="mt-3">
                {{ createMsg }}
              </v-alert>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

// 左側：我的社區
const myCommunities = ref([])
const loading = ref({ my: false, lookup: false, join: false, create: false })

async function fetchMyCommunities() {
  loading.value.my = true
  try {
    const { data } = await api.get('/communities/my')
    myCommunities.value = data.communities || []
  } catch (err) {
    console.error('❌ 取得我的社區失敗', err)
  } finally {
    loading.value.my = false
  }
}

function goCommunity(id) {
  router.push({ name: 'community.dashboard', params: { communityId: id } })
}

// 右側：以 ID 查詢 + 加入
const form = ref({ communityId: '' })
const lookup = ref({ community: null, error: '', status: 'none' })

async function lookupCommunity() {
  lookup.value.error = ''
  lookup.value.community = null
  lookup.value.status = 'none'
  if (!form.value.communityId) return
  loading.value.lookup = true
  try {
    const { data } = await api.get(`/communities/${form.value.communityId}`)
    lookup.value.community = data.community

    // 查詢使用者在社區的狀態
    const statusRes = await api.get(`/communities/${form.value.communityId}/status`)
    lookup.value.status = statusRes.data.status
  } catch (err) {
    console.error('❌ 查詢社區失敗', err)
    lookup.value.error = err?.response?.data?.message || '查無此社區'
  } finally {
    loading.value.lookup = false
  }
}

async function joinCommunity() {
  if (!lookup.value.community?._id) return
  loading.value.join = true
  try {
    const body = { communityId: lookup.value.community._id }
    const { data } = await api.post('/communities/join', body)
    alert(data.message || '已送出加入')
    await fetchMyCommunities()
    const statusRes = await api.get(`/communities/${lookup.value.community._id}/status`)
    lookup.value.status = statusRes.data.status
    if (data.success && lookup.value.community.isPublic) {
      router.push({
        name: 'community.dashboard',
        params: { communityId: lookup.value.community._id },
      })
    }
  } catch (err) {
    console.error('❌ 加入社區失敗', err)
    alert(err?.response?.data?.message || '加入社區失敗')
  } finally {
    loading.value.join = false
  }
}

// 加入按鈕文字
const joinButtonText = computed(() => {
  switch (lookup.value.status) {
    case 'member':
      return '已加入'
    case 'pending':
      return '待審核'
    case 'rejected':
      return '重新申請'
    default:
      return '加入'
  }
})

// 加入按鈕狀態
const joinButtonDisabled = computed(() => {
  return lookup.value.status === 'member' || lookup.value.status === 'pending'
})

// 建立新社區
const createForm = ref({ name: '', address: '', isPublic: true })
const createMsg = ref('')

async function createCommunity() {
  createMsg.value = ''
  loading.value.create = true
  try {
    const { data } = await api.post('/communities/create', createForm.value)
    createMsg.value = '社區建立成功'
    await fetchMyCommunities()
  } catch (err) {
    console.error('❌ 建立社區失敗', err)
    alert(err?.response?.data?.message || '建立社區失敗')
  } finally {
    loading.value.create = false
  }
}

function resetCreate() {
  createForm.value = { name: '', address: '', isPublic: true }
}

onMounted(fetchMyCommunities)
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
