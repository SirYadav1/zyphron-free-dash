import { defineStore } from 'pinia'
import client from '../api/client'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    stats: null,
    users: [],
    servers: [],
    templates: [],
    settings: {},
    roles: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchStats() {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.get('/admin/stats')
        this.stats = data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load stats'
      } finally {
        this.loading = false
      }
    },

    async fetchUsers() {
      this.loading = true
      try {
        const { data } = await client.get('/admin/users')
        this.users = data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load users'
      } finally {
        this.loading = false
      }
    },

    async fetchUserDetail(id) {
      const { data } = await client.get(`/admin/users/${id}`)
      return data
    },

    async updateUser(id, payload) {
      const { data } = await client.put(`/admin/users/${id}`, payload)
      return data
    },

    async banUser(id, reason) {
      const { data } = await client.post(`/admin/users/${id}/ban`, { reason })
      return data
    },

    async unbanUser(id) {
      const { data } = await client.post(`/admin/users/${id}/unban`)
      return data
    },

    async fetchServers() {
      this.loading = true
      try {
        const { data } = await client.get('/admin/servers')
        this.servers = data
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load servers'
      } finally {
        this.loading = false
      }
    },

    async suspendServer(id) {
      await client.post(`/admin/servers/${id}/suspend`)
      await this.fetchServers()
    },

    async unsuspendServer(id) {
      await client.post(`/admin/servers/${id}/unsuspend`)
      await this.fetchServers()
    },

    async fetchTemplates() {
      try {
        const { data } = await client.get('/admin/templates')
        this.templates = data
      } catch { /* ignore */ }
    },

    async createTemplate(template) {
      const { data } = await client.post('/admin/templates', template)
      await this.fetchTemplates()
      return data
    },

    async updateTemplate(id, template) {
      const { data } = await client.put(`/admin/templates/${id}`, template)
      await this.fetchTemplates()
      return data
    },

    async deleteTemplate(id) {
      await client.delete(`/admin/templates/${id}`)
      await this.fetchTemplates()
    },

    async fetchSettings() {
      try {
        const { data } = await client.get('/admin/settings')
        this.settings = data
      } catch { /* ignore */ }
    },

    async updateSetting(key, value) {
      const { data } = await client.put(`/admin/settings/${key}`, { value })
      this.settings[key] = value
      return data
    },

    async fetchPterodactylNodes() {
      const { data } = await client.get('/admin/pterodactyl/nodes')
      return data
    },

    async fetchPterodactylNests() {
      const { data } = await client.get('/admin/pterodactyl/nests')
      return data
    },

    async fetchPterodactylEggs(nestId) {
      const { data } = await client.get(`/admin/pterodactyl/nests/${nestId}/eggs`)
      return data
    },

    async getPterodactylConfig() {
      const { data } = await client.get('/admin/pterodactyl/config')
      return data
    },

    async updatePterodactylConfig(panelUrl, apiKey, panelType = 'pterodactyl') {
      const { data } = await client.put('/admin/pterodactyl/config', { panelUrl, apiKey, panelType })
      return data
    },

    async testPterodactylConfig() {
      const { data } = await client.post('/admin/pterodactyl/test')
      return data
    },

    async getExpiredServers() {
      const { data } = await client.get('/admin/servers/expired')
      return data
    },

    async deleteServer(id) {
      const { data } = await client.post(`/admin/servers/${id}/delete`)
      return data
    },

    async checkServerExpiry(id) {
      const { data } = await client.get(`/admin/servers/${id}/expiry`)
      return data
    },

    async checkExpiredServers() {
      const { data } = await client.post('/admin/servers/check-expired')
      return data
    },

    async fetchRoles() {
      try {
        const { data } = await client.get('/admin/roles')
        this.roles = data
      } catch { /* ignore */ }
    },

    async assignRole(userId, roleId) {
      const { data } = await client.post(`/admin/roles/${roleId}/assign`, { user_id: userId })
      return data
    },

    async unassignRole(userId, roleId) {
      await client.delete(`/admin/roles/${roleId}/assign/${userId}`)
    },

    async getUserRoles(userId) {
      const { data } = await client.get(`/admin/roles/user/${userId}`)
      return data
    },
  },
})
