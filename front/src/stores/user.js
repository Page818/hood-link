// store/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
  }),
  actions: {
    setUser(data) {
      this.user = data
      localStorage.setItem('user', JSON.stringify(data))
    },
    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },
  },
})
