<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Dashboard</h2>
        <p class="text-sm text-text-muted">Welcome back, {{ authStore.user?.username || 'User' }}.</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Deploy Server
      </router-link>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-surface p-5 space-y-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/>
            </svg>
          </div>
          <div>
            <p class="text-label">Servers</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ serverStats.active || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-label">Credits</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ authStore.user?.coins || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <p class="text-label">Server Slots</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ serverStats.active || 0 }} / {{ authStore.user?.serverLimit || 1 }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p class="text-label">Uptime</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">99.99<span class="text-sm text-text-muted">%</span></p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- MOTD Card -->
      <div class="card-surface p-6 lg:col-span-2">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Message of the Day</h3>
        </div>
        <p class="text-sm text-text-muted leading-relaxed">Welcome to Zyphron. Configure this message in Settings.</p>
      </div>

      <!-- Useful Links -->
      <div class="card-surface p-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Useful Links</h3>
        </div>
        <div class="space-y-2">
          <a :href="serverStats.panelUrl || 'https://console.zyphron.cloud'" target="_blank" rel="noopener" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary">
            <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent text-xs">P</span>
            Pterodactyl Panel
          </a>
          <a href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary">
            <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent text-xs">M</span>
            phpMyAdmin
          </a>
          <a href="https://discord.gg/zyphron" target="_blank" rel="noopener" class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary">
            <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent text-xs">D</span>
            Discord
          </a>
        </div>
      </div>
    </div>

    <!-- Servers List -->
    <div v-if="!store.loading && store.servers.length > 0" class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-widest opacity-50">Your Servers</h3>
        <router-link to="/servers" class="text-xs font-bold text-accent hover:underline">View All</router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="server in store.servers.slice(0, 4)" :key="server.id" 
          class="card-surface p-5 group cursor-default">
          
          <div class="flex items-start justify-between mb-6">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-text-primary group-hover:text-accent transition-colors">{{ server.serverName }}</h4>
                <a v-if="server.identifier" :href="`${store.stats.panelUrl || 'https://console.zyphron.cloud'}/server/${server.identifier}`" target="_blank" class="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                </a>
              </div>
            </div>
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-base border border-border">
              <div :class="statusColorClass(server.status)" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"></div>
              <span class="text-[10px] font-bold uppercase tracking-wider" :class="statusTextClass(server.status)">{{ server.status }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="space-y-1">
              <p class="text-label opacity-40">CPU</p>
              <p class="text-sm font-bold text-text-primary">{{ server.cpuPercent || 0 }}%</p>
            </div>
            <div class="space-y-1 border-x border-border px-4">
              <p class="text-label opacity-40">RAM</p>
              <p class="text-sm font-bold text-text-primary">{{ server.ramMb || 0 }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
            </div>
            <div class="space-y-1 pl-4">
              <p class="text-label opacity-40">Disk</p>
              <p class="text-sm font-bold text-text-primary">{{ server.diskMb || 0 }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
            </div>
          </div>

          <div class="pt-4 border-t border-border flex items-center justify-between">
            <span class="text-[11px] font-medium text-text-muted">{{ formatDate(server.createdAt) }}</span>
            <div class="flex items-center gap-4">
              <router-link :to="`/store/${server.id}`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Upgrade</router-link>
              <router-link :to="`/servers/${server.id}/settings`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Settings</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!store.loading && store.servers.length === 0" class="card-surface py-16 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Servers Yet</h3>
        <p class="text-sm text-text-muted max-w-sm mx-auto">You haven't deployed any servers yet. Create your first server to get started.</p>
      </div>
      <router-link to="/servers/create" class="btn-primary inline-flex">Deploy Your First Server</router-link>
    </div>

    <!-- Partner Program & Activity Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Partner Program -->
      <div class="card-surface p-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Partner Program</h3>
        </div>
        <p class="text-xs text-text-muted mb-3">Refer friends and earn commission on their purchases.</p>
        <div class="bg-base/50 rounded-lg p-3 border border-border">
          <p class="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Referral System</p>
          <p class="text-sm text-text-muted">Coming soon — referral links will be generated here.</p>
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-text-muted">
          <span>Referred: <strong class="text-text-primary">0</strong></span>
          <span>Commission: <strong class="text-text-primary">10%</strong></span>
        </div>
      </div>

      <!-- Activity Logs -->
      <div class="card-surface p-6">
        <div class="flex items-center gap-2 mb-4">
          <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 text-xs">
            <div class="w-1.5 h-1.5 rounded-full bg-accent/50"></div>
            <span class="text-text-muted">No recent activity</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useServersStore } from '../stores/servers'
import { useAuthStore } from '../stores/auth'

const store = useServersStore()
const authStore = useAuthStore()

const serverStats = computed(() => store.stats)

onMounted(async () => {
  try {
    await Promise.all([store.fetchServers(), store.fetchStats()])
  } catch {
    // Error handled in store
  }
})

function statusColorClass(status) {
  return {
    active: 'text-accent bg-accent',
    suspended: 'text-yellow-500 bg-yellow-500',
    expired: 'text-red-500 bg-red-500',
  }[status] || 'text-white/20 bg-white/20'
}

function statusTextClass(status) {
  return {
    active: 'text-accent',
    suspended: 'text-yellow-500',
    expired: 'text-red-400',
  }[status] || 'text-text-muted'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
