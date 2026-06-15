<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Servers</h2>
        <p class="text-sm text-text-muted">Manage all your deployed compute instances.</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Create Server
      </router-link>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Servers...</p>
    </div>

    <div v-else-if="store.error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error</p>
        <p class="text-xs text-text-muted mt-0.5">{{ store.error }}</p>
      </div>
    </div>

    <div v-else-if="store.servers.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Servers Deployed</h3>
        <p class="text-sm text-text-muted max-w-sm mx-auto">
          You haven't deployed any servers yet. Create your first instance to get started.
        </p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex">
        Deploy New Server
      </router-link>
    </div>

    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-base/50 border-b border-border">
              <th class="px-6 py-4 text-label opacity-40">Name</th>
              <th class="px-6 py-4 text-label opacity-40">Status</th>
              <th class="px-6 py-4 text-label opacity-40">Memory</th>
              <th class="px-6 py-4 text-label opacity-40">CPU</th>
              <th class="px-6 py-4 text-label opacity-40">Disk</th>
              <th class="px-6 py-4 text-label opacity-40">Expires</th>
              <th class="px-6 py-4 text-label opacity-40">Auto-Renew</th>
              <th class="px-6 py-4 text-label opacity-40">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="server in store.servers" :key="server.id" class="hover:bg-white/[0.01] transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{{ server.serverName }}</p>
                    <p class="text-[10px] text-text-muted font-mono opacity-50">{{ String(server.id).substring(0, 8) }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div :class="statusColorClass(server)" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"></div>
                  <span :class="statusTextClass(server)" class="text-[10px] font-bold uppercase tracking-wider">
                    {{ getStatusLabel(server) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.ramMb }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.cpuPercent }} <span class="text-[10px] text-text-muted font-medium">%</span></p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-text-primary tabular-nums">{{ server.diskMb }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <p class="text-xs font-bold text-text-primary tabular-nums">{{ formatDate(server.expiresAt) }}</p>
                  <p v-if="getDaysRemaining(server) !== null" :class="getDaysRemainingClass(server)" class="text-[10px] font-bold">
                    {{ getDaysRemainingLabel(server) }}
                  </p>
                </div>
              </td>
              <td class="px-6 py-4">
                <template v-if="server.expiresAt">
                  <button
                    @click="handleToggleAutoRenew(server.id)"
                    :disabled="togglingAutoRenew === server.id"
                    :class="server.autoRenew ? 'bg-accent/20 text-accent border-accent/30' : 'bg-white/5 text-text-muted border-border'"
                    class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all hover:border-accent/30 disabled:opacity-50"
                  >
                    {{ togglingAutoRenew === server.id ? '...' : (server.autoRenew ? 'ON' : 'OFF') }}
                  </button>
                </template>
                <span v-else class="text-[10px] text-text-muted font-medium">N/A</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <router-link :to="`/servers/${server.id}/renew`" 
                    v-if="shouldShowRenew(server)"
                    class="text-xs font-bold text-accent hover:text-accent/80 transition-colors">
                    Renew
                  </router-link>
                  <router-link :to="`/store/${server.id}`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Manage</router-link>
                  <router-link :to="`/servers/${server.id}/settings`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Settings</router-link>
                  <button @click="handleDelete(server.id)" class="text-xs font-bold text-text-muted hover:text-red-400 transition-colors">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useServersStore } from '../stores/servers'

const store = useServersStore()
const togglingAutoRenew = ref(null)

onMounted(async () => {
  try {
    await store.fetchServers()
  } catch {
    // Error handled in store
  }
})

async function handleToggleAutoRenew(serverId) {
  togglingAutoRenew.value = serverId
  try {
    await store.toggleAutoRenew(serverId)
  } catch {
    // Error handled in store
  } finally {
    togglingAutoRenew.value = null
  }
}

async function handleDelete(id) {
  if (confirm('Terminate instance ' + id + '? This will permanently delete all data.')) {
    try {
      await store.deleteServer(id)
    } catch {
      // Error handled in store
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDaysRemaining(server) {
  if (!server.expiresAt) return null
  const now = new Date()
  const expiry = new Date(server.expiresAt)
  const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function getDaysRemainingLabel(server) {
  const days = getDaysRemaining(server)
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Expires today'
  return `${days}d left`
}

function getDaysRemainingClass(server) {
  const days = getDaysRemaining(server)
  if (days === null) return 'text-text-muted'
  if (days < 0) return 'text-red-400'
  if (days <= 2) return 'text-yellow-500'
  return 'text-text-muted'
}

function shouldShowRenew(server) {
  // Show renew button if expiring within 2 days, expired, or suspended
  const days = getDaysRemaining(server)
  return server.status === 'suspended' || (days !== null && days <= 2)
}

function getStatusLabel(server) {
  if (server.isSuspended) return 'suspended'
  return server.status
}

function statusColorClass(server) {
  const status = getStatusLabel(server)
  return {
    active: 'text-accent bg-accent',
    suspended: 'text-yellow-500 bg-yellow-500',
    expired: 'text-red-500 bg-red-500',
  }[status] || 'text-white/20 bg-white/20'
}

function statusTextClass(server) {
  const status = getStatusLabel(server)
  return {
    active: 'text-accent',
    suspended: 'text-yellow-500',
    expired: 'text-red-400',
  }[status] || 'text-text-muted'
}
</script>
