// store/user.js
import { defineStore } from 'pinia'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    // 啟動時就嘗試還原 user（安全 parse）
    user: safeParse(localStorage.getItem('user')),
    token: localStorage.getItem('token') || null,
  }),
  actions: {
    setUser(data) {
      this.user = data
      try {
        localStorage.setItem('user', JSON.stringify(data))
      } catch {}
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    /**
     * 確保 user 已就緒：
     * 1) 若 state 內已有 user，直接回傳
     * 2) 否則請求 /users/me，成功後 setUser
     */
    async ensureUser(api) {
      if (this.user) return this.user
      try {
        const res = await api.get('/users/me')
        this.setUser(res.data.user)
        return this.user
      } catch (e) {
        // 可視需要在這裡做導向或清 token
        return null
      }
    },
  },
})

// import { defineStore } from 'pinia'

// export const useUserStore = defineStore('user', {
//   state: () => ({
//     user: null,
//     token: localStorage.getItem('token') || null,
//   }),
//   actions: {
//     setUser(data) {
//       this.user = data
//       localStorage.setItem('user', JSON.stringify(data))
//     },
//     logout() {
//       this.user = null
//       this.token = null
//       localStorage.removeItem('token')
//     },
//   },
// })
