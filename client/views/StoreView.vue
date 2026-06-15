<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <div v-if="store.loading && !store.server" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Infrastructure...</p>
    </div>

    <div v-else-if="store.error && !store.server" class="card-surface p-8 border-red-500/20 bg-red-500/5 text-red-500">
      <p class="font-bold text-lg mb-1">Environment Error</p>
      <p class="text-sm opacity-80">{{ store.error }}</p>
    </div>

    <template v-else-if="store.server">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h2 class="text-2xl font-bold text-text-primary tracking-tight">Configure Server</h2>
          <p class="text-sm text-text-muted">Scaling resources for <span class="text-text-primary font-bold">{{ store.server.serverName }}</span></p>
        </div>
        <div :class="statusClass" class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border">
          {{ store.server.status }}
        </div>
      </div>

      <!-- Notifications -->
      <div v-if="store.error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-xs font-bold animate-pulse flex items-center gap-2">
        <AlertTriangle :size="14" :stroke-width="2.5" /> {{ store.error }}
      </div>
      <div v-if="store.success" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-xs font-bold flex items-center gap-2">
        <CheckCircle :size="14" :stroke-width="2.5" /> {{ store.success }}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div class="space-y-8">
          <!-- Scaling Options -->
          <div v-if="store.server.status === 'active'" class="card-surface p-8 space-y-8">
            <h3 class="text-label">Scale Resources</h3>

            <div class="grid grid-cols-1 gap-6">
              <div v-for="item in upgradeItems" :key="item.key" 
                class="bg-base/50 border border-border p-6 rounded-xl hover:border-border-bright transition-all group">
                <div class="flex items-center justify-between mb-6">
                  <div class="flex items-center gap-4">
                    <div :class="item.iconBg" class="w-10 h-10 rounded-lg border flex items-center justify-center">
                      <Brain v-if="item.key === 'ram'" :size="18" :stroke-width="2" class="text-blue-400" />
                      <Zap v-else-if="item.key === 'cpu'" :size="18" :stroke-width="2" class="text-amber-400" />
                      <HardDrive v-else-if="item.key === 'disk'" :size="18" :stroke-width="2" class="text-purple-400" />
                    </div>
                    <div>
                      <h4 class="text-sm font-bold text-text-primary">{{ item.label }}</h4>
                      <p class="text-[11px] text-text-muted font-medium">
                        {{ item.current }} {{ item.unit }} <span class="opacity-30">→</span> 
                        <span class="text-text-primary font-bold">{{ item.current + item.amount }}</span> {{ item.unit }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-lg font-bold text-accent tabular-nums">{{ item.amount * item.costPerUnit }}</p>
                    <p class="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-40">Credits</p>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <div class="flex-1 flex items-center bg-base border border-border rounded-lg p-1">
                    <button
                      @click="decrement(item)"
                      :disabled="item.amount <= 0"
                      class="w-8 h-8 rounded-md bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 disabled:opacity-5 transition-all font-bold"
                    >−</button>
                    <div class="flex-1 text-center font-bold text-xs tabular-nums">
                      {{ item.amount }} <span class="text-[10px] text-text-muted opacity-50">{{ item.unit }}</span>
                    </div>
                    <button
                      @click="increment(item)"
                      class="w-8 h-8 rounded-md bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-all font-bold"
                    >+</button>
                  </div>
                  <button
                    @click="handleUpgrade(item)"
                    :disabled="store.loading || item.amount <= 0 || store.userCoins < item.amount * item.costPerUnit"
                    class="btn-primary px-6 h-10"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Allocation -->
          <div class="card-surface p-8 space-y-6">
            <h3 class="text-label">Active Allocation</h3>
            <div class="grid grid-cols-3 gap-4">
              <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Memory</p>
                <p class="text-base font-bold text-text-primary tabular-nums">{{ store.server.ram.current }} MB</p>
              </div>
              <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Compute</p>
                <p class="text-base font-bold text-text-primary tabular-nums">{{ store.server.cpu.current }}%</p>
              </div>
              <div class="p-5 bg-base/50 rounded-xl text-center space-y-1 border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Storage</p>
                <p class="text-base font-bold text-text-primary tabular-nums">{{ store.server.disk.current }} MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar Actions -->
        <div class="space-y-6">
          <div class="card-surface p-6 space-y-6">
            <p class="text-label opacity-50">Identity & Billing</p>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Balance</span>
                <span class="text-base font-bold text-yellow-500 tabular-nums">{{ store.userCoins }}</span>
              </div>
              <div class="h-px bg-border"></div>
              
              <div class="space-y-4 pt-2">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Renewal Term</p>
                    <p class="text-xs font-bold text-text-primary">{{ store.pricing?.renewalDays || 7 }} Days</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Cost</p>
                    <p class="text-xs font-bold text-accent tabular-nums">{{ store.pricing?.renewal || 50 }}</p>
                  </div>
                </div>
                <button
                  @click="handleRenew"
                  :disabled="store.loading || store.userCoins < (store.pricing?.renewal || 50)"
                  class="btn-secondary w-full py-2.5 text-[11px] font-bold uppercase tracking-widest border-accent/20 text-accent hover:bg-accent/5 hover:border-accent/40"
                >
                  {{ store.loading ? 'Processing...' : 'Extend Lease' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card-surface p-6 space-y-4">
            <p class="text-label opacity-50">Blueprint Rates</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-text-muted">RAM / 1GB</span>
                <span class="text-text-primary font-bold tabular-nums">{{ (store.pricing?.ramPerMb || 2) * 1024 }} CR</span>
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-text-muted">vCPU / 100%</span>
                <span class="text-text-primary font-bold tabular-nums">{{ (store.pricing?.cpuPerPercent || 5) * 100 }} CR</span>
              </div>
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-text-muted">Storage / 10GB</span>
                <span class="text-text-primary font-bold tabular-nums">{{ (store.pricing?.diskPerMb || 1) * 10240 }} CR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStoreStore } from '../stores/store'
import { AlertTriangle, CheckCircle, Brain, Zap, HardDrive } from 'lucide-vue-next'

const route = useRoute()
const store = useStoreStore()

const serverId = computed(() => parseInt(route.params.serverId))

const upgradeItems = reactive([
  {
    key: 'ram',
    label: 'Memory Allocation',
    unit: 'MB',
    costPerUnit: 2,
    amount: 0,
    current: 0,
    iconBg: 'border-blue-500/10 bg-blue-500/5',
  },
  {
    key: 'cpu',
    label: 'Compute Capacity',
    unit: '%',
    costPerUnit: 5,
    amount: 0,
    current: 0,
    iconBg: 'border-amber-500/10 bg-amber-500/5',
  },
  {
    key: 'disk',
    label: 'Block Storage',
    unit: 'MB',
    costPerUnit: 1,
    amount: 0,
    current: 0,
    iconBg: 'border-purple-500/10 bg-purple-500/5',
  },
])

const statusClass = computed(() => {
  const s = store.server?.status
  return s === 'active' ? 'border-accent/20 text-accent bg-accent/5' :
         s === 'suspended' ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5' :
         'border-red-500/20 text-red-500 bg-red-500/5'
})

onMounted(async () => {
  await store.fetchOptions(serverId.value)
  if (store.pricing) {
    upgradeItems[0].costPerUnit = store.pricing.ramPerMb
    upgradeItems[1].costPerUnit = store.pricing.cpuPerPercent
    upgradeItems[2].costPerUnit = store.pricing.diskPerMb
  }
  if (store.server) {
    upgradeItems[0].current = store.server.ram.current
    upgradeItems[1].current = store.server.cpu.current
    upgradeItems[2].current = store.server.disk.current
  }
})

function increment(item) {
  const step = item.key === 'cpu' ? 5 : 128
  item.amount += step
}

function decrement(item) {
  const step = item.key === 'cpu' ? 5 : 128
  item.amount = Math.max(0, item.amount - step)
}

async function handleUpgrade(item) {
  if (item.amount <= 0) return
  try {
    await store.upgrade(serverId.value, item.key, item.amount)
    item.amount = 0
    item.current = store.server[item.key].current
  } catch {
    // error handled in store
  }
}

async function handleRenew() {
  try {
    await store.renew(serverId.value)
  } catch {
    // error handled in store
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
