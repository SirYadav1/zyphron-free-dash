import { defineStore } from 'pinia'
import client from '../api/client'

export const useStoreStore = defineStore('store', {
  state: () => ({
    server: null,
    pricing: null,
    userCoins: 0,
    loading: false,
    error: null,
    success: null,
  }),

  actions: {
    async fetchOptions(serverId) {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.get(`/store/${serverId}`)
        this.server = data.server
        this.pricing = data.pricing
        this.userCoins = data.user.coins
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load store options'
        throw error
      } finally {
        this.loading = false
      }
    },

    async upgrade(serverId, type, amount) {
      this.loading = true
      this.error = null
      this.success = null
      try {
        const { data } = await client.post(`/store/${serverId}/upgrade`, { type, amount })
        this.userCoins = data.remainingCoins
        if (this.server) {
          this.server[type].current += amount
        }
        this.success = data.message
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Upgrade failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async renew(serverId) {
      this.loading = true
      this.error = null
      this.success = null
      try {
        const { data } = await client.post(`/store/${serverId}/renew`)
        this.userCoins = data.remainingCoins
        if (this.server) {
          this.server.expiresAt = data.expiresAt
          this.server.status = 'active'
        }
        this.success = data.message
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Renewal failed'
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})
