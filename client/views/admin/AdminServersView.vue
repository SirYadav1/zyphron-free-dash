<template>
  <div class="space-y-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Servers</h2>
        <p class="text-sm text-text-muted">{{ filteredServers.length }} deployed instance{{ filteredServers.length !== 1 ? 's' : '' }}</p>
      </div>
      <div class="flex items-center gap-3">
        <input v-model="searchQuery" type="text" placeholder="Search servers..." class="input-field w-64" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="loading-spinner"></div>
    </div>

    <!-- Server Cards (Pterodactyl Style) -->
    <div v-else-if="filteredServers.length > 0" class="space-y-3">
      <div
        v-for="server in filteredServers"
        :key="server.id"
        class="card-surface border-l-4 transition-all hover:border-l-accent group"
        :class="statusBorderColor(server)"
      >
        <div class="p-5">
          <!-- Main Row -->
          <div class="flex items-center gap-5">
            <!-- Status Indicator -->
            <div class="flex-shrink-0">
              <div :class="statusDotClass(server)" class="w-3 h-3 rounded-full"></div>
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
            <div class="hidden md:flex items-center gap-6 flex-shrink-0">
              <!-- CPU -->
              <div class="text-center min-w-[70px]">
                <div class="flex items-center gap-1.5 justify-center mb-1">
                  <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
                  </svg>
                  <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">CPU</span>
                </div>
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.cpuPercent }}%</p>
              </div>

              <!-- RAM -->
              <div class="text-center min-w-[80px]">
                <div class="flex items-center gap-1.5 justify-center mb-1">
                  <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/>
                  </svg>
                  <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">RAM</span>
                </div>
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatRam(server.ramMb) }}</p>
              </div>

              <!-- Disk -->
              <div class="text-center min-w-[80px]">
                <div class="flex items-center gap-1.5 justify-center mb-1">
                  <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                  <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Disk</span>
                </div>
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatDisk(server.diskMb) }}</p>
              </div>
            </div>

            <!-- Status + Actions -->
            <div class="flex items-center gap-3 flex-shrink-0">
              <span :class="statusBadgeClass(server)" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block">
                {{ getStatusLabel(server) }}
              </span>
              <div class="flex items-center gap-1">
                <a v-if="server.pterodactylServerId && pteroUrl" :href="`${pteroUrl}/admin/servers/view/${server.pterodactylServerId}`" target="_blank"
                  class="p-2 rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Panel">
                  <ExternalLink :size="16" :stroke-width="2" />
                </a>
                <button @click="handleToggleSuspend(server)"
                  class="p-2 rounded-lg transition-all" :class="server.status === 'active' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-accent hover:bg-accent/10'"
                  :title="server.status === 'active' ? 'Suspend' : 'Unsuspend'">
                  <Pause v-if="server.status === 'active'" :size="16" :stroke-width="2" />
                  <Play v-else :size="16" :stroke-width="2" />
                </button>
                <button @click="handleDelete(server)" class="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                  <Trash2 :size="16" :stroke-width="2" />
                </button>
              </div>
            </div>
          </div>

          <!-- Extra Details Row (Admin Only) -->
          <div class="mt-4 pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p class="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Owner</p>
              <p class="text-text-primary font-bold">{{ server.user?.username || '—' }}</p>
              <p class="text-text-muted text-[11px]">Last login: {{ formatDateTime(server.user?.last_active) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Created</p>
              <p class="text-text-primary font-bold">{{ formatDate(server.createdAt) }}</p>
              <p class="text-text-muted text-[11px]">{{ formatTimeAgo(server.createdAt) }}</p>
            </div>
            <div>
              <p class="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Expires</p>
              <p class="text-text-primary font-bold">{{ formatDate(server.expiresAt) }}</p>
              <p v-if="getDaysRemaining(server) !== null" :class="getDaysRemainingClass(server)" class="text-[11px] font-bold">
                {{ getDaysRemainingLabel(server) }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Last Active</p>
              <p class="text-text-primary font-bold">{{ formatDateTime(server.lastActive) || 'Never' }}</p>
              <p class="text-text-muted text-[11px]">{{ formatTimeAgo(server.lastActive) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="card-surface py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Servers Found</p>
      <p class="text-sm text-text-muted/60">{{ searchQuery ? 'No servers match your search.' : 'No servers deployed yet.' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'
import { Server, ExternalLink, Pause, Play, Trash2 } from 'lucide-vue-next'

const store = useAdminStore()
const pteroUrl = ref('')
const searchQuery = ref('')

const filteredServers = computed(() => {
  if (!searchQuery.value) return store.servers
  const q = searchQuery.value.toLowerCase()
  return store.servers.filter(s =>
    s.serverName?.toLowerCase().includes(q) ||
    s.user?.username?.toLowerCase().includes(q) ||
    String(s.id).includes(q)
  )
})

onMounted(async () => {
  await store.fetchServers()
  try {
    const { data } = await client.get('/admin/settings')
    pteroUrl.value = data.pterodactyl_panel_url || ''
  } catch {}
})

function getNodeHost(server) {
  if (server.nodeHost) return server.nodeHost
  if (server.pterodactylServerId) return `Server #${server.pterodactylServerId}`
  return 'Local'
}

function formatRam(mb) {
  if (!mb) return '0 MB'
  return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : mb + ' MB'
}

function formatDisk(mb) {
  if (!mb) return '0 MB'
  return mb >= 1024 ? (mb / 1024).toFixed(1) + ' GB' : mb + ' MB'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

function formatDateTime(d) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTimeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getDaysRemaining(server) {
  if (!server.expiresAt) return null
  const diff = new Date(server.expiresAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

function getDaysRemainingLabel(server) {
  const days = getDaysRemaining(server)
  if (days === null) return ''
  if (days === 0) return 'Expires today!'
  return `${days} day${days !== 1 ? 's' : ''} left`
}

function getDaysRemainingClass(server) {
  const days = getDaysRemaining(server)
  if (days === null) return ''
  if (days <= 3) return 'text-red-400'
  if (days <= 7) return 'text-yellow-400'
  return 'text-emerald-400'
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

async function handleToggleSuspend(server) {
  try {
    if (server.status === 'active') {
      await store.suspendServer(server.id)
    } else {
      await store.unsuspendServer(server.id)
    }
  } catch {}
}

async function handleDelete(server) {
  if (!confirm(`Delete server "${server.serverName}"?`)) return
  try {
    await client.post(`/admin/servers/${server.id}/delete`)
    await store.fetchServers()
  } catch {}
}
</script>
