<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <button v-if="selectedCategory" @click="goBack" class="text-sm text-accent hover:text-white transition-colors">&larr; Back</button>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">
        {{ selectedCategory ? selectedCategory : 'Services' }}
      </h2>
      <p class="text-sm text-text-muted">
        {{ selectedCategory ? 'Choose a plan to deploy your server' : 'Select a hosting service to get started' }}
      </p>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold flex items-center gap-3">
      <span>⚠️</span> {{ error }}
    </div>
    <div v-if="success" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold flex items-center gap-3">
      <span>✅</span> {{ success }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading...</p>
    </div>

    <!-- STEP 1: Category Selection -->
    <div v-else-if="!selectedCategory" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cat in categories"
        :key="cat.name"
        @click="selectCategory(cat.name)"
        class="card-surface p-8 flex flex-col items-center text-center space-y-4 cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/[0.02] group"
      >
        <div class="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
          <svg v-if="cat.name === 'Minecraft'" class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <svg v-else-if="cat.name === 'Bot Hosting'" class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{{ cat.name }}</h3>
          <p class="text-sm text-text-muted mt-1">{{ cat.products.length }} plan{{ cat.products.length !== 1 ? 's' : '' }} available</p>
        </div>
      </div>

      <div v-if="categories.length === 0 && !loading" class="col-span-full card-surface p-12 text-center">
        <p class="text-text-muted">No services available yet. Check back later.</p>
      </div>
    </div>

    <!-- STEP 2: Plan Selection (within category) -->
    <div v-else-if="selectedCategory && !selectedPlan" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="plan in filteredProducts"
          :key="plan.id"
          @click="selectPlan(plan)"
          class="card-surface p-6 flex flex-col transition-all hover:border-accent/30 cursor-pointer group"
        >
          <div class="flex-1 space-y-4">
            <div>
              <h4 class="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">{{ plan.name }}</h4>
              <p v-if="plan.description" class="text-sm text-text-muted mt-1">{{ plan.description }}</p>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">RAM</p>
                <p class="text-xs font-bold text-text-primary">{{ formatRam(plan.ram) }}</p>
              </div>
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">CPU</p>
                <p class="text-xs font-bold text-text-primary">{{ plan.cpu }}%</p>
              </div>
              <div class="p-2 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-0.5">Disk</p>
                <p class="text-xs font-bold text-text-primary">{{ formatDisk(plan.disk) }}</p>
              </div>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-border">
              <span class="text-sm font-bold text-accent tabular-nums">{{ plan.coin_price }} coins</span>
              <span class="text-[10px] text-text-muted font-medium">{{ plan.duration_days }} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: Egg Selection + Server Name -->
    <div v-else-if="selectedPlan && !serverCreated" class="space-y-8 max-w-2xl">
      <!-- Selected Plan Summary -->
      <div class="card-surface p-6 flex items-center justify-between">
        <div>
          <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Selected Plan</p>
          <p class="text-lg font-bold text-text-primary mt-1">{{ selectedPlan.name }}</p>
        </div>
        <button @click="selectedPlan = null" class="text-xs font-bold text-accent hover:text-white transition-colors">Change Plan</button>
      </div>

      <!-- Egg Selection -->
      <div class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-label">Select Egg</h3>
          <p class="text-sm text-text-muted">Choose the software type for your server.</p>
        </div>

        <div v-if="loadingEggs" class="flex items-center gap-3 py-4">
          <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-text-muted">Loading eggs from Pterodactyl...</p>
        </div>

        <div v-else-if="eggs.length === 0" class="card-surface p-8 text-center">
          <p class="text-text-muted">No eggs available for this plan.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="egg in eggs"
            :key="egg.id"
            type="button"
            @click="selectedEgg = egg"
            :class="[
              'card-surface p-4 text-left transition-all',
              selectedEgg?.id === egg.id ? 'border-accent/50 bg-accent/[0.05] ring-1 ring-accent/20' : 'hover:border-accent/30'
            ]"
          >
            <p class="text-sm font-bold text-text-primary">{{ egg.attributes?.name || 'Egg #' + egg.id }}</p>
            <p v-if="egg.attributes?.description" class="text-xs text-text-muted mt-1 line-clamp-2">{{ egg.attributes.description }}</p>
          </button>
        </div>
      </div>

      <!-- Server Name -->
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1.5">
          <label for="serverName" class="text-label">Server Name</label>
          <div class="relative">
            <input
              id="serverName"
              v-model="serverName"
              type="text"
              required
              maxlength="100"
              class="input-field text-lg font-semibold py-3 pr-32"
              placeholder="e.g. my-minecraft-server"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted/50 pointer-events-none">-free-dash</span>
          </div>
          <p class="text-[11px] text-text-muted mt-2">
            <span class="text-accent font-medium">-free-dash</span> will be automatically appended.
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
            Balance: <span class="text-yellow-500 font-bold tabular-nums">{{ authStore.user?.coins || 0 }} coins</span> —
            Deploying costs <span class="text-accent font-bold">{{ selectedPlan.coin_price }} coins</span>
            <span v-if="selectedPlan.coin_price > (authStore.user?.coins || 0)" class="text-red-400 font-bold"> (insufficient)</span>
          </p>
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <button @click="selectedPlan = null" class="btn-secondary w-full sm:w-auto text-center">Back</button>
          <button
            @click="deployServer"
            :disabled="deploying || !serverName || !selectedEgg"
            class="btn-primary w-full sm:w-auto px-10 py-2.5"
          >
            {{ deploying ? 'Deploying...' : 'Deploy Server' }}
          </button>
        </div>
      </div>
    </div>

    <!-- STEP 4: Success -->
    <div v-else-if="serverCreated" class="card-surface p-12 text-center space-y-6">
      <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 class="text-xl font-bold text-text-primary">Server Deployed!</h3>
        <p class="text-sm text-text-muted mt-2">Your server <span class="text-accent font-medium">{{ serverName }}-free-dash</span> is being created.</p>
      </div>
      <div class="flex items-center justify-center gap-4">
        <router-link to="/servers" class="btn-primary px-6 py-2">View Servers</router-link>
        <router-link to="/home" class="btn-secondary px-6 py-2">Dashboard</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useServersStore } from '../stores/servers'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'

