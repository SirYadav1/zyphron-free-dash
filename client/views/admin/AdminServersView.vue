<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Servers</h2>
        <p class="text-sm text-text-muted">{{ store.servers.length }} deployed instances</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search servers..."
          class="input-field w-64"
        />
      </div>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Owner</th>
              <th class="px-5 py-3 text-label">Resources</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label">Created</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="server in filteredServers"
              :key="server.id"
              class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-3 text-text-muted text-xs">{{ server.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ server.serverName }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ server.user?.username || '—' }}</td>
              <td class="px-5 py-3">
                <div class="flex gap-3 text-xs font-medium">
                  <span class="text-blue-400">{{ server.ramMb }}MB</span>
                  <span class="text-amber-400">{{ server.cpuPercent }}%</span>
                  <span class="text-purple-400">{{ server.diskMb }}MB</span>
                </div>
              </td>
              <td class="px-5 py-3">
                <span :class="statusClass(server.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {{ server.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(server.createdAt) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <a
                    v-if="server.pterodactylServerId && pteroUrl"
                    :href="`${pteroUrl}/admin/servers/view/${server.pterodactylServerId}`"
                    target="_blank"
                    class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Panel
                  </a>
                  <button
                    @click="handleToggleSuspend(server)"
                    class="text-xs font-bold transition-colors"
                    :class="server.status === 'active' ? 'text-yellow-500 hover:text-yellow-400' : 'text-accent hover:text-white'"
                  >
                    {{ server.status === 'active' ? 'Suspend' : 'Unsuspend' }}
                  </button>
                  <button
                    @click="handleDelete(server)"
                    class="text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredServers.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Servers Found</p>
        <p class="text-sm text-text-muted/60">No servers match your search criteria.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'

const store = useAdminStore()
const pteroUrl = ref('')
const searchQuery = ref('')

const filteredServers = computed(() => {
  if (!searchQuery.value) return store.servers
  const q = searchQuery.value.toLowerCase()
  return store.servers.filter(s =>
    s.serverName.toLowerCase().includes(q) ||
    s.user?.username?.toLowerCase().includes(q) ||
    String(s.id).includes(q)
  )
})

onMounted(async () => {
  await store.fetchServers()
  try {
    const { data } = await client.get('/admin/settings')
    pteroUrl.value = data.pterodactyl_panel_url || ''
  } catch { /* ignore */ }
})

function statusClass(status) {
  return {
    active: 'text-accent bg-accent/10',
    suspended: 'text-yellow-500 bg-yellow-500/10',
    expired: 'text-red-500 bg-red-500/10',
  }[status] || 'text-text-muted bg-white/5'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

async function handleToggleSuspend(server) {
  try {
    if (server.status === 'active') {
      await store.suspendServer(server.id)
    } else {
      await store.unsuspendServer(server.id)
    }
  } catch { /* ignore */ }
}

async function handleDelete(server) {
  if (!confirm(`Delete server "${server.serverName}"?`)) return
  try {
    await client.post(`/admin/servers/${server.id}/delete`)
    await store.fetchServers()
  } catch { /* ignore */ }
}
</script>
