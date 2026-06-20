<template>
  <div class="space-y-8">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Settings</h2>
      <p class="text-sm text-text-muted">System Configuration</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 flex items-center gap-2">
      <AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}
    </div>
    <div v-if="success" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 flex items-center gap-2">
      <CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}
    </div>

    <!-- AFK Earning Rates -->
    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap :size="16" class="text-amber-400" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">AFK Earning Rates</h3>
            <p class="text-[11px] text-text-muted">Compute credits earned from active sessions</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 bg-base/50 px-3 py-1.5 rounded-lg border border-border">
            <input v-model="afkCoins" type="number" class="w-14 bg-transparent text-accent font-bold text-center text-sm border-none focus:ring-0 p-0" />
            <span class="text-[10px] text-text-muted font-bold">CR /</span>
            <input v-model="afkInterval" type="number" class="w-10 bg-transparent text-text-primary font-bold text-center text-sm border-none focus:ring-0 p-0" />
            <span class="text-[10px] text-text-muted font-bold">MIN</span>
          </div>
          <button @click="saveAfkRates" :disabled="savingAfk" class="px-4 py-1.5 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
            {{ savingAfk ? 'Saving...' : 'Apply' }}
          </button>
        </div>
      </div>
      <p class="text-[11px] text-text-muted bg-base/50 px-3 py-2 rounded-lg border border-border">
        Users earn <span class="text-accent font-bold">{{ afkCoins || 0 }} CR</span> every <span class="text-text-primary font-bold">{{ afkInterval || 0 }} min</span> of active focus.
      </p>
    </div>

    <!-- Default Server Node -->
    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Server :size="16" class="text-orange-400" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Default Server Node</h3>
            <p class="text-[11px] text-text-muted">Pterodactyl node for new deployments</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="loadNodes" :disabled="loadingNodes" class="px-3 py-1.5 text-[10px] font-bold text-orange-400 border border-orange-500/20 rounded-lg hover:bg-orange-500/10 disabled:opacity-40 transition-colors">
            {{ loadingNodes ? 'Loading...' : 'Refresh' }}
          </button>
          <button @click="saveDefaultNode" :disabled="savingNode || !selectedNodeId" class="px-4 py-1.5 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
            {{ savingNode ? 'Saving...' : 'Save Node' }}
          </button>
        </div>
      </div>

      <div v-if="loadingNodes" class="flex items-center gap-3 py-4">
        <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs text-text-muted">Fetching nodes from Pterodactyl...</p>
      </div>

      <div v-else-if="nodes.length === 0" class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs">
        <p class="text-yellow-400 font-bold">No nodes found. Configure Panel API first.</p>
      </div>

      <div v-else class="space-y-3">
        <select v-model="selectedNodeId" class="input-field py-2">
          <option :value="null" disabled>Select a node...</option>
          <option v-for="node in nodes" :key="node.id" :value="node.id">
            {{ node.name }} — {{ node.fqdn }} ({{ formatRam(node.ram) }}, {{ formatDisk(node.disk) }})
          </option>
        </select>

        <div v-if="selectedNode" class="bg-base/50 p-3 rounded-lg border border-border grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div><p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Node</p><p class="text-text-primary font-bold">{{ selectedNode.name }}</p></div>
          <div><p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Host</p><p class="text-text-primary font-bold">{{ selectedNode.fqdn }}</p></div>
          <div><p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">RAM</p><p class="text-text-primary font-bold">{{ formatRam(selectedNode.ram) }}</p></div>
          <div><p class="text-[9px] text-text-muted uppercase font-bold mb-0.5">Disk</p><p class="text-text-primary font-bold">{{ formatDisk(selectedNode.disk) }}</p></div>
        </div>

        <p v-if="nodeSuccess" class="text-xs font-bold text-emerald-400">✓ {{ nodeSuccess }}</p>
        <p v-if="nodeError" class="text-xs font-bold text-red-400">✕ {{ nodeError }}</p>
      </div>
    </div>

    <!-- Default Allocation Settings -->
    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <HardDrive :size="16" class="text-cyan-400" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Default Allocation</h3>
            <p class="text-[11px] text-text-muted">Resource limits for new servers (startup depends on nest/egg)</p>
          </div>
        </div>
        <button @click="saveAllocationSettings" :disabled="savingAllocation" class="px-4 py-1.5 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
          {{ savingAllocation ? 'Saving...' : 'Save Allocation' }}
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">RAM</label>
          <input v-model.number="allocationSettings.ram_mb" type="number" class="input-field py-2" placeholder="2048" />
          <p class="text-[10px] text-text-muted">{{ formatRam(allocationSettings.ram_mb || 0) }}</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">CPU</label>
          <input v-model.number="allocationSettings.cpu_percent" type="number" class="input-field py-2" placeholder="100" />
          <p class="text-[10px] text-text-muted">{{ allocationSettings.cpu_percent || 0 }}%</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Disk</label>
          <input v-model.number="allocationSettings.disk_mb" type="number" class="input-field py-2" placeholder="5120" />
          <p class="text-[10px] text-text-muted">{{ formatDisk(allocationSettings.disk_mb || 0) }}</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Swap</label>
          <input v-model.number="allocationSettings.swap_mb" type="number" class="input-field py-2" placeholder="0" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Databases</label>
          <input v-model.number="allocationSettings.databases_limit" type="number" class="input-field py-2" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Allocations</label>
          <input v-model.number="allocationSettings.allocations_limit" type="number" class="input-field py-2" placeholder="1" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Backups</label>
          <input v-model.number="allocationSettings.backup_limit" type="number" class="input-field py-2" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Docker Image</label>
          <input v-model="allocationSettings.docker_image" type="text" class="input-field py-2" placeholder="ghcr.io/pterodactyl/yolks:java_25" />
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Startup Command</label>
          <input v-model="allocationSettings.startup_command" type="text" class="input-field py-2" placeholder="Auto from nest/egg if blank" />
          <p class="text-[10px] text-text-muted">Leave blank — startup comes from egg config</p>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Auto Start</label>
          <select v-model="allocationSettings.auto_start" class="input-field py-2">
            <option :value="1">Yes</option>
            <option :value="0">No</option>
          </select>
        </div>
      </div>

      <p v-if="allocationSuccess" class="text-xs font-bold text-emerald-400">✓ {{ allocationSuccess }}</p>
      <p v-if="allocationError" class="text-xs font-bold text-red-400">✕ {{ allocationError }}</p>
    </div>

    <!-- Panel API Configuration -->
    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <svg class="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 class="text-sm font-bold text-text-primary">Panel API</h3>
            <p class="text-[11px] text-text-muted">Pterodactyl / Revactyl connection</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button @click="testPterodactyl" :disabled="testingPtero" class="px-3 py-1.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 disabled:opacity-40 transition-colors">
            {{ testingPtero ? 'Testing...' : 'Test' }}
          </button>
          <button @click="savePterodactylConfig" :disabled="savingPtero" class="px-4 py-1.5 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
            {{ savingPtero ? 'Saving...' : 'Save Config' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Panel Type</label>
          <select v-model="pteroConfig.panelType" class="input-field py-2">
            <option value="pterodactyl">Pterodactyl</option>
            <option value="revactyl">Revactyl</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Panel URL</label>
          <input v-model="pteroConfig.panelUrl" type="text" placeholder="https://panel.example.com" class="input-field py-2" />
        </div>
        <div class="space-y-1 md:col-span-2">
          <label class="text-[10px] font-bold text-text-muted uppercase">API Key</label>
          <div class="flex items-center gap-2">
            <div class="flex-1 relative">
              <input
                v-model="pteroConfig.apiKey"
                :type="showApiKey ? 'text' : 'password'"
                placeholder="ptla_..."
                class="input-field py-2 pr-10 w-full"
              />
              <button @click="showApiKey = !showApiKey" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                <Eye v-if="!showApiKey" :size="14" :stroke-width="2" />
                <EyeOff v-else :size="14" :stroke-width="2" />
              </button>
            </div>
            <span v-if="pteroApiKeyConfigured && !pteroConfig.apiKey" class="flex items-center gap-1 text-emerald-400 text-[10px] font-bold whitespace-nowrap">
              <CheckCircle :size="12" :stroke-width="2.5" /> Saved
            </span>
          </div>
        </div>
      </div>

      <div v-if="pteroStatus" class="p-3 rounded-lg text-xs font-medium flex items-start gap-2"
        :class="pteroStatus.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'">
        <span v-if="pteroStatus.success">✓</span>
        <span v-else>✕</span>
        <div class="flex-1">
          <div>{{ pteroStatus.message }}</div>
          <div v-if="pteroStatus.nodeCount" class="mt-1 font-bold">{{ pteroStatus.nodeCount }} nodes available</div>
        </div>
      </div>
    </div>

    <!-- Branding -->
    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <Layers :size="16" class="text-purple-400" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-text-primary">Branding</h3>
          <p class="text-[11px] text-text-muted">Login page image & favicon</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-text-muted uppercase">Login Image URL</label>
          <div class="flex gap-2">
            <input v-model="loginImageUrl" type="text" placeholder="https://example.com/bg.png" class="input-field py-2 flex-1" />
            <button @click="saveLoginImage" :disabled="savingLoginImage" class="px-3 py-1.5 text-[10px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
              {{ savingLoginImage ? '...' : 'Save' }}
            </button>
          </div>
          <div v-if="loginImageUrl" class="mt-2 rounded-lg overflow-hidden border border-border max-w-[180px]">
            <img :src="loginImageUrl" @error="loginImageError = true" @load="loginImageError = false" class="w-full h-20 object-cover" />
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-[10px] font-bold text-text-muted uppercase">Favicon URL</label>
          <div class="flex gap-2">
            <input v-model="faviconUrl" type="text" placeholder="https://example.com/favicon.ico" class="input-field py-2 flex-1" />
            <button @click="saveFavicon" :disabled="savingFavicon" class="px-3 py-1.5 text-[10px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
              {{ savingFavicon ? '...' : 'Save' }}
            </button>
          </div>
          <div v-if="faviconUrl" class="flex items-center gap-2 mt-2">
            <img :src="faviconUrl" @error="faviconError = true" @load="faviconError = false" class="w-6 h-6 rounded border border-border" />
            <span v-if="faviconError" class="text-[10px] text-red-400">Invalid</span>
          </div>
        </div>
      </div>
    </div>

    <!-- All Settings Table -->
    <div class="bg-base-secondary border border-border rounded-xl overflow-hidden">
      <div class="px-5 py-3 border-b border-border flex items-center justify-between">
        <h3 class="text-sm font-bold text-text-primary">All Settings</h3>
        <span class="text-[10px] text-text-muted font-bold">{{ Object.keys(store.settings).length }} keys</span>
      </div>
      <div v-if="Object.keys(store.settings).length > 0" class="divide-y divide-border/50">
        <div
          v-for="(value, key) in store.settings"
          :key="key"
          class="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group"
        >
          <!-- Key -->
          <div class="w-64 flex-shrink-0">
            <span class="text-xs font-mono text-accent/80 bg-accent/5 px-2 py-0.5 rounded">{{ key }}</span>
          </div>
          <!-- Value -->
          <div class="flex-1 min-w-0">
            <div v-if="editingKey === key" class="flex items-center gap-2">
              <input v-model="editValue" type="text" class="input-field py-1.5 text-xs flex-1" @keyup.enter="handleSave(key)" />
              <button @click="handleSave(key)" :disabled="saving" class="px-3 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/30 disabled:opacity-40 transition-colors">
                {{ saving ? '...' : 'Save' }}
              </button>
              <button @click="editingKey = null" class="px-3 py-1 text-[10px] font-bold text-text-muted hover:text-text-primary transition-colors">
                Cancel
              </button>
            </div>
            <span v-else class="text-xs text-text-muted truncate block">{{ value }}</span>
          </div>
          <!-- Edit -->
          <button
            v-if="editingKey !== key"
            @click="startEdit(key, value)"
            class="text-[10px] font-bold text-accent hover:text-white transition-colors opacity-0 group-hover:opacity-100"
          >Edit</button>
        </div>
      </div>

      <div v-else class="py-12 text-center">
        <p class="text-text-muted text-sm font-bold">No settings found</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'
import { AlertTriangle, CheckCircle, Zap, Check, Server, HardDrive, Eye, EyeOff, Layers } from 'lucide-vue-next'

const store = useAdminStore()
const editingKey = ref(null)
const editValue = ref('')
const saving = ref(false)
const error = ref('')
const success = ref('')

const savingAfk = ref(false)
const afkCoins = ref(10)
const afkInterval = ref(1)

const loginImageUrl = ref('')
const faviconUrl = ref('')
const savingLoginImage = ref(false)
const savingFavicon = ref(false)
const loginImageError = ref(false)
const faviconError = ref(false)

const loadingNodes = ref(false)
const savingNode = ref(false)
const nodes = ref([])
const selectedNodeId = ref(null)
const nodeSuccess = ref('')
const nodeError = ref('')

const savingAllocation = ref(false)
const allocationSettings = ref({
  ram_mb: 2048,
  cpu_percent: 100,
  disk_mb: 5120,
  swap_mb: 0,
  databases_limit: 0,
  allocations_limit: 1,
  backup_limit: 0,
  docker_image: 'ghcr.io/pterodactyl/yolks:java_25',
  startup_command: '',
  auto_start: 1,
})
const allocationSuccess = ref('')
const allocationError = ref('')

const savingPtero = ref(false)
const testingPtero = ref(false)
const pteroConfig = ref({ panelType: 'pterodactyl', panelUrl: '', apiKey: '' })
const pteroStatus = ref(null)
const pteroConfigured = ref(false)
const pteroApiKeyConfigured = ref(false)
const showApiKey = ref(false)

const selectedNode = computed(() => {
  if (!selectedNodeId.value || !nodes.value.length) return null
  return nodes.value.find(n => n.id === selectedNodeId.value)
})

function formatRam(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

async function loadNodes() {
  loadingNodes.value = true; nodeError.value = ''; nodeSuccess.value = ''
  try {
    const res = await store.fetchPterodactylNodes()
    nodes.value = res || []
    if (nodes.value.length === 0) nodeError.value = 'No nodes found. Check Panel API connection.'
  } catch (err) { nodeError.value = err.response?.data?.message || 'Failed to load nodes' }
  finally { loadingNodes.value = false }
}

async function saveDefaultNode() {
  if (!selectedNodeId.value) return
  savingNode.value = true; nodeError.value = ''; nodeSuccess.value = ''
  try {
    await store.updateSetting('default_node_id', selectedNodeId.value.toString())
    nodeSuccess.value = `Default node: "${selectedNode.value?.name}" (ID: ${selectedNodeId.value})`
  } catch (err) { nodeError.value = err.response?.data?.message || 'Failed' }
  finally { savingNode.value = false }
}

async function saveAllocationSettings() {
  savingAllocation.value = true; allocationError.value = ''; allocationSuccess.value = ''
  try {
    const promises = Object.entries(allocationSettings.value).map(([key, val]) =>
      store.updateSetting(`default_${key}`, val.toString())
    )
    await Promise.all(promises)
    allocationSuccess.value = 'Allocation settings saved!'
  } catch (err) { allocationError.value = err.response?.data?.message || 'Failed' }
  finally { savingAllocation.value = false }
}

onMounted(async () => {
  await store.fetchSettings()
  if (store.settings['afk_coins_per_minute']) afkCoins.value = parseInt(store.settings['afk_coins_per_minute']) || 10
  if (store.settings['afk_time_interval_minutes']) afkInterval.value = parseInt(store.settings['afk_time_interval_minutes']) || 1
  if (store.settings['login_image_url']) loginImageUrl.value = store.settings['login_image_url']
  if (store.settings['favicon_url']) faviconUrl.value = store.settings['favicon_url']
  if (store.settings['default_node_id']) selectedNodeId.value = parseInt(store.settings['default_node_id']) || null

  const getSettingNum = (key, fallback) => store.settings[`default_${key}`] ? parseInt(store.settings[`default_${key}`]) : fallback
  const getSettingStr = (key, fallback) => store.settings[`default_${key}`] || fallback

  allocationSettings.value = {
    ram_mb: getSettingNum('ram_mb', 2048),
    cpu_percent: getSettingNum('cpu_percent', 100),
    disk_mb: getSettingNum('disk_mb', 5120),
    swap_mb: getSettingNum('swap_mb', 0),
    databases_limit: getSettingNum('databases_limit', 0),
    allocations_limit: getSettingNum('allocations_limit', 1),
    backup_limit: getSettingNum('backup_limit', 0),
    docker_image: getSettingStr('docker_image', 'ghcr.io/pterodactyl/yolks:java_25'),
    startup_command: getSettingStr('startup_command', ''),
    auto_start: getSettingNum('auto_start', 1),
  }

  await loadPterodactylConfig()
  if (pteroConfigured.value) {
    loadNodes().then(() => {
      if (selectedNodeId.value && nodes.value.length > 0) {
        const exists = nodes.value.find(n => n.id === selectedNodeId.value)
        if (!exists) selectedNodeId.value = null
      }
    }).catch(() => {})
  }
})

async function saveLoginImage() {
  savingLoginImage.value = true; error.value = ''; success.value = ''
  try { await store.updateSetting('login_image_url', loginImageUrl.value); success.value = 'Login image updated' }
  catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { savingLoginImage.value = false }
}

async function saveFavicon() {
  savingFavicon.value = true; error.value = ''; success.value = ''
  try { await store.updateSetting('favicon_url', faviconUrl.value); success.value = 'Favicon updated' }
  catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { savingFavicon.value = false }
}

async function saveAfkRates() {
  savingAfk.value = true; error.value = ''; success.value = ''
  try {
    await store.updateSetting('afk_coins_per_minute', afkCoins.value.toString())
    await store.updateSetting('afk_time_interval_minutes', Math.max(1, afkInterval.value).toString())
    success.value = `AFK rates: ${afkCoins.value} CR / ${Math.max(1, afkInterval.value)} MIN`
  } catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { savingAfk.value = false }
}

function startEdit(key, value) {
  editingKey.value = key; editValue.value = value; error.value = ''; success.value = ''
}

async function handleSave(key) {
  saving.value = true; error.value = ''; success.value = ''
  try {
    await store.updateSetting(key, editValue.value)
    success.value = `"${key}" updated`
    editingKey.value = null
  } catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { saving.value = false }
}

async function loadPterodactylConfig() {
  try {
    const { data } = await client.get('/admin/pterodactyl/config')
    pteroConfig.value.panelUrl = data.panelUrl || ''
    pteroConfig.value.panelType = data.panelType || 'pterodactyl'
    pteroConfigured.value = data.configured || false
    pteroApiKeyConfigured.value = data.apiKeyConfigured || false
  } catch (err) { console.error('Failed to load Pterodactyl config:', err) }
}

async function savePterodactylConfig() {
  savingPtero.value = true; error.value = ''; success.value = ''; pteroStatus.value = null
  try {
    const apiKey = pteroConfig.value.apiKey || (pteroApiKeyConfigured.value ? undefined : '')
    await store.updatePterodactylConfig(pteroConfig.value.panelUrl, apiKey, pteroConfig.value.panelType)
    success.value = 'Panel config saved!'
    pteroConfigured.value = true
    pteroConfig.value.apiKey = ''
    await loadPterodactylConfig()
  } catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { savingPtero.value = false }
}

async function testPterodactyl() {
  testingPtero.value = true; error.value = ''; success.value = ''; pteroStatus.value = null
  try {
    const { data } = await client.post('/admin/pterodactyl/test')
    pteroStatus.value = data
    if (data.success) { success.value = 'Connection OK'; pteroConfigured.value = true }
    else { error.value = data.message || 'Failed'; pteroConfigured.value = false }
  } catch (err) {
    error.value = err.response?.data?.message || 'Test failed'
    pteroStatus.value = { success: false, message: 'Connection test failed' }
    pteroConfigured.value = false
  } finally { testingPtero.value = false }
}
</script>
