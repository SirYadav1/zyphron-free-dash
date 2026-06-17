<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">My Servers</h2>
        <p class="text-sm text-text-muted">
          {{ store.servers.length }} server{{ store.servers.length !== 1 ? 's' : '' }} &middot;
          <span class="text-emerald-400">{{ activeCount }} active</span>
          <span v-if="suspendedCount > 0" class="text-red-400"> &middot; {{ suspendedCount }} suspended</span>
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Open Console (first active server) -->
        <a
          v-if="firstActiveServer && firstActiveServer.identifier && pteroUrl"
          :href="`${pteroUrl}/server/${firstActiveServer.identifier}`"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-secondary inline-flex items-center gap-2"
        >
          <ExternalLink :size="16" :stroke-width="2" />
          Open Console
        </a>
        <router-link to="/services" class="btn-primary inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Deploy Server
        </router-link>
      </div>
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

    <!-- Server Cards -->
    <div v-else class="space-y-3">
      <div
        v-for="server in store.servers"
        :key="server.id"
        @click="openSettings(server.id)"
        class="card-surface border-l-4 transition-all hover:border-l-accent hover:bg-surface/80 group cursor-pointer"
        :class="statusBorderColor(server)"
      >
        <div class="p-5">
          <!-- Top Row: Server Name + Status -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                <Server :size="16" :stroke-width="2" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-text-primary truncate">{{ server.serverName }}</p>
                <p class="text-[11px] text-text-muted truncate font-mono">{{ getNodeHost(server) }}</p>
              </div>
            </div>

            <!-- Status Badge + Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                :class="statusBadgeClass(server)"
                class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
              >
                <span :class="statusDotClass(server)" class="w-1.5 h-1.5 rounded-full"></span>
                {{ getStatusLabel(server) }}
              </span>
              <!-- Inline action buttons -->
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  v-if="server.pterodactylServerId && server.identifier && pteroUrl"
                  :href="`${pteroUrl}/server/${server.identifier}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  @click.stop
                  class="p-1.5 rounded-md text-text-muted hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                  title="Open Console"
                >
                  <ExternalLink :size="13" :stroke-width="2" />
                </a>
                <button
                  @click.stop="handleDelete(server.id)"
                  class="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Delete"
                >
                  <Trash2 :size="13" :stroke-width="2" />
                </button>
              </div>
            </div>
          </div>

          <!-- Suspended Reason Banner — Admin Suspend (Contact Support) -->
          <div
            v-if="server.status === 'suspended' && server.suspendReason && server.suspendReason !== 'expired'"
            class="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3"
          >
            <div class="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle :size="16" :stroke-width="2" class="text-red-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-red-400 mb-0.5">Server Suspended by Administrator</p>
              <p class="text-xs text-red-400/70">
                This server has been suspended by an administrator.
                <span v-if="server.suspendReason"> Reason: {{ server.suspendReason }}</span>
              </p>
              <p v-if="server.suspendedAt" class="text-[10px] text-red-400/50 mt-1">{{ formatDate(server.suspendedAt) }}</p>
              <a
                :href="`${pteroUrl || '#'}/submit`"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-md bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-all"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Support Team
              </a>
            </div>
          </div>

          <!-- Suspended Reason Banner — System/Expiry (Renew with Credits) -->
          <div
            v-if="server.status === 'suspended' && (!server.suspendReason || server.suspendReason === 'expired')"
            class="mb-4 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
          >
            <div class="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock :size="16" :stroke-width="2" class="text-amber-400" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-amber-400 mb-0.5">Server Expired</p>
              <p class="text-xs text-amber-400/70">
                Your server subscription has expired. Renew with your credits to restore access.
              </p>
              <p v-if="server.suspendedAt" class="text-[10px] text-amber-400/50 mt-1">{{ formatDate(server.suspendedAt) }}</p>
              <router-link
                :to="`/servers/${server.id}/renew`"
                @click.stop
                class="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all"
              >
                <RefreshCw :size="13" :stroke-width="2" />
                Renew with Credits ({{ server.renewalPrice || 50 }} coins)
              </router-link>
            </div>
          </div>

          <!-- Resource Cards -->
          <div class="grid grid-cols-3 gap-3 mb-4">
            <!-- CPU -->
            <div class="bg-base/50 rounded-lg p-3 border border-border">
              <div class="flex items-center gap-1.5 mb-1.5">
                <Cpu :size="14" class="text-blue-400" />
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">CPU</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.cpuPercent }}%</p>
            </div>

            <!-- RAM -->
            <div class="bg-base/50 rounded-lg p-3 border border-border">
              <div class="flex items-center gap-1.5 mb-1.5">
                <MemoryStick :size="14" class="text-amber-400" />
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">RAM</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatRam(server.ramMb) }}</p>
            </div>

            <!-- Disk -->
            <div class="bg-base/50 rounded-lg p-3 border border-border">
              <div class="flex items-center gap-1.5 mb-1.5">
                <HardDrive :size="14" class="text-purple-400" />
                <span class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Disk</span>
              </div>
              <p class="text-sm font-bold text-text-primary tabular-nums">{{ formatDisk(server.diskMb) }}</p>
            </div>
          </div>

          <!-- Dates Row -->
          <div class="flex items-center gap-4 text-[11px] text-text-muted">
            <div class="flex items-center gap-1.5">
              <Calendar :size="12" />
              <span>Created {{ formatDate(server.createdAt) }}</span>
            </div>
            <div v-if="server.expiresAt" class="flex items-center gap-1.5">
              <Clock :size="12" />
              <span :class="isExpiringSoon(server.expiresAt) ? 'text-yellow-400' : ''">
                Expires {{ formatDate(server.expiresAt) }}
                <span v-if="isExpiringSoon(server.expiresAt) && !isExpired(server.expiresAt)" class="text-yellow-400 font-bold">(Soon)</span>
                <span v-if="isExpired(server.expiresAt)" class="text-red-400 font-bold">(Expired)</span>
              </span>
            </div>
            <div v-if="server.autoRenew" class="flex items-center gap-1.5 text-accent">
              <RefreshCw :size="12" />
              <span>Auto-Renew</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServersStore } from '../stores/servers'
