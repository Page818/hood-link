import { defineStore } from 'pinia'
import api from '@/services/api'

// 安全解析 JSON，避免 localStorage 資料壞掉導致報錯
function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    // 啟動時先從 localStorage 嘗試還原
    user: safeParse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
  }),

  actions: {
    /**
     * 設定使用者資訊
     */
    setUser(data) {
      // 確保 user._id 存在（有些 API 可能回傳 id）
      if (data && !data._id && data.id) {
        data._id = data.id
      }
      this.user = data

      try {
        localStorage.setItem('user', JSON.stringify(data))
      } catch (e) {
        console.warn('[UserStore] Failed to save user:', e)
      }
    },

    /**
     * 設定 JWT token
     */
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    /**
     * 登出，清空使用者與 token
     */
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    /**
     * 確保 user 已就緒：
     * 1. 如果 state 裡已有 user._id → 直接回傳
     * 2. 否則請求 /users/me → 正常化資料 → 儲存
     */
    async ensureUser(verbose = true) {
      if (this.user?._id) {
        verbose && console.log('[UserStore] User already loaded:', this.user._id)
        return this.user
      }

      try {
        const res = await api.get('/users/me', {
          headers: { 'Cache-Control': 'no-cache' },
          params: { _t: Date.now() }, // 加亂數避免快取
        })

        // Debug log：方便追蹤 API 實際回傳
        console.log('[UserStore] /users/me raw response:', res.data)

        // 處理 API 回傳格式，兼容 { user: {...} } 或 {...} 兩種格式
        let u = res.data?.user || res.data
        if (u && u.id && !u._id) u._id = u.id

        if (u && u._id) {
          this.setUser(u)
          verbose && console.log('[UserStore] Loaded from /users/me:', u._id)
          return u
        }

        verbose && console.warn('[UserStore] /users/me returned invalid:', res.data)
        return null
      } catch (e) {
        console.error('[UserStore] Failed to fetch /users/me:', e)
        return null
      }
    },
  },
})
