// src/composables/useAdminGuard.js
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useUserStore } from '@/stores/user'

export function useAdminGuard(communityId) {
  const userStore = useUserStore()
  const isAdmin = ref(false)
  const loading = ref(true)
  const error = ref(null)

  onMounted(async () => {
    try {
      if (!userStore.user?._id) {
        error.value = '請先登入'
        return
      }

      console.log('[Guard] 檢查管理員:', {
        userId: userStore.user._id,
        communityId,
      })

      // 從 /members API 拿 admins & members
      const res = await api.get(`/communities/${communityId}/members`, {
        headers: { 'Cache-Control': 'no-cache' },
      })

      // 取回的 admins 是已 populate 的使用者陣列
      const admins = res.data?.admins || []
      console.log('[Guard] 後端返回 admins:', admins)

      // 以 _id 做比對
      isAdmin.value = admins.some((a) => String(a._id) === String(userStore.user._id))

      if (!isAdmin.value) {
        error.value = '您不是此社區的管理員'
      }
    } catch (err) {
      console.error('[Guard] API 請求失敗:', err)
      error.value = err?.response?.data?.message || '驗證失敗'
    } finally {
      loading.value = false
    }
  })

  return { isAdmin, loading, error }
}
