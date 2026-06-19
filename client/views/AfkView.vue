<template>
  <div class="max-w-5xl mx-auto space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Active Rewards</h2>
        <p class="text-sm text-text-muted">Earn compute credits by maintaining an active session.</p>
      </div>
      <div v-if="store.isActive" class="flex items-center gap-3 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
        <span class="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(0,229,153,0.4)]"></span>
        <span class="text-xs font-bold text-accent uppercase tracking-widest">Generating Credits</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="store.multiTabDetected" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Conflict Detected</p>
        <p class="text-xs text-text-muted mt-0.5">{{ store.error }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
      <!-- Main Generation Area -->
      <div class="flex flex-col justify-center min-h-[350px]">
        <!-- Inactive State -->
        <div v-if="!store.isActive && !store.multiTabDetected" class="card-surface p-12 text-center space-y-8">
          <div class="w-20 h-20 bg-base rounded-2xl border border-border flex items-center justify-center mx-auto text-4xl shadow-inner">
            ⚡
          </div>

          <div class="space-y-2">
            <h3 class="text-xl font-bold text-text-primary">Initialize Protocol</h3>
            <p class="text-sm text-text-muted max-w-xs mx-auto">
              Credits are generated automatically while this tab remains active and focused.
            </p>
          </div>

          <button
            @click="startEarning"
            :disabled="starting"
            class="btn-primary px-12 py-3 text-sm"
          >
            {{ starting ? 'Authenticating...' : 'Start Session' }}
          </button>

          <div class="flex items-center justify-center gap-4 text-[10px] font-bold text-text-muted uppercase tracking-widest opacity-40">
            <span>Rate: {{ store.rateCoins }} CR / {{ store.rateInterval }} MIN</span>
            <span class="w-1 h-1 rounded-full bg-border"></span>
            <span>Focus Required</span>
          </div>
        </div>

        <!-- Active State -->
        <div v-if="store.isActive" class="card-surface p-12 text-center space-y-10 relative overflow-hidden group">
          <div class="absolute inset-0 bg-accent/[0.01] pointer-events-none group-hover:bg-accent/[0.02] transition-colors"></div>
          
          <div class="relative inline-flex">
            <div class="w-20 h-20 bg-accent/10 rounded-3xl border border-accent/20 flex items-center justify-center animate-pulse">
              <span class="text-4xl">💎</span>
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-xl font-bold text-text-primary">Session Active</h3>
            
            <div :class="[
              'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-500',
              pageStatus === 'active' ? 'bg-accent/5 border-accent/20 text-accent' :
              pageStatus === 'blurred' ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-500' :
              'bg-red-500/5 border-red-500/20 text-red-500'
            ]">
              <span class="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" :class="
                pageStatus === 'active' ? 'bg-accent' :
                pageStatus === 'blurred' ? 'bg-yellow-500' :
                'bg-red-500'
              "></span>
              {{ pageStatus === 'active' ? 'High Performance' : 'Efficiency Mode' }}
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-1">
              <p class="text-label opacity-40">Earned</p>
              <p class="text-2xl font-bold text-accent tabular-nums">{{ store.totalEarned }}</p>
            </div>
            <div class="space-y-1 border-x border-border">
              <p class="text-label opacity-40">Uptime</p>
              <p class="text-2xl font-bold text-text-primary tabular-nums">{{ formattedTime }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Global</p>
              <p class="text-2xl font-bold text-text-primary tabular-nums">{{ store.totalCoins }}</p>
            </div>
          </div>

          <button
            @click="stopEarning"
            class="btn-secondary px-8 py-2 text-[11px] font-bold uppercase tracking-widest hover:text-red-400 hover:border-red-400/30"
          >
            Terminate Session
          </button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <div class="card-surface p-6 space-y-6">
          <p class="text-label opacity-50">Global Stats</p>
          <div class="space-y-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-text-muted">Today</span>
              <span class="text-sm font-bold text-accent tabular-nums">{{ store.todayEarned }} CR</span>
            </div>
            <div class="h-px bg-border"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-text-muted">Total Balance</span>
              <span class="text-sm font-bold text-text-primary tabular-nums">{{ store.totalCoins }} CR</span>
            </div>
            <div class="h-px bg-border"></div>
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-text-muted">Lifetime Time</span>
              <span class="text-sm font-bold text-text-primary tabular-nums">{{ store.sessionMinutes }}m</span>
            </div>
          </div>
        </div>

        <div class="card-surface p-6 bg-accent/[0.02] border-accent/10">
          <h4 class="text-xs font-bold text-text-primary mb-2 flex items-center gap-2">
            <svg class="w-3.5 h-3.5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Pro Tip
          </h4>
          <p class="text-[11px] text-text-muted leading-relaxed font-medium">
            Keep this tab visible and focused for maximum credit generation. Backgrounding the tab may reduce earning rates.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAfkStore } from '../stores/afk'