const serversStore = useServersStore()
const authStore = useAuthStore()

const loading = ref(true)
const loadingEggs = ref(false)
const error = ref('')
const success = ref('')
const products = ref([])
const eggs = ref([])
const selectedCategory = ref(null)
const selectedPlan = ref(null)
const selectedEgg = ref(null)
const serverName = ref('')
const deploying = ref(false)
const serverCreated = ref(false)

const categories = computed(() => {
  const catMap = {}
  for (const p of products.value) {
    const catName = p.nest_name || 'Other'
    if (!catMap[catName]) catMap[catName] = { name: catName, products: [] }
    catMap[catName].products.push(p)
  }
  return Object.values(catMap)
})

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return []
  return products.value.filter(p => (p.nest_name || 'Other') === selectedCategory.value)
})

onMounted(async () => {
  try {
    const [prodRes] = await Promise.all([
      client.get('/products'),
      authStore.fetchProfile().catch(() => {})
    ])
    products.value = prodRes.data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load services'
  } finally {
    loading.value = false
  }
})

function selectCategory(name) {
  selectedCategory.value = name
  selectedPlan.value = null
  selectedEgg.value = null
}

function selectPlan(plan) {
  selectedPlan.value = plan
  selectedEgg.value = null
  loadEggs(plan)
}

async function loadEggs(plan) {
  if (!plan.nest_id) {
    error.value = 'This plan has no nest configured'
    return
  }
  loadingEggs.value = true
  eggs.value = []
  try {
    const { data } = await client.get(`/admin/products/nests/${plan.nest_id}/eggs`)
    eggs.value = Array.isArray(data) ? data : []
  } catch (err) {
    // If admin endpoint fails (non-admin), try products endpoint
    try {
      const { data } = await client.get(`/products/nests/${plan.nest_id}/eggs`)
      eggs.value = Array.isArray(data) ? data : []
    } catch {
      error.value = 'Failed to load eggs. Please try again.'
    }
  } finally {
    loadingEggs.value = false
  }
}

function goBack() {
  if (selectedPlan.value) {
    selectedPlan.value = null
    selectedEgg.value = null
    eggs.value = []
  } else {
    selectedCategory.value = null
  }
}

function formatRam(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
}

async function deployServer() {
  if (!serverName.value || !selectedPlan.value || !selectedEgg.value) return
  deploying.value = true
  error.value = ''
  try {
    await serversStore.createServer(serverName.value, selectedPlan.value.id)
    await authStore.fetchProfile()
    serverCreated.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create server'
  } finally {
    deploying.value = false
  }
}
</script>
