import { defineStore } from 'pinia'
import client from '../api/client'

function formatError(error, fallback) {
  const msg = error?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  return msg || fallback
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.isAdmin || false,
    emailVerified: (state) => state.user?.emailVerified || false,
  },

  actions: {
    async register(username, email, password, first_name = '', last_name = '') {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.post('/auth/register', { username, email, password, first_name, last_name })
        return data
      } catch (error) {
        this.error = formatError(error, 'Registration failed')
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.post('/auth/login', { email, password })
        // if 2FA is required, return the data without storing token
        if (data.requires2FA) {
          return data
        }
        localStorage.setItem('access_token', data.access_token)
        this.user = data.user
        return data
      } catch (error) {
        this.error = formatError(error, 'Login failed')
        throw error
      } finally {
        this.loading = false
      }
    },

    async verifyEmail(token) {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.post('/auth/verify-email', { token })
        if (this.user) {
          this.user.emailVerified = true
        }
        return data
      } catch (error) {
        this.error = formatError(error, 'Verification failed')
        throw error
      } finally {
        this.loading = false
      }
    },

    async resendVerification(email) {
      this.loading = true
      this.error = null
      try {
        const { data } = await client.post('/auth/resend-verification', { email })
        return data
      } catch (error) {
        this.error = formatError(error, 'Failed to resend verification')
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchProfile() {
      try {
        const { data } = await client.get('/auth/me')
        this.user = data
        return data
      } catch (error) {
        this.user = null
        localStorage.removeItem('access_token')
        throw error
      }
    },

    logout() {
      this.user = null
      localStorage.removeItem('access_token')
    },
  },
})
