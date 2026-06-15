<template>
  <div class="space-y-10">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Admin Dashboard</h2>
        <p class="text-sm text-text-muted">System Overview & Real-Time Metrics</p>
      </div>
      <button @click="refresh" class="btn-secondary px-4 py-2 text-xs flex items-center gap-2">
        <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': store.loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.15)]"></div>
      <p class="text-label animate-pulse">Loading Metrics...</p>
    </div>

    <div v-else-if="store.error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
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
        <div class="stat-card group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
              <svg class="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-accent/60 tabular-nums">{{ store.stats.totalUsers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Total Users</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums transition-all duration-500 group-hover:scale-105 group-hover:text-accent" style="transform-origin: left;">{{ store.stats.totalUsers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-1000" :style="{ width: '100%' }"></div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <span class="text-xs font-bold text-blue-400/60 tabular-nums">{{ store.stats.totalServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Total Servers</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-blue-400 transition-colors">{{ store.stats.totalServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-1000" :style="{ width: Math.min(100, (store.stats.totalServers / Math.max(1, store.stats.totalUsers)) * 100) + '%' }"></div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-emerald-400/60 tabular-nums">{{ store.stats.activeServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Active Servers</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-emerald-400 transition-colors">{{ store.stats.activeServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalServers > 0 ? (store.stats.activeServers / store.stats.totalServers * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-yellow-500/20 transition-all duration-300">
              <svg class="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-yellow-400/60 tabular-nums">{{ store.stats.suspendedServers }}</span>
          </div>
          <p class="text-label text-xs mb-1">Suspended</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-yellow-400 transition-colors">{{ store.stats.suspendedServers }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalServers > 0 ? (store.stats.suspendedServers / store.stats.totalServers * 100) + '%' : '0%' }"></div>
          </div>
        </div>

        <div class="stat-card group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
              <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span class="text-xs font-bold text-indigo-400/60 tabular-nums">{{ store.stats.discordLinked }}</span>
          </div>
          <p class="text-label text-xs mb-1">Discord Links</p>
          <p class="text-3xl font-bold text-text-primary tabular-nums group-hover:text-indigo-400 transition-colors">{{ store.stats.discordLinked }}</p>
          <div class="mt-3 h-1.5 bg-base rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000" :style="{ width: store.stats.totalUsers > 0 ? (store.stats.discordLinked / store.stats.totalUsers * 100) + '%' : '0%' }"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card-surface p-6 space-y-6">
          <h3 class="text-label flex items-center gap-2">
            <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div class="grid grid-cols-3 gap-4">
            <router-link to="/admin/users" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                </svg>
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Users</span>
            </router-link>
            <router-link to="/admin/servers" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                </svg>
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Servers</span>
            </router-link>
            <router-link to="/admin/settings" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all duration-300">
                <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Settings</span>
            </router-link>
            <a :href="panelUrl" target="_blank" class="quick-action-btn group">
              <div class="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-green-500/20 transition-all duration-300">
                <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span class="text-xs font-bold text-text-muted group-hover:text-text-primary transition-colors">Panel</span>
            </a>
          </div>
        </div>

        <div class="card-surface p-6 space-y-6">
          <h3 class="text-label flex items-center gap-2">
            <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            System Info
          </h3>
          <div class="space-y-4">
            <div v-for="(info, i) in systemInfo" :key="i" class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
              <span class="text-sm font-medium text-text-muted flex items-center gap-2">
                <span v-html="info.icon" class="opacity-60"></span>
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
import { computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'

const store = useAdminStore()

const panelUrl = computed(() => {
  return store.settings?.pterodactyl_panel_url || 'https://console.zyphron.cloud'
})

const systemInfo = computed(() => [
  { label: 'Environment', value: 'Production', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>' },
  { label: 'Database', value: 'SQLite', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/></svg>' },
  { label: 'Panel', value: 'Pterodactyl', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
  { label: 'Version', value: '1.0.0', icon: '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>' },
])

onMounted(() => {
  store.fetchStats()
})

function refresh() {
  store.fetchStats()
}
</script>
