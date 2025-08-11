// src/composables/useCommunityId.js


// 優先用 URL 的 :communityId，其次是 store 記錄，再其次是使用者的第一個社區
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

export function useCommunityId() {
  const route = useRoute()
  const userStore = useUserStore()

  const communityId = computed(() => {
    return (
      route.params.communityId ||
      userStore?.currentCommunityId ||              // 若你之後想加一個 communityStore，可先留這行
      userStore?.user?.community?.[0]?._id ||       // 最後一道保險
      null
    )
  })

  return { communityId }
}
