<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Upgrade Server</h2>
      <p class="text-sm text-text-muted">Select a server to enhance its resources.</p>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Servers...</p>
    </div>

    <div v-else-if="servers.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40 text-3xl">
        🖥️
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Servers Available</h3>
        <p class="text-sm text-text-muted max-w-xs mx-auto">
          Initialize your first server module to access the store.
        </p>
      </div>
      <router-link to="/servers/create" class="btn-primary inline-flex">
        Create Server
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link
        v-for="server in servers"
        :key="server.id"
        :to="`/store/${server.id}`"
        class="card-surface p-6 flex flex-col hover:border-accent/30 transition-all group"
      >
        <div class="flex items-start justify-between mb-6">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary tracking-tight group-hover:text-accent transition-colors">{{ server.serverName }}</h3>
            <p class="text-xs text-text-muted">Expires: {{ formatDate(server.expiresAt) }}</p>
          </div>
          <span :class="statusClass(server.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {{ server.status }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2 mb-6">
          <div class="bg-base/50 rounded-lg py-3 text-center border border-border">
            <p class="text-label mb-1">RAM</p>
            <p class="text-sm font-bold text-blue-400">{{ server.ramMb }}MB</p>
          </div>
          <div class="bg-base/50 rounded-lg py-3 text-center border border-border">
            <p class="text-label mb-1">CPU</p>
            <p class="text-sm font-bold text-amber-400">{{ server.cpuPercent }}%</p>
          </div>
          <div class="bg-base/50 rounded-lg py-3 text-center border border-border">
            <p class="text-label mb-1">DISK</p>
            <p class="text-sm font-bold text-purple-400">{{ server.diskMb }}MB</p>
          </div>
        </div>

        <div class="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <span class="text-xs font-medium text-text-muted">{{ server.template?.name || 'Generic' }}</span>
          <span class="text-xs font-bold text-accent group-hover:translate-x-1 transition-transform">Manage →</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useServersStore } from '../stores/servers'

const serversStore = useServersStore()

const loading = computed(() => serversStore.loading)
const servers = computed(() => serversStore.servers)

onMounted(async () => {
  try {
    await serversStore.fetchServers()
  } catch {
    // error handled in store
  }
})

function statusClass(status) {
  return {
    active: 'text-accent bg-accent/10',
    suspended: 'text-yellow-500 bg-yellow-500/10',
    expired: 'text-red-500 bg-red-500/10',
  }[status] || 'text-text-muted bg-white/5'
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