import client from '../api/client'

const store = useAfkStore()

const starting = ref(false)
const pageVisible = ref(document.hasFocus() && document.visibilityState === 'visible')
const pageStatus = ref(getPageStatus())

function getPageStatus() {
  if (!document.hasFocus()) return 'blurred'
  if (document.visibilityState !== 'visible') return 'hidden'
  return 'active'
}

const formattedTime = computed(() => {
  const mins = Math.floor(store.totalSeconds / 60)
  const secs = store.totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

let visibilityHandler = null
let focusHandler = null
let blurHandler = null
let beforeUnloadHandler = null
let broadcastChannel = null
let statsInterval = null

onMounted(async () => {
  await store.fetchStats()

  visibilityHandler = () => {
    pageVisible.value = document.hasFocus() && document.visibilityState === 'visible'
    pageStatus.value = getPageStatus()
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  focusHandler = () => {
    pageVisible.value = document.hasFocus() && document.visibilityState === 'visible'
    pageStatus.value = getPageStatus()
    store.resumeTick()
    if (store.sessionId && store.tabId) {
      client.post('/afk/heartbeat', {
        sessionId: store.sessionId,
        tabId: store.tabId,
        visible: true,
      }).then(({ data }) => {
        store.totalEarned = data.totalEarned
        store.isActive = data.isActive
        store.consecutiveErrors = 0
        if (!data.isActive) {
          store.stopHeartbeat()
          store.stopTick()
        }
      }).catch(() => {
        store.consecutiveErrors += 1
      })
    }
  }
  window.addEventListener('focus', focusHandler)

  blurHandler = () => {
    pageVisible.value = false
    pageStatus.value = 'blurred'
    store.pauseTick()
    if (store.sessionId && store.tabId) {
      client.post('/afk/heartbeat', {
        sessionId: store.sessionId,
        tabId: store.tabId,
        visible: false,
      }).catch(() => {})
    }
  }
  window.addEventListener('blur', blurHandler)

  broadcastChannel = new BroadcastChannel('afk-earning')
  broadcastChannel.onmessage = (event) => {
    if (event.data.type === 'SESSION_STARTED' && event.data.tabId !== store.ownTabId) {
      store.stopHeartbeat()
      store.stopTick()
      store.isActive = false
      store.multiTabDetected = true
      store.error = 'Another tab started earning. Close it and refresh.'
    }
  }

  statsInterval = setInterval(() => {
    store.fetchStats()
  }, 30000)

  beforeUnloadHandler = () => {
    store.stopSession()
  }
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
  if (focusHandler) {
    window.removeEventListener('focus', focusHandler)
  }
  if (blurHandler) {
    window.removeEventListener('blur', blurHandler)
  }
  if (broadcastChannel) {
    broadcastChannel.close()
  }
  if (statsInterval) {
    clearInterval(statsInterval)
  }
  if (beforeUnloadHandler) {
    window.removeEventListener('beforeunload', beforeUnloadHandler)
  }
  store.stopHeartbeat()
  store.stopTick()
})

async function startEarning() {
  starting.value = true
  const success = await store.startSession()
  starting.value = false
  if (success) {
    pageVisible.value = document.hasFocus() && document.visibilityState === 'visible'
    pageStatus.value = getPageStatus()
  }
}

async function stopEarning() {
  await store.stopSession()
  await store.fetchStats()
  store.reset()
}
</script>
