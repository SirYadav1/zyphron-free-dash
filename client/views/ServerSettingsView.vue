<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Server...</p>
    </div>

    <div v-else-if="error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error</p>
        <p class="text-xs text-text-muted mt-0.5">{{ error }}</p>
      </div>
    </div>

    <template v-else-if="server">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h2 class="text-2xl font-bold text-text-primary tracking-tight">Server Settings</h2>
          <p class="text-sm text-text-muted">Configuring <span class="text-text-primary font-bold">{{ server.serverName }}</span></p>
        </div>
        <div class="flex items-center gap-3">
          <a
            v-if="server.identifier && pteroUrl"
            :href="`${pteroUrl}/server/${server.identifier}`"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-secondary inline-flex items-center gap-2 text-sm"
          >
            <ExternalLink :size="14" :stroke-width="2" />
            Open Console
          </a>
          <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-base border border-border">
            <div :class="statusColor(server.status)" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"></div>
            <span :class="statusText(server.status)" class="text-[10px] font-bold uppercase tracking-wider">{{ server.status }}</span>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMsg" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold">
        {{ successMsg }}
      </div>
      <div v-if="updateError" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold">
        {{ updateError }}
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 border-b border-border overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id ? (tab.id === 'danger' ? 'border-red-500 text-red-400' : 'border-accent text-text-primary') : 'border-transparent text-text-muted hover:text-text-primary'"
          class="px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- General Tab -->
      <div v-if="activeTab === 'general'" class="space-y-8">
        <div class="card-surface p-8 space-y-6">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary">General Information</h3>
            <p class="text-sm text-text-muted">Basic details about your server instance.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-label">Server Name</label>
              <input v-model="form.name" type="text" class="input-field" maxlength="100" />
            </div>
            <div class="space-y-1.5">
              <label class="text-label">Server ID</label>
              <input :value="server.id" type="text" class="input-field opacity-50" disabled />
            </div>
            <div class="space-y-1.5">
              <label class="text-label">Created At</label>
              <input :value="formatDate(server.createdAt)" type="text" class="input-field opacity-50" disabled />
            </div>
            <div class="space-y-1.5">
              <label class="text-label">Expires At</label>
              <input :value="formatDate(server.expiresAt)" type="text" class="input-field opacity-50" disabled />
            </div>
          </div>

          <div class="pt-4 border-t border-border flex justify-end">
            <button @click="handleUpdate" :disabled="saving" class="btn-primary px-8">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>

        <div class="card-surface p-8 space-y-6">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary">Resource Allocation</h3>
            <p class="text-sm text-text-muted">Current resource limits for this server.</p>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
              <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Memory</p>
              <p class="text-base font-bold text-text-primary tabular-nums">{{ server.ramMb }} MB</p>
            </div>
            <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
              <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">CPU</p>
              <p class="text-base font-bold text-text-primary tabular-nums">{{ server.cpuPercent }}%</p>
            </div>
            <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
              <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Disk</p>
              <p class="text-base font-bold text-text-primary tabular-nums">{{ server.diskMb }} MB</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Upgrade Tab -->
      <div v-if="activeTab === 'upgrade'" class="space-y-6">
        <!-- Balance Card -->
        <div class="card-surface p-6 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Coins :size="24" class="text-yellow-500" />
          </div>
          <div>
            <p class="text-sm text-text-muted">Your Balance</p>
            <p class="text-2xl font-bold text-yellow-500">{{ authStore.user?.coins || 0 }} coins</p>
          </div>
        </div>

        <!-- RAM Upgrade -->
        <div class="card-surface p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MemoryStick :size="18" class="text-amber-400" />
              </div>
              <div>
                <p class="text-sm font-bold text-text-primary">Memory (RAM)</p>
                <p class="text-xs text-text-muted">Current: {{ server.ramMb }} MB</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-text-muted">{{ upgradeCosts.ram }} coins per 128 MB</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 relative">
              <input
                v-model.number="upgradeAmounts.ram"
                type="number"
                min="128"
                step="128"
                :max="4096"
                class="input-field pr-16"
                placeholder="128"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">MB</span>
            </div>
            <button
              @click="handleUpgrade('ram')"
              :disabled="upgrading || !upgradeAmounts.ram || upgradeAmounts.ram < 128 || (upgradeCosts.ram * Math.ceil(upgradeAmounts.ram / 128)) > (authStore.user?.coins || 0)"
              class="btn-primary px-6 py-2.5 text-sm"
            >
              {{ upgrading === 'ram' ? 'Upgrading...' : `Upgrade (${upgradeCosts.ram * Math.ceil(upgradeAmounts.ram / 128)} coins)` }}
            </button>
          </div>
        </div>

        <!-- CPU Upgrade -->
        <div class="card-surface p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Cpu :size="18" class="text-blue-400" />
              </div>
              <div>
                <p class="text-sm font-bold text-text-primary">CPU Power</p>
                <p class="text-xs text-text-muted">Current: {{ server.cpuPercent }}%</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-text-muted">{{ upgradeCosts.cpu }} coins per 10%</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 relative">
              <input
                v-model.number="upgradeAmounts.cpu"
                type="number"
                min="10"
                step="10"
                :max="500"
                class="input-field pr-16"
                placeholder="10"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
            </div>
            <button
              @click="handleUpgrade('cpu')"
              :disabled="upgrading || !upgradeAmounts.cpu || upgradeAmounts.cpu < 10 || (upgradeCosts.cpu * Math.ceil(upgradeAmounts.cpu / 10)) > (authStore.user?.coins || 0)"
              class="btn-primary px-6 py-2.5 text-sm"
            >
              {{ upgrading === 'cpu' ? 'Upgrading...' : `Upgrade (${upgradeCosts.cpu * Math.ceil(upgradeAmounts.cpu / 10)} coins)` }}
            </button>
          </div>
        </div>

        <!-- Disk Upgrade -->
        <div class="card-surface p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <HardDrive :size="18" class="text-purple-400" />
              </div>
              <div>
                <p class="text-sm font-bold text-text-primary">Disk Space</p>
                <p class="text-xs text-text-muted">Current: {{ server.diskMb }} MB</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs text-text-muted">{{ upgradeCosts.disk }} coins per 512 MB</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 relative">
              <input
                v-model.number="upgradeAmounts.disk"
                type="number"
                min="512"
                step="512"
                :max="10240"
                class="input-field pr-16"
                placeholder="512"
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">MB</span>
            </div>
            <button
              @click="handleUpgrade('disk')"
              :disabled="upgrading || !upgradeAmounts.disk || upgradeAmounts.disk < 512 || (upgradeCosts.disk * Math.ceil(upgradeAmounts.disk / 512)) > (authStore.user?.coins || 0)"
              class="btn-primary px-6 py-2.5 text-sm"
            >
              {{ upgrading === 'disk' ? 'Upgrading...' : `Upgrade (${upgradeCosts.disk * Math.ceil(upgradeAmounts.disk / 512)} coins)` }}
            </button>
          </div>
        </div>

        <!-- Upgrade Info -->
        <div class="card-surface p-4 border-accent/20 bg-accent/5">
          <div class="flex items-start gap-3">
            <Info :size="16" class="text-accent mt-0.5 flex-shrink-0" />
            <div class="text-xs text-text-muted space-y-1">
              <p class="font-bold text-text-primary">How upgrades work</p>
              <p>• Upgrades are instant and apply immediately to your server.</p>
              <p>• Coins are deducted from your balance before the upgrade.</p>
              <p>• Upgraded resources cannot be downgraded — contact support if needed.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone Tab -->
      <div v-if="activeTab === 'danger'" class="card-surface p-8 space-y-6 border-red-500/20 bg-red-500/[0.02]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-text-primary">Danger Zone</h3>
            <p class="text-sm text-text-muted">Irreversible actions that will affect your server.</p>
          </div>
        </div>

        <div class="p-6 bg-base/50 rounded-xl border border-border">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p class="text-sm font-bold text-text-primary">Delete this server</p>
              <p class="text-xs text-text-muted mt-1">Permanently remove this server and all its data.</p>
            </div>
            <button @click="handleDelete" :disabled="deleting" class="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/40 shrink-0">
              {{ deleting ? 'Deleting...' : 'Delete Server' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  ExternalLink, MemoryStick, Cpu, HardDrive, Coins, Info,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const serverId = computed(() => route.params.id)
const server = ref(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const updateError = ref('')
const successMsg = ref('')
const activeTab = ref('general')
const deleting = ref(false)
const upgrading = ref(null)
const pteroUrl = ref('')

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'danger', label: 'Danger Zone' },
]

const form = reactive({
  name: '',
})

const upgradeAmounts = reactive({
  ram: 128,
  cpu: 10,
  disk: 512,
})

const upgradeCosts = reactive({
  ram: 2,
  cpu: 5,
  disk: 1,
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/servers/${serverId.value}`)
    server.value = data
    form.name = data.serverName || ''
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load server'
  } finally {
    loading.value = false
  }

  // Load panel URL
  try {
    const { data } = await client.get('/servers/stats')
    if (data.panelUrl) pteroUrl.value = data.panelUrl
  } catch {
    try {
      const { data } = await client.get('/admin/settings')
      if (data.pterodactyl_panel_url) pteroUrl.value = data.pterodactyl_panel_url
    } catch {}
  }
})

async function handleUpdate() {
  if (!form.name.trim()) return
  saving.value = true
  updateError.value = ''
  successMsg.value = ''
  try {
    const { data } = await client.put(`/servers/${serverId.value}`, { serverName: form.name })
    server.value = data
    successMsg.value = 'Server settings updated successfully.'
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Failed to update server'
  } finally {
    saving.value = false
  }
}

async function handleUpgrade(type) {
  const amount = upgradeAmounts[type]
  if (!amount || amount <= 0) return
  
  upgrading.value = type
  updateError.value = ''
  successMsg.value = ''
  
  try {
    await client.post(`/store/${serverId.value}/upgrade`, { type, amount })
    // Refresh server data
    const { data } = await client.get(`/servers/${serverId.value}`)
    server.value = data
    await authStore.fetchProfile()
    successMsg.value = `${type.toUpperCase()} upgraded successfully by ${amount} ${type === 'cpu' ? '%' : 'MB'}!`
    upgradeAmounts[type] = type === 'ram' ? 128 : type === 'cpu' ? 10 : 512
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Failed to upgrade server'
  } finally {
    upgrading.value = null
  }
}

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this server? This action cannot be undone.')) return
  deleting.value = true
  try {
    await client.delete(`/servers/${serverId.value}`)
    router.push('/servers')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete server'
    deleting.value = false
  }
}

function statusColor(status) {
  return {
    active: 'text-accent bg-accent',
    suspended: 'text-yellow-500 bg-yellow-500',
    expired: 'text-red-500 bg-red-500',
  }[status] || 'text-white/20 bg-white/20'
}

function statusText(status) {
  return {
    active: 'text-accent',
    suspended: 'text-yellow-500',
    expired: 'text-red-400',
  }[status] || 'text-text-muted'
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
