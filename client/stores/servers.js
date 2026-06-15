import { defineStore } from 'pinia'
import client from '../api/client'

export const useServersStore = defineStore('servers', {
  state: () => ({
    servers: [],
    blueprint: null,
    plans: [],
    stats: { active: 0, suspended: 0, expired: 0, total: 0, panelUrl: '' },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchServers() {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.get('/servers')
        this.servers = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch servers'
      } finally {
        this.loading = false
      }
    },

    async fetchBlueprint() {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.get('/servers/blueprint')
        this.blueprint = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch blueprint'
      } finally {
        this.loading = false
      }
    },

    async fetchPlans() {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.get('/products')
        this.plans = data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch plans'
      } finally {
        this.loading = false
      }
    },

    async fetchStats() {
      try {
        const { data } = await client.get('/servers/stats')
        this.stats = data
      } catch {
        // ignore errors on stats fetch
      }
    },

    async createServer(serverName, productId, extraPayload = {}) {
      this.loading = true
      this.error = null
      try {
        const payload = { serverName, ...extraPayload }
        if (productId) payload.productId = productId
        const { data } = await client.post('/servers', payload)
        this.servers.unshift(data)
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create server'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteServer(id) {
      this.loading = true
      this.error = null
      try {
        await client.delete(`/servers/${id}`)
        this.servers = this.servers.filter((s) => s.id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete server'
        throw error
      } finally {
        this.loading = false
      }
    },
    async renewServer(id) {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.post(`/servers/${id}/renew`)
        const idx = this.servers.findIndex((s) => s.id === id)
        if (idx !== -1) {
          this.servers[idx] = {
            ...this.servers[idx],
            expiresAt: data.newExpiresAt,
            status: 'active',
            isSuspended: false,
          }
        }
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to renew server'
        throw error
      } finally {
        this.loading = false
      }
    },
    async toggleAutoRenew(serverId) {
      try {
        const { data } = await client.post(`/servers/${serverId}/auto-renew-toggle`)
        const idx = this.servers.findIndex((s) => s.id === serverId)
        if (idx !== -1) {
          this.servers[idx] = {
            ...this.servers[idx],
            autoRenew: data.autoRenew,
          }
        }
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to toggle auto-renew'
        throw error
      }
    },
  },
})