import client from '../api/client'
import {
  Server,
  Trash2,
  AlertTriangle,
  MemoryStick,
  HardDrive,
  Calendar,
  Clock,
  RefreshCw,
  Cpu,
  ExternalLink,
} from 'lucide-vue-next'

const store = useServersStore()
const router = useRouter()
const pteroUrl = ref('')

const activeCount = computed(() => store.servers.filter(s => s.status === 'active').length)
const suspendedCount = computed(() => store.servers.filter(s => s.status === 'suspended').length)
const firstActiveServer = computed(() => store.servers.find(s => s.status === 'active' && s.identifier))

onMounted(async () => {
  try {
    await store.fetchServers()
  } catch {}
  // load Pterodactyl panel URL from settings
  try {
    const { data } = await client.get('/servers/stats')
    if (data.panelUrl) pteroUrl.value = data.panelUrl
  } catch {
    // fallback: try admin settings endpoint
    try {
      const { data } = await client.get('/admin/settings')
      if (data.pterodactyl_panel_url) pteroUrl.value = data.pterodactyl_panel_url
    } catch {}
  }
})

function openSettings(serverId) {
  router.push(`/servers/${serverId}/settings`)
}

function getNodeHost(server) {
  if (server.nodeHost) return server.nodeHost
  if (server.pterodactylServerId) return `Server #${server.pterodactylServerId}`
  return 'Local'
}

function formatRam(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb + ' MB'
}

function statusBorderColor(server) {
  if (server.status === 'suspended') return 'border-red-500'
  if (server.status === 'active') return 'border-emerald-500'
  if (server.status === 'expired') return 'border-yellow-500'
  return 'border-gray-500'
}

function statusDotClass(server) {
  if (server.status === 'suspended') return 'bg-red-500'
  if (server.status === 'active') return 'bg-emerald-500'
  if (server.status === 'expired') return 'bg-yellow-500'
  return 'bg-gray-500'
}

function statusBadgeClass(server) {
  if (server.status === 'suspended') return 'bg-red-500/15 text-red-400'
  if (server.status === 'active') return 'bg-emerald-500/15 text-emerald-400'
  if (server.status === 'expired') return 'bg-yellow-500/15 text-yellow-400'
  return 'bg-gray-500/15 text-gray-400'
}

function getStatusLabel(server) {
  if (server.status === 'suspended') return 'Suspended'
  if (server.status === 'active') return 'Active'
  if (server.status === 'expired') return 'Expired'
  return server.status || 'Unknown'
}

function isExpiringSoon(dateStr) {
  if (!dateStr) return false
  const expiry = new Date(dateStr)
  const now = new Date()
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return expiry.getTime() - now.getTime() < threeDays && expiry.getTime() > now.getTime()
}

function isExpired(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr).getTime() < Date.now()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) return
  try {
    await store.deleteServer(id)
  } catch {}
}
</script>
