<template>
  <div class="space-y-10">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Admin Dashboard</h2>
        <p class="text-sm text-text-muted">System Overview & Real-Time Metrics</p>
      </div>
      <button @click="refresh" class="btn-secondary px-4 py-2 text-xs flex items-center gap-2">
        <RefreshCw :size="14" :stroke-width="2.5" :class="{ 'animate-spin': store.loading }" />
        Refresh
      </button>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-label animate-pulse">Loading Metrics...</p>
    </div>

    <div v-else-if="store.error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <AlertCircle :size="20" :stroke-width="2" />
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error: {{ store.error }}</p>
        <p class="text-xs text-text-muted mt-0.5">Ensure you have admin privileges to access this panel</p>
      </div>
    </div>

    <div v-else-if="!store.stats" class="card-surface p-6 text-center">
      <p class="text-sm font-bold text-text-muted">No Data Available</p>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Total Users -->
        <div class="stat-card group card-hover">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
              <Users :size="18" :stroke-width="2" class="text-accent" />
            </div>
            <span class="text-xs font-bold text-accent/60 tabular-nums">{{ store.stats.totalUsers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Total Users</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums transition-all duration-500 group-hover:scale-105 group-hover:text-accent" style="transform-origin: left;">{{ animatedStats.totalUsers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-1000" :style="{ width: '100%' }"></div>
          </div>
        </div>

        <!-- Total Servers -->
        <div class="stat-card group card-hover">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
              <Server :size="18" :stroke-width="2" class="text-blue-400" />
            </div>
            <span class="text-xs font-bold text-blue-400/60 tabular-nums">{{ store.stats.totalServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Total Servers</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-blue-400 transition-colors">{{ animatedStats.totalServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000" :style="{ width: Math.min(100, (store.stats.totalServers / Math.max(1, store.stats.totalUsers)) * 100) + '%' }"></div>
          </div>
        </div>

        <!-- Active Servers -->
        <div class="stat-card group card-hover">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
              <CheckCircle2 :size="18" :stroke-width="2" class="text-emerald-400" />
            </div>
            <span class="text-xs font-bold text-emerald-400/60 tabular-nums">{{ store.stats.activeServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Active Servers</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-emerald-400 transition-colors">{{ animatedStats.activeServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalServers > 0 ? (store.stats.activeServers / store.stats.totalServers * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <!-- Suspended -->
        <div class="stat-card group card-hover">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-300">
              <AlertTriangle :size="18" :stroke-width="2" class="text-yellow-400" />
            </div>
            <span class="text-xs font-bold text-yellow-400/60 tabular-nums">{{ store.stats.suspendedServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Suspended</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-yellow-400 transition-colors">{{ animatedStats.suspendedServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalServers > 0 ? (store.stats.suspendedServers / store.stats.totalServers * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <!-- Discord Links -->
        <div class="stat-card group card-hover">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
              <MessageSquare :size="18" :stroke-width="2" class="text-indigo-400" />
            </div>
            <span class="text-xs font-bold text-indigo-400/60 tabular-nums">{{ store.stats.discordLinked }}</span>
          </div>
          <p class="text-label text-xs mb-1">Discord Links</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-indigo-400 transition-colors">{{ animatedStats.discordLinked }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalUsers > 0 ? (store.stats.discordLinked / store.stats.totalUsers * 100) + '%' : '0%' }"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card-surface p-6 space-y-6">
          <h3 class="text-label flex items-center gap-2">
            <Zap :size="16" :stroke-width="2" class="text-accent" />
            Quick Actions
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <router-link to="/admin/users" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <Users :size="22" :stroke-width="2" class="text-accent" />
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Users</span>
            </router-link>
            <router-link to="/admin/servers" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <Server :size="22" :stroke-width="2" class="text-blue-400" />
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Servers</span>
            </router-link>
            <router-link to="/admin/settings" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                <Settings :size="22" :stroke-width="2" class="text-purple-400" />
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Settings</span>
            </router-link>
            <a :href="panelUrl" target="_blank" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-green-500/20 transition-all duration-300">
                <Terminal :size="22" :stroke-width="2" class="text-green-400" />
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Panel</span>
            </a>
          </div>
        </div>

        <div class="card-surface p-6 space-y-6">
          <h3 class="text-label flex items-center gap-2">
            <BarChart3 :size="16" :stroke-width="2" class="text-accent" />
            System Info
          </h3>
          <div class="space-y-4">
            <div v-for="(info, i) in systemInfo" :key="i" class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
              <span class="text-sm font-medium text-text-muted flex items-center gap-2">
                <component :is="info.icon" :size="14" :stroke-width="2" class="opacity-60" />
                {{ info.label }}
              </span>
              <span class="text-sm font-bold text-text-primary">{{ info.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useAdminStore } from '../../stores/admin'
import {
  RefreshCw,
  Users,
  Server,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Zap,
  Settings,
  Terminal,
  BarChart3,
  AlertCircle,
  Globe,
  Database,
  Monitor,
  Tag,
} from 'lucide-vue-next'

const store = useAdminStore()

const panelUrl = computed(() => {
  return store.settings?.pterodactyl_panel_url || 'https://console.zyphron.cloud'
})

// animated counter logic
const animatedStats = reactive({
  totalUsers: 0,
  totalServers: 0,
  activeServers: 0,
  suspendedServers: 0,
  discordLinked: 0,
})

let rafId = null

function animateCounter(key, target) {
  const duration = 800
  const start = animatedStats[key] || 0
  const diff = target - start
  if (diff === 0) return
  const startTime = performance.now()
  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
    animatedStats[key] = Math.round(start + diff * eased)
    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    }
  }
  rafId = requestAnimationFrame(step)
}

watch(() => store.stats, (newStats) => {
  if (newStats) {
    animateCounter('totalUsers', newStats.totalUsers || 0)
    animateCounter('totalServers', newStats.totalServers || 0)
    animateCounter('activeServers', newStats.activeServers || 0)
    animateCounter('suspendedServers', newStats.suspendedServers || 0)
    animateCounter('discordLinked', newStats.discordLinked || 0)
  }
}, { immediate: true })

const systemInfo = computed(() => [
  { label: 'Environment', value: 'Production', icon: Globe },
  { label: 'Database', value: 'SQLite', icon: Database },
  { label: 'Panel', value: 'Pterodactyl', icon: Monitor },
  { label: 'Version', value: '1.0.0', icon: Tag },
])

onMounted(() => {
  store.fetchStats()
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

function refresh() {
  store.fetchStats()
}
</script>
