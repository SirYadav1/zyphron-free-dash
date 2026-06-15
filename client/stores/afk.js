import { defineStore } from 'pinia'
import client from '../api/client'

export const useAfkStore = defineStore('afk', {
  state: () => ({
    sessionId: null,
    tabId: null,
    isActive: false,
    totalEarned: 0,
    totalSeconds: 0,
    todayEarned: 0,
    totalCoins: 0,
    sessionMinutes: 0,
    rateCoins: 10,
    rateInterval: 1,
    heartbeatInterval: null,
    tickInterval: null,
    error: null,
    multiTabDetected: false,
    consecutiveErrors: 0,
    ownTabId: null,

    accumulatedSeconds: 0,
    resumeTime: null,
  }),

  actions: {
    async startSession() {
      this.error = null
      this.multiTabDetected = false
      this.consecutiveErrors = 0
      try {
        const { data } = await client.post('/afk/start')
        this.sessionId = data.sessionId
        this.tabId = data.tabId
        this.ownTabId = data.tabId
        this.isActive = true
        this.totalEarned = 0
        this.totalSeconds = 0
        this.accumulatedSeconds = 0

        const bc = new BroadcastChannel('afk-earning')
        bc.postMessage({ type: 'SESSION_STARTED', tabId: this.tabId })
        bc.close()

        this.startTick()
        this.startHeartbeat()
        return true
      } catch (error) {
        if (error.response?.status === 409) {
          this.multiTabDetected = true
          this.error = 'You are already earning in another tab. Close it first.'
        } else {
          this.error = error.response?.data?.message || 'Failed to start session'
        }
        return false
      }
    },

    startTick() {
      this.stopTick()
      this.resumeTime = Date.now()
      this.tickInterval = setInterval(() => {
        const now = Date.now()
        if (this.isActive && document.hasFocus() && document.visibilityState === 'visible') {
          this.totalSeconds = this.accumulatedSeconds + Math.floor((now - this.resumeTime) / 1000)
        } else {
          this.accumulatedSeconds = this.totalSeconds
          this.resumeTime = now
        }
      }, 250)
    },

    pauseTick() {
      if (this.resumeTime !== null) {
        this.accumulatedSeconds = this.totalSeconds
        this.resumeTime = null
      }
      this.stopTick()
    },

    resumeTick() {
      if (this.isActive) {
        this.startTick()
      }
    },

    stopTick() {
      if (this.tickInterval) {
        clearInterval(this.tickInterval)
        this.tickInterval = null
      }
    },

    startHeartbeat() {
      this.stopHeartbeat()
      this.consecutiveErrors = 0

      const doHeartbeat = async () => {
        if (!this.sessionId || !this.tabId || !this.isActive) return

        const visible = document.hasFocus() && document.visibilityState === 'visible'
        try {
          const { data } = await client.post('/afk/heartbeat', {
            sessionId: this.sessionId,
            tabId: this.tabId,
            visible,
          })
          this.consecutiveErrors = 0
          this.totalEarned = data.totalEarned
          this.isActive = data.isActive

          if (!data.isActive) {
            this.stopHeartbeat()
            this.stopTick()
          }
        } catch (err) {
          this.consecutiveErrors += 1
          if (this.consecutiveErrors >= 5) {
            this.isActive = false
            this.stopHeartbeat()
            this.stopTick()
          }
        }
      }

      this.heartbeatInterval = setInterval(doHeartbeat, 10000)
    },

    stopHeartbeat() {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval)
        this.heartbeatInterval = null
      }
    },

    async stopSession() {
      if (!this.sessionId || !this.tabId) return
      try {
        await client.post('/afk/stop', {
          sessionId: this.sessionId,
          tabId: this.tabId,
        })
      } catch {
        // ignore errors on stop
      }
      this.stopHeartbeat()
      this.stopTick()
      this.isActive = false

      const bc = new BroadcastChannel('afk-earning')
      bc.postMessage({ type: 'SESSION_ENDED', tabId: this.tabId })
      bc.close()
    },

    async fetchStats() {
      try {
        const { data } = await client.get('/afk/stats')
        this.todayEarned = data.todayEarned
        this.totalCoins = data.totalCoins
        this.sessionMinutes = data.sessionMinutes
        if (data.rateCoins) this.rateCoins = data.rateCoins
        if (data.rateInterval) this.rateInterval = data.rateInterval
      } catch {
        // ignore
      }
    },

    reset() {
      this.stopHeartbeat()
      this.stopTick()
      this.sessionId = null
      this.tabId = null
      this.ownTabId = null
      this.isActive = false
      this.totalEarned = 0
      this.totalSeconds = 0
      this.accumulatedSeconds = 0
      this.resumeTime = null
      this.error = null
      this.multiTabDetected = false
      this.consecutiveErrors = 0
    },
  },
})
