<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <button v-if="selectedCategory" @click="goBack" class="text-sm text-accent hover:text-white transition-colors">&larr; Back</button>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">
        {{ selectedCategory ? selectedCategory.name : 'Services' }}
      </h2>
      <p class="text-sm text-text-muted">
        {{ selectedCategory ? 'Choose a plan that fits your needs' : 'Browse our hosting services and deploy your server in minutes' }}
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
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading services...</p>
    </div>

    <!-- STEP 1: Category Selection -->
    <div v-else-if="!selectedCategory" class="space-y-8">
      <!-- Search Bar -->
      <div class="card-surface p-4 flex items-center gap-3">
        <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search services..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="text-text-muted hover:text-text-primary transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Category Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="cat in filteredCategories"
          :key="cat.name"
          @click="selectCategory(cat)"
          class="card-surface p-8 flex flex-col cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/[0.02] group relative overflow-hidden"
        >
          <!-- Background Glow -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all"></div>
          
          <div class="relative flex-1 space-y-6">
            <!-- Icon -->
            <div class="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 group-hover:scale-110 transition-all">
              <span class="text-2xl">{{ cat.icon }}</span>
            </div>

            <!-- Info -->
            <div class="space-y-2">
              <h3 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{{ cat.name }}</h3>
              <p class="text-sm text-text-muted leading-relaxed">{{ cat.description }}</p>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4 pt-2">
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-accent/60"></div>
                <span class="text-xs font-medium text-text-muted">{{ cat.products.length }} plan{{ cat.products.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-green-500/60"></div>
                <span class="text-xs font-medium text-text-muted">Starting {{ cat.lowestPrice }} coins</span>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="relative mt-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span v-for="tag in cat.tags" :key="tag" class="px-2 py-0.5 bg-white/5 rounded text-[10px] font-medium text-text-muted">{{ tag }}</span>
            </div>
            <svg class="w-5 h-5 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCategories.length === 0 && searchQuery" class="col-span-full card-surface p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p class="text-text-muted">No services match "{{ searchQuery }}"</p>
        </div>
        <div v-if="categories.length === 0 && !loading" class="col-span-full card-surface p-12 text-center">
          <p class="text-text-muted">No services available yet. Check back later.</p>
        </div>
      </div>
    </div>

    <!-- STEP 2: Plan Selection (within category) -->
    <div v-else-if="selectedCategory && !selectedPlan" class="space-y-6">
      <!-- Category Header -->
      <div class="card-surface p-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <span class="text-2xl">{{ selectedCategory.icon }}</span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-text-primary">{{ selectedCategory.name }}</h3>
          <p class="text-sm text-text-muted">{{ selectedCategory.description }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-text-muted">Available Plans</p>
          <p class="text-lg font-bold text-accent">{{ selectedCategory.products.length }}</p>
        </div>
      </div>

      <!-- Plans Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="plan in selectedCategory.products"
          :key="plan.id"
          @click="selectPlan(plan)"
          class="card-surface p-6 flex flex-col transition-all hover:border-accent/30 cursor-pointer group"
        >
          <div class="flex-1 space-y-4">
            <!-- Plan Name & Description -->
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">{{ plan.name }}</h4>
                <span v-if="plan.isPopular" class="px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded-full uppercase">Popular</span>
              </div>
              <p v-if="plan.description" class="text-sm text-text-muted mt-1 line-clamp-2">{{ plan.description }}</p>
            </div>

            <!-- Specs Grid -->
            <div class="grid grid-cols-3 gap-2">
              <div class="p-3 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-1">RAM</p>
                <p class="text-sm font-bold text-text-primary">{{ formatRam(plan.ram) }}</p>
              </div>
              <div class="p-3 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-1">CPU</p>
                <p class="text-sm font-bold text-text-primary">{{ plan.cpu }}%</p>
              </div>
              <div class="p-3 bg-base/50 rounded-lg text-center border border-border">
                <p class="text-[9px] font-bold text-text-muted uppercase mb-1">Disk</p>
                <p class="text-sm font-bold text-text-primary">{{ formatDisk(plan.disk) }}</p>
              </div>
            </div>

            <!-- Additional Specs -->
            <div class="flex items-center gap-3 text-xs text-text-muted">
              <span v-if="plan.swap" class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {{ formatRam(plan.swap) }} Swap
              </span>
              <span v-if="plan.databases" class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
                {{ plan.databases }} DB
              </span>
              <span v-if="plan.backups" class="flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
                {{ plan.backups }} Backup
              </span>
            </div>

            <!-- Price & Duration -->
            <div class="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <span class="text-xl font-bold text-accent tabular-nums">{{ plan.coin_price }}</span>
                <span class="text-sm text-accent/70 ml-1">coins</span>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-text-muted">{{ plan.duration_days }} days</p>
                <p class="text-[10px] text-text-muted">{{ plan.duration_days }} day{{ plan.duration_days !== 1 ? 's' : '' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STEP 3: Egg Selection + Server Name -->
    <div v-else-if="selectedPlan && !serverCreated" class="space-y-6 max-w-3xl">
      <!-- Selected Plan Summary -->
      <div class="card-surface p-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <span class="text-xl">{{ selectedCategory.icon }}</span>
          </div>
          <div>
            <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Selected Plan</p>
            <p class="text-lg font-bold text-text-primary mt-0.5">{{ selectedPlan.name }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-lg font-bold text-accent">{{ selectedPlan.coin_price }} coins</p>
            <p class="text-xs text-text-muted">{{ selectedPlan.duration_days }} days</p>
          </div>
          <button @click="selectedPlan = null" class="text-xs font-bold text-accent hover:text-white transition-colors">Change</button>
        </div>
      </div>

      <!-- Egg Selection -->
      <div class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Select Software</h3>
          <p class="text-sm text-text-muted">Choose what you want to run on your server.</p>
        </div>

        <div v-if="loadingEggs" class="flex items-center gap-3 py-8">
          <div class="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-text-muted">Loading available options...</p>
        </div>

        <div v-else-if="eggs.length === 0" class="card-surface p-8 text-center">
          <p class="text-text-muted">No software options available for this plan.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="egg in eggs"
            :key="egg.id"
            type="button"
            @click="selectedEgg = egg"
            :class="[
              'card-surface p-5 text-left transition-all',
              selectedEgg?.id === egg.id ? 'border-accent/50 bg-accent/[0.05] ring-1 ring-accent/20' : 'hover:border-accent/30'
            ]"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm font-bold text-text-primary">{{ egg.attributes?.name || 'Egg #' + egg.id }}</p>
                <p v-if="egg.attributes?.description" class="text-xs text-text-muted mt-1 line-clamp-2">{{ egg.attributes.description }}</p>
              </div>
              <div v-if="selectedEgg?.id === egg.id" class="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 ml-3">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Server Name -->
      <div class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Server Name</h3>
          <p class="text-sm text-text-muted">Give your server a name. This will be visible in your panel.</p>
        </div>
        <div class="card-surface p-6 space-y-4">
          <div class="relative">
            <input
              id="serverName"
              v-model="serverName"
              type="text"
              required
              maxlength="100"
              class="input-field text-lg font-semibold py-3 pr-36"
              placeholder="e.g. my-minecraft-server"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted/40 pointer-events-none">-free-dash</span>
          </div>
          <div class="flex items-center gap-2 text-xs text-text-muted">
            <svg class="w-4 h-4 text-accent/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Your server will be accessible as: <span class="text-text-primary font-medium">{{ serverName || 'my-server' }}-free-dash</span></span>
          </div>
        </div>
      </div>

      <!-- Balance & Deploy -->
      <div class="card-surface p-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm text-text-muted">Your Balance</p>
              <p class="text-xl font-bold text-yellow-500 tabular-nums">{{ authStore.user?.coins || 0 }} coins</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="selectedPlan = null" class="btn-secondary px-6 py-2.5">Back</button>
            <button
              @click="deployServer"
              :disabled="deploying || !serverName || !selectedEgg || (selectedPlan.coin_price > (authStore.user?.coins || 0))"
              class="btn-primary px-8 py-2.5 flex items-center gap-2"
            >
              <svg v-if="deploying" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ deploying ? 'Deploying...' : 'Deploy Server' }}
            </button>
          </div>
        </div>
        <div v-if="selectedPlan.coin_price > (authStore.user?.coins || 0)" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-xs font-bold text-red-400 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Insufficient coins. You need {{ selectedPlan.coin_price - (authStore.user?.coins || 0) }} more coins.
          </p>
        </div>
      </div>
    </div>

    <!-- STEP 4: Success -->
    <div v-else-if="serverCreated" class="card-surface p-12 text-center space-y-6">
      <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
        <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 class="text-xl font-bold text-text-primary">Server Deployed! 🎉</h3>
        <p class="text-sm text-text-muted mt-2">
          Your server <span class="text-accent font-medium">{{ serverName }}-free-dash</span> is being created.
          <br/>It will appear in your servers list shortly.
        </p>
      </div>
      <div class="flex items-center justify-center gap-4">
        <router-link to="/servers" class="btn-primary px-6 py-2.5">View Servers</router-link>
        <router-link to="/home" class="btn-secondary px-6 py-2.5">Dashboard</router-link>
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
const searchQuery = ref('')

// Category metadata (icons, descriptions, tags)
const categoryMeta = {
  'Minecraft': {
    icon: '⛏️',
    description: 'Host your own Minecraft server with full control. Choose from Java, Bedrock, or modded versions.',
    tags: ['Java', 'Bedrock', 'Modded', 'Paper']
  },
  'Bot Hosting': {
    icon: '🤖',
    description: 'Deploy Discord bots, Telegram bots, or any Node.js/Python bot 24/7.',
    tags: ['Discord', 'Telegram', 'Node.js', 'Python']
  },
  'Game Servers': {
    icon: '🎮',
    description: 'Host game servers like Palworld, Valheim, Garry\'s Mod, and more.',
    tags: ['Valheim', 'Palworld', 'Garry\'s Mod']
  },
  'Web Hosting': {
    icon: '🌐',
    description: 'Host websites, APIs, and web applications with your own domain.',
    tags: ['PHP', 'Node.js', 'MySQL', 'cPanel']
  },
  'VPS': {
    icon: '🖥️',
    description: 'Get a virtual private server with root access for any project.',
    tags: ['Linux', 'Root Access', 'Full Control']
  },
  'Database': {
    icon: '🗄️',
    description: 'Managed database hosting for MySQL, PostgreSQL, MongoDB, and Redis.',
    tags: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis']
  }
}

const categories = computed(() => {
  const catMap = {}
  for (const p of products.value) {
    const catName = p.nest_name || 'Other'
    if (!catMap[catName]) {
      const meta = categoryMeta[catName] || {
        icon: '📦',
        description: 'Browse available hosting plans.',
        tags: []
      }
      catMap[catName] = { 
        name: catName, 
        products: [],
        icon: meta.icon,
        description: meta.description,
        tags: meta.tags,
        lowestPrice: Infinity
      }
    }
    catMap[catName].products.push(p)
    if (p.coin_price < catMap[catName].lowestPrice) {
      catMap[catName].lowestPrice = p.coin_price
    }
  }
  return Object.values(catMap)
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(cat => 
    cat.name.toLowerCase().includes(q) ||
    cat.description.toLowerCase().includes(q) ||
    cat.tags.some(t => t.toLowerCase().includes(q)) ||
    cat.products.some(p => p.name.toLowerCase().includes(q))
  )
})

const filteredProducts = computed(() => {
  if (!selectedCategory.value) return []
  return selectedCategory.value.products
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

function selectCategory(cat) {
  selectedCategory.value = cat
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
    const { data } = await client.get(`/products/nests/${plan.nest_id}/eggs`)
    eggs.value = Array.isArray(data) ? data : []
  } catch {
    error.value = 'Failed to load software options. Please try again.'
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
