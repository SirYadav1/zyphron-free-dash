<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header -->
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Server</h2>
      <p class="text-sm text-text-muted">Deploy a new high-performance compute instance to your infrastructure.</p>
    </div>

    <!-- Feedback -->
    <div v-if="store.error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold flex items-center gap-3">
      <span>⚠️</span> {{ store.error }}
    </div>

    <div v-if="success" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold flex items-center gap-3">
      <span>✅</span> {{ success }}
    </div>

    <div v-if="store.loading && !store.plans.length" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Plans...</p>
    </div>

    <form v-else @submit.prevent="handleCreate" class="space-y-8">
      
      <!-- Plan Selection -->
      <div class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-label">Select a Plan</h3>
          <p class="text-sm text-text-muted">Choose a server plan that fits your needs. Plans determine your server's resource allocation.</p>
        </div>

        <div v-if="store.plans.length === 0 && !store.loading" class="card-surface p-8 text-center">
          <p class="text-text-muted">No server plans available yet. Please check back later.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            v-for="plan in store.plans"
            :key="plan.id"
            type="button"
            @click="selectedPlanId = plan.id"
            :class="[
              'card-surface p-6 text-left transition-all hover:border-accent/30',
              selectedPlanId === plan.id ? 'border-accent/50 bg-accent/[0.05] ring-1 ring-accent/20' : 'border-border'
            ]"
          >
            <div class="flex items-center justify-between mb-4">
              <h4 class="font-bold text-text-primary">{{ plan.name }}</h4>
              <div class="text-right">
                <p class="text-lg font-bold text-accent tabular-nums">{{ plan.coin_price }}</p>
                <p class="text-[9px] text-text-muted font-bold uppercase tracking-widest">Coins</p>
              </div>
            </div>

            <div v-if="plan.description" class="mb-4">
              <p class="text-xs text-text-muted">{{ plan.description }}</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">RAM</p>
                <p class="text-xs font-bold text-text-primary">{{ plan.ram }} MB</p>
              </div>
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">CPU</p>
                <p class="text-xs font-bold text-text-primary">{{ plan.cpu }}%</p>
              </div>
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">Disk</p>
                <p class="text-xs font-bold text-text-primary">{{ plan.disk }} MB</p>
              </div>
            </div>

            <div class="mt-3 flex items-center gap-2 text-[10px] text-text-muted">
              <span v-if="plan.egg_name" class="px-1.5 py-0.5 rounded bg-white/5 font-medium uppercase">{{ plan.egg_name }}</span>
              <span v-if="plan.egg_name && plan.nest_name">•</span>
              <span v-if="plan.nest_name">{{ plan.nest_name }}</span>
            </div>

            <div class="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px]">
              <span class="text-text-muted font-medium">Valid for {{ plan.duration_days }} days</span>
              <span class="text-text-muted font-medium">{{ plan.coin_price }} coins</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Server Type Selection -->
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1">
          <h3 class="text-label">Server Type</h3>
          <p class="text-sm text-text-muted">Select the nest and egg type for your server deployment.</p>
        </div>

        <!-- Nest Selection -->
        <div class="space-y-1">
          <label class="text-label">Nest</label>
          <div v-if="loadingNests" class="flex items-center gap-2 py-2">
            <div class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-text-muted">Loading nests...</span>
          </div>
          <select v-else v-model="selectedNestId" class="input-field w-full" @change="onNestChange">
            <option :value="null">Select a nest...</option>
            <option v-for="nest in nests" :key="nest.attributes?.id || nest.id" :value="nest.attributes?.id || nest.id">
              {{ nest.attributes?.name || nest.name || 'Nest #' + (nest.attributes?.id || nest.id) }}
            </option>
          </select>
          <p v-if="nests.length === 0 && !loadingNests" class="text-xs text-text-muted">No nests available. Using default configuration.</p>
        </div>

        <!-- Egg Selection -->
        <div class="space-y-1">
          <label class="text-label">Egg</label>
          <div v-if="loadingEggs" class="flex items-center gap-2 py-2">
            <div class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs text-text-muted">Loading eggs...</span>
          </div>
          <select v-else v-model="selectedEggId" class="input-field w-full" :disabled="!selectedNestId">
            <option :value="null">{{ selectedNestId ? 'Select an egg...' : 'Select a nest first' }}</option>
            <option v-for="egg in eggs" :key="egg.attributes?.id || egg.id" :value="egg.attributes?.id || egg.id">
              {{ egg.attributes?.name || egg.name || 'Egg #' + (egg.attributes?.id || egg.id) }}
            </option>
          </select>
          <p v-if="selectedPlan && !selectedNestId" class="text-[11px] text-accent/70">
            Using plan default: {{ selectedPlan.nest_name || 'Default Nest' }} / {{ selectedPlan.egg_name || 'Default Egg' }}
          </p>
        </div>
      </div>

      <!-- Name Section -->
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1.5">
          <label for="serverName" class="text-label">Instance Name</label>
          <div class="relative">
            <input
              id="serverName"
              v-model="serverName"
              type="text"
              required
              maxlength="100"
              pattern="[a-zA-Z0-9\- ]+"
              class="input-field text-lg font-semibold py-3 pr-32"
              placeholder="e.g. production-api-01"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted/50 pointer-events-none">-free-dash</span>
          </div>
          <p class="text-[11px] text-text-muted mt-2">
            A unique identifier for your server. <span class="text-accent font-medium">-free-dash</span> will be automatically appended.
            <br/>Example: <span class="text-text-primary font-medium">{{ serverName || 'my-server' }}-free-dash</span>
          </p>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <p class="text-xs text-text-muted font-medium max-w-xs">
            <template v-if="selectedPlan">
              Your balance: <span class="text-yellow-500 font-bold tabular-nums">{{ authStore.user?.coins || 0 }} coins</span> —
              Deploying will consume <span class="text-accent font-bold">{{ selectedPlan.coin_price }} coins</span>
              <span v-if="selectedPlan.coin_price > (authStore.user?.coins || 0)" class="text-red-400 font-bold"> (insufficient balance)</span>
            </template>
            <template v-else>
              Your balance: <span class="text-yellow-500 font-bold tabular-nums">{{ authStore.user?.coins || 0 }} coins</span> — Select a plan to deploy.
            </template>
          </p>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <router-link to="/home" class="btn-secondary w-full sm:w-auto text-center">Cancel</router-link>
          <button
            type="submit"
            :disabled="store.loading || !serverName || !selectedPlanId"
            class="btn-primary w-full sm:w-auto px-10 py-2.5"
          >
            {{ store.loading ? 'Provisioning...' : 'Deploy Server' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useServersStore } from '../stores/servers'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'

const router = useRouter()
const store = useServersStore()
const authStore = useAuthStore()

const serverName = ref('')
const selectedPlanId = ref(null)
const success = ref('')

// Nest/Egg selection
const nests = ref([])
const eggs = ref([])
const selectedNestId = ref(null)
const selectedEggId = ref(null)
const loadingNests = ref(false)
const loadingEggs = ref(false)

const selectedPlan = computed(() => {
  if (!selectedPlanId.value) return null
  return store.plans.find(p => p.id === selectedPlanId.value) || null
})

onMounted(async () => {
  await store.fetchPlans()
  await loadNests()
  try {
    await authStore.fetchProfile()
  } catch {
    // Profile may already be loaded
  }
})

async function loadNests() {
  loadingNests.value = true
  try {
    const { data } = await client.get('/servers/nests')
    nests.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Failed to load nests:', err)
    nests.value = []
  } finally {
    loadingNests.value = false
  }
}

async function onNestChange() {
  selectedEggId.value = null
  eggs.value = []
  if (!selectedNestId.value) return
  
  loadingEggs.value = true
  try {
    const { data } = await client.get(`/servers/nests/${selectedNestId.value}/eggs`)
    eggs.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('Failed to load eggs:', err)
    eggs.value = []
  } finally {
    loadingEggs.value = false
  }
}

async function handleCreate() {
  if (!serverName.value || !selectedPlanId.value) return
  serverName.value = serverName.value.replace(/[^a-zA-Z0-9\- ]/g, '').substring(0, 100)
  try {
    const payload = {
      serverName: serverName.value,
      productId: selectedPlanId.value,
    }
    // Include selected nest/egg overrides if user explicitly chose them
    if (selectedNestId.value) payload.nestId = selectedNestId.value
    if (selectedEggId.value) payload.eggId = selectedEggId.value
    
    await store.createServer(serverName.value, selectedPlanId.value, payload)
    await authStore.fetchProfile()
    success.value = 'Server created successfully! Your server name: ' + serverName.value + '-free-dash'
    setTimeout(() => router.push('/home'), 2000)
  } catch {
    // Error handled in store
  }
}
</script>
