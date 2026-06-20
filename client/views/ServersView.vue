<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Servers</h2>
        <p class="text-sm text-text-muted">{{ store.servers.length }} active instance{{ store.servers.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Create Server
      </router-link>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Servers...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <AlertTriangle :size="20" :stroke-width="2" />
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error</p>
        <p class="text-xs text-text-muted mt-0.5">{{ store.error }}</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="store.servers.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40">
        <Server :size="32" :stroke-width="1.5" />
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Servers Deployed</h3>
        <p class="text-sm text-text-muted max-w-sm mx-auto">You haven't deployed any servers yet. Create your first instance to get started.</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex">Deploy New Server</router-link>
    </div>

    <!-- Server Cards (Pterodactyl Style) -->
    <div v-else class="space-y-3">
      <div
        v-for="server in store.servers"
        :key="server.id"
        class="card-surface border-l-4 transition-all hover:border-l-accent group cursor-pointer"
        :class="statusBorderColor(server)"
      >
        <div class="p-5 flex items-center gap-5">
          <!-- Status Indicator -->
          <div class="flex-shrink-0">
            <div
              :class="statusDotClass(server)"
              class="w-3 h-3 rounded-full"
            ></div>
          </div>

          <!-- Server Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                <Server :size="16" :stroke-width="2" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-text-primary truncate">{{ server.serverName }}</p>
                <p class="text-[11px] text-text-muted truncate font-mono">{{ getNodeHost(server) }}</p>
              </div>
            </div>
          </div>

          <!-- Resources -->
          <div class="hidden sm:flex items-center gap-6 flex-shrink-0">
            <!-- CPU -->
            <div class="text-center min-w-[70px]">
              <div class="flex items-center gap-1.5 justify-center mb-1">
                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
                </svg>
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">CPU</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.cpuPercent }}%</p>
            </div>

            <!-- RAM -->
            <div class="text-center min-w-[80px]">
              <div class="flex items-center gap-1.5 justify-center mb-1">
                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/>
                </svg>
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">RAM</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatRam(server.ramMb) }}</p>
            </div>

            <!-- Disk -->
            <div class="text-center min-w-[80px]">
              <div class="flex items-center gap-1.5 justify-center mb-1">
                <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Disk</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatDisk(server.diskMb) }}</p>
            </div>
          </div>

          <!-- Status + Actions -->
          <div class="flex items-center gap-3 flex-shrink-0">
            <span
              :class="statusBadgeClass(server)"
              class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block"
            >{{ getStatusLabel(server) }}</span>

            <div class="flex items-center gap-2">
              <router-link
                :to="`/servers/${server.id}/settings`"
                class="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
                title="Settings"
              >
                <Settings :size="16" :stroke-width="2" />
              </router-link>
              <button
                @click.stop="handleDelete(server.id)"
                class="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                title="Delete"
              >
                <Trash2 :size="16" :stroke-width="2" />
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Resources (shown on small screens) -->
        <div class="sm:hidden px-5 pb-4 flex items-center gap-4 text-xs">
          <span class="text-blue-400 font-bold">CPU: {{ server.cpuPercent }}%</span>
          <span class="text-amber-400 font-bold">RAM: {{ formatRam(server.ramMb) }}</span>
          <span class="text-purple-400 font-bold">Disk: {{ formatDisk(server.diskMb) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useServersStore } from '../stores/servers'
import { Server, Settings, Trash2, AlertTriangle } from 'lucide-vue-next'

const store = useServersStore()

onMounted(async () => {
  try {
    await store.fetchServers()
  } catch {}
})

function getNodeHost(server) {
  if (server.nodeHost) return server.nodeHost
  if (server.pterodactylServerId) return `Server #${server.pterodactylServerId}`
  return 'Local'
}

function formatRam(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

function statusBorderColor(server) {
  if (server.status === 'suspended') return 'border-red-500'
  if (server.status === 'active') return 'border-emerald-500'
  return 'border-gray-500'
}

function statusDotClass(server) {
  if (server.status === 'suspended') return 'bg-red-500'
  if (server.status === 'active') return 'bg-emerald-500'
  return 'bg-gray-500'
}

function statusBadgeClass(server) {
  if (server.status === 'suspended') return 'bg-red-500/15 text-red-400'
  if (server.status === 'active') return 'bg-emerald-500/15 text-emerald-400'
  return 'bg-gray-500/15 text-gray-400'
}

function getStatusLabel(server) {
  if (server.status === 'suspended') return 'Suspended'
  if (server.status === 'active') return 'Running'
  return 'Starting'
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this server?')) return
  try {
    await store.deleteServer(id)
  } catch {}
}
</script>
