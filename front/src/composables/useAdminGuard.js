// src/composables/useAdminGuard.js
import { ref, computed, onMounted, unref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import api from '@/services/api'
import { toId } from '@/utils/id'

/**
 * options:
 *  - redirectOnFail: boolean = true   // 驗證失敗是否自動轉址
 *  - redirectTo: string = '/'         // 轉址目標
 *  - verbose: boolean = true          // 是否在 console 顯示除錯資訊
 */
export function useAdminGuard(communityId, options = {}) {
  const { redirectOnFail = true, redirectTo = '/', verbose = true } = options

  const router = useRouter()
  const userStore = useUserStore()

  const loading = ref(true)
  const isAdmin = ref(false)
  const error = ref(null)
  const redirected = ref(false)

  // 1) 確保 Authorization 已掛上
  const token = localStorage.getItem('token')
  if (token && !api.defaults.headers?.common?.Authorization) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    verbose && console.log('[Guard] Attached Authorization from localStorage')
  }

  const cid = computed(() => String(unref(communityId) || ''))
  const userId = computed(() => toId(userStore.user?._id))

  const ensureUserLoaded = async () => {
    if (!token) return
    if (!userStore.user?._id) {
      try {
        const { data } = await api.get('/users/me')
        if (data?.user) {
          userStore.setUser?.(data.user) || (userStore.user = data.user)
          localStorage.setItem('user', JSON.stringify(data.user))
          verbose && console.log('[Guard] /users/me loaded:', toId(data.user?._id))
        }
      } catch (e) {
        verbose && console.warn('[Guard] /users/me failed:', e?.response?.status)
      }
    }
  }

  const checkAdmin = async () => {
    loading.value = true
    error.value = null
    try {
      await ensureUserLoaded()

      if (!cid.value) {
        error.value = '缺少 communityId'
        return
      }
      if (!userId.value) {
        error.value = '尚未取得使用者 ID'
        return
      }

      const res = await api.get(`/communities/${cid.value}/members`)
      const adminsRaw = res.data?.admins || []
      // 2) 統一把 admins 轉成 ID（兼容 object / string）
      const adminIds = adminsRaw.map((a) => toId(a)).filter(Boolean)

      isAdmin.value = adminIds.includes(userId.value)

      if (verbose) {
        console.log('[Guard] checkAdmin →', {
          communityId: cid.value,
          userId: userId.value,
          adminIds,
          isAdmin: isAdmin.value,
        })
      }

      if (!isAdmin.value) {
        error.value = '您不是管理員，無法存取此頁面'
        if (redirectOnFail && !redirected.value) {
          redirected.value = true
          router.push(redirectTo)
        }
      }
    } catch (err) {
      error.value = '無法驗證管理員身分'
      verbose && console.error('[Guard] checkAdmin error:', err?.response || err)
      if (redirectOnFail && !redirected.value) {
        redirected.value = true
        router.push(redirectTo)
      }
    } finally {
      loading.value = false
    }
  }

  onMounted(checkAdmin)

  // 對外暴露一個 recheck，當路由或 store 更新時可手動重驗
  return { isAdmin, loading, error, recheck: checkAdmin }
}
