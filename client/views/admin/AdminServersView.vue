<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Manage Servers</h2>
        <p class="text-sm text-text-muted mt-1">{{ filteredServers.length }} deployed instance{{ filteredServers.length !== 1 ? 's' : '' }}</p>
      </div>
      <div class="flex items-center gap-3">
        <input v-model="searchQuery" type="text" placeholder="Search servers..." class="input-field w-64" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Server Cards (Pterodactyl Style) -->
    <div v-else-if="filteredServers.length > 0" class="space-y-3">
      <div
        v-for="server in filteredServers"
        :key="server.id"
        class="bg-base-secondary border border-border rounded-xl border-l-4 transition-all hover:border-l-accent group overflow-hidden"
        :class="statusBorderColor(server)"
      >
        <div class="p-5">
          <!-- Main Row -->
          <div class="flex items-center gap-4">
            <!-- Status Dot -->
            <div :class="statusDotClass(server)" class="w-3 h-3 rounded-full flex-shrink-0"></div>

            <!-- Server Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                  <Server :size="14" :stroke-width="2" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-text-primary truncate">{{ server.serverName }}</p>
                  <p class="text-[10px] text-text-muted font-mono">{{ getNodeHost(server) }}</p>
                </div>
              </div>
            </div>

            <!-- Resources -->
            <div class="hidden md:flex items-center gap-5 flex-shrink-0">
              <div class="text-center">
                <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">CPU</p>
                <p class="text-xs font-bold text-text-primary">{{ server.cpuPercent }}%</p>
              </div>
              <div class="text-center">
                <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">RAM</p>
                <p class="text-xs font-bold text-text-primary">{{ formatRam(server.ramMb) }}</p>
              </div>
              <div class="text-center">
                <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Disk</p>
                <p class="text-xs font-bold text-text-primary">{{ formatDisk(server.diskMb) }}</p>
              </div>
            </div>

            <!-- Status + Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span :class="statusBadgeClass(server)" class="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider hidden sm:inline-block">
                {{ getStatusLabel(server) }}
              </span>
              <div class="flex items-center gap-1">
                <a v-if="server.pterodactylServerId && pteroUrl" :href="`${pteroUrl}/admin/servers/view/${server.pterodactylServerId}`" target="_blank"
                  class="p-1.5 rounded-lg text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all" title="Panel">
                  <ExternalLink :size="14" :stroke-width="2" />
                </a>
                <!-- Suspend/Unsuspend -->
                <button v-if="server.status === 'active'" @click="handleSuspend(server)"
                  class="px-2.5 py-1 text-[9px] font-bold text-yellow-400 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10 transition-colors" title="Suspend">
                  Suspend
                </button>
                <button v-else @click="handleUnsuspend(server)"
                  class="px-2.5 py-1 text-[9px] font-bold text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors" title="Unsuspend">
                  Unban
                </button>
                <button @click="handleDelete(server)"
                  class="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all" title="Delete">
                  <Trash2 :size="14" :stroke-width="2" />
                </button>
              </div>
            </div>
          </div>

          <!-- Admin Details Row -->
          <div class="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Owner</p>
              <p class="text-text-primary font-bold">{{ server.user?.username || '—' }}</p>
              <p class="text-text-muted">Login: {{ formatDateTime(server.user?.last_active) }}</p>
            </div>
            <div>
              <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Created</p>
              <p class="text-text-primary font-bold">{{ formatDate(server.createdAt) }}</p>
              <p class="text-text-muted">{{ formatTimeAgo(server.createdAt) }}</p>
            </div>
            <div>
              <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Expires</p>
              <p class="text-text-primary font-bold">{{ formatDate(server.expiresAt) }}</p>
              <p v-if="getDaysRemaining(server) !== null" :class="getDaysRemainingClass(server)" class="font-bold">
                {{ getDaysRemainingLabel(server) }}
              </p>
            </div>
            <div>
              <p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Last Active</p>
              <p class="text-text-primary font-bold">{{ formatDateTime(server.lastActive) || 'Never' }}</p>
              <p class="text-text-muted">{{ formatTimeAgo(server.lastActive) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-base-secondary border border-border rounded-xl py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Servers Found</p>
      <p class="text-sm text-text-muted/60">{{ searchQuery ? 'No servers match your search.' : 'No servers deployed yet.' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'
import { Server, ExternalLink, Trash2 } from 'lucide-vue-next'

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
  return `${Math.floor(hours / 24)}d ago`
}

function getDaysRemaining(server) {
  if (!server.expiresAt) return null
  return Math.max(0, Math.ceil((new Date(server.expiresAt).getTime() - Date.now()) / 86400000))
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

async function handleSuspend(server) {
  if (!confirm(`Suspend "${server.serverName}"?`)) return
  try { await store.suspendServer(server.id) } catch {}
}

async function handleUnsuspend(server) {
  if (!confirm(`Unban "${server.serverName}"?`)) return
  try { await store.unsuspendServer(server.id) } catch {}
}

async function handleDelete(server) {
  if (!confirm(`Delete "${server.serverName}"? This is permanent.`)) return
  try { await client.post(`/admin/servers/${server.id}/delete`); await store.fetchServers() } catch {}
}
</script>
