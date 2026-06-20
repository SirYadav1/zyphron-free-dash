<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <button v-if="selectedCategory" @click="goBack" class="text-sm text-accent hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft :size="14" :stroke-width="2.5" /> Back
        </button>
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
      <AlertTriangle :size="16" :stroke-width="2.5" /> {{ error }}
    </div>
    <div v-if="success" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold flex items-center gap-3">
      <CheckCircle :size="16" :stroke-width="2.5" /> {{ success }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading services...</p>
    </div>

    <!-- STEP 1: Category Selection -->
    <div v-else-if="!selectedCategory" class="space-y-8">
      <!-- Search Bar -->
      <div class="card-surface p-4 flex items-center gap-3">
        <Search :size="18" :stroke-width="2" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search services..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="text-text-muted hover:text-text-primary transition-colors">
          <X :size="16" :stroke-width="2" />
        </button>
      </div>

      <!-- Category Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="(cat, index) in filteredCategories"
          :key="cat.id"
          @click="selectCategory(cat)"
          class="stagger-item card-surface flex flex-col cursor-pointer transition-all hover:border-accent/30 hover:bg-accent/[0.02] group relative overflow-hidden"
          :style="{ animationDelay: (index * 0.08) + 's' }"
        >
          <!-- Background Glow -->
          <div class="absolute -top-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all duration-500"></div>

          <!-- Banner Image -->
          <div class="relative w-full h-44 overflow-hidden">
            <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-surface flex items-center justify-center">
              <Package :size="40" :stroke-width="1.5" class="text-accent/60" />
            </div>
            <!-- Gradient fade overlay -->
            <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent"></div>
          </div>

          <!-- Content -->
          <div class="relative flex-1 p-6 pt-2 space-y-4">
            <!-- Info -->
            <div class="space-y-1.5">
              <h3 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{{ cat.name }}</h3>
              <p class="text-sm text-text-muted leading-relaxed line-clamp-2">{{ cat.description || 'Browse available plans' }}</p>
            </div>

            <!-- Stats -->
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5">
                <div class="w-1.5 h-1.5 rounded-full bg-accent/60"></div>
                <span class="text-xs font-medium text-text-muted">{{ cat.product_count || cat.productCount || 0 }} plan{{ (cat.product_count || cat.productCount || 0) !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>

          <!-- Arrow -->
          <div class="relative px-6 pb-5 flex items-center justify-end">
            <ChevronRight :size="18" :stroke-width="2" class="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredCategories.length === 0 && searchQuery" class="col-span-full card-surface p-12 text-center">
          <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <SearchX :size="28" :stroke-width="1.5" class="text-text-muted" />
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
      <div class="card-surface overflow-hidden flex flex-col sm:flex-row items-stretch">
        <!-- Banner image strip -->
        <div class="relative w-full sm:w-40 h-28 sm:h-auto shrink-0 overflow-hidden">
          <img v-if="selectedCategory.image_url" :src="selectedCategory.image_url" :alt="selectedCategory.name" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-surface flex items-center justify-center">
            <Package :size="32" :stroke-width="1.5" class="text-accent/60" />
          </div>
          <!-- Fade overlay (right edge on desktop, bottom on mobile) -->
          <div class="absolute inset-0 sm:bg-gradient-to-r sm:from-transparent sm:to-surface bg-gradient-to-t from-surface to-transparent"></div>
        </div>
        <div class="flex-1 p-5 sm:p-6">
          <h3 class="text-lg font-bold text-text-primary">{{ selectedCategory.name }}</h3>
          <p class="text-sm text-text-muted">{{ selectedCategory.description || 'Browse available plans' }}</p>
        </div>
        <div class="text-right p-5 sm:p-6 sm:pl-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
          <p class="text-xs text-text-muted">Available Plans</p>
          <p class="text-lg font-bold text-accent">{{ categoryProducts.length }}</p>
        </div>
      </div>

      <!-- Loading Products -->
      <div v-if="loadingProducts" class="flex items-center justify-center py-12">
        <div class="loading-spinner"></div>
      </div>

      <!-- Plans Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(plan, index) in categoryProducts"
          :key="plan.id"
          @click="selectPlan(plan)"
          class="stagger-item card-surface p-6 flex flex-col transition-all hover:border-accent/30 cursor-pointer group"
          :style="{ animationDelay: (index * 0.06) + 's' }"
        >
          <div class="flex-1 space-y-4">
            <!-- Plan Name & Description -->
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-text-primary text-lg group-hover:text-accent transition-colors">{{ plan.name }}</h4>
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
                <RefreshCw :size="12" :stroke-width="2" />
                {{ formatRam(plan.swap) }} Swap
              </span>
              <span v-if="plan.databases" class="flex items-center gap-1">
                <Database :size="12" :stroke-width="2" />
                {{ plan.databases }} DB
              </span>
              <span v-if="plan.backups" class="flex items-center gap-1">
                <HardDrive :size="12" :stroke-width="2" />
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

        <!-- Empty Products -->
        <div v-if="categoryProducts.length === 0 && !loadingProducts" class="col-span-full card-surface p-12 text-center">
          <p class="text-text-muted">No plans available in this category yet.</p>
        </div>
      </div>
    </div>

    <!-- STEP 3: Egg Selection + Server Name -->
    <div v-else-if="selectedPlan && !serverCreated" class="space-y-6 max-w-3xl">
      <!-- Selected Plan Summary -->
      <div class="card-surface p-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Package :size="18" :stroke-width="2" class="text-accent" />
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

      <!-- Egg Selection (only shown when plan has neutral egg) -->
      <div v-if="!selectedPlan.egg_id" class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Select Software</h3>
          <p class="text-sm text-text-muted">Choose what you want to run on your server.</p>
        </div>

        <div v-if="loadingEggs" class="flex items-center gap-3 py-8">
          <div class="loading-spinner" style="width:20px;height:20px;border-width:2px;"></div>
          <p class="text-sm text-text-muted">Loading available options...</p>
        </div>

        <div v-else-if="eggs.length === 0" class="card-surface p-8 text-center">
          <p class="text-text-muted">No software options available for this plan.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="egg in eggs"
            :key="egg.attributes?.id || egg.id"
            type="button"
            @click="selectedEgg = egg"
            :class="[
              'card-surface p-5 text-left transition-all duration-200',
              selectedEgg?.attributes?.id === (egg.attributes?.id || egg.id) ? 'border-accent/50 bg-accent/[0.05] ring-1 ring-accent/20' : 'hover:border-accent/30'
            ]"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <p class="text-sm font-bold text-text-primary">{{ egg.attributes?.name || 'Egg #' + egg.id }}</p>
                <p v-if="egg.attributes?.description" class="text-xs text-text-muted mt-1 line-clamp-2">{{ egg.attributes.description }}</p>
              </div>
              <div v-if="selectedEgg?.attributes?.id === (egg.attributes?.id || egg.id)" class="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0 ml-3">
                <Check :size="12" :stroke-width="3" class="text-white" />
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Auto-selected egg info (when plan has specific egg) -->
      <div v-else class="card-surface p-4 border-accent/20 bg-accent/5">
        <div class="flex items-center gap-3">
          <Check :size="16" :stroke-width="2.5" class="text-accent" />
          <div>
            <p class="text-xs font-bold text-text-primary">Software: <span class="text-accent">{{ selectedEgg?.attributes?.name || selectedPlan.egg_name }}</span></p>
            <p class="text-[10px] text-text-muted">Pre-configured by admin</p>
          </div>
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
            <Info :size="14" :stroke-width="2" class="text-accent/60 shrink-0" />
            <span>Your server will be accessible as: <span class="text-text-primary font-medium">{{ serverName || 'my-server' }}-free-dash</span></span>
          </div>
        </div>
      </div>

      <!-- Balance & Deploy -->
      <div class="card-surface p-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Coins :size="24" :stroke-width="2" />
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
              <Loader2 v-if="deploying" :size="16" :stroke-width="2" class="animate-spin" />
              <Rocket v-else :size="16" :stroke-width="2" />
              {{ deploying ? 'Deploying...' : 'Deploy Server' }}
            </button>
          </div>
        </div>
        <div v-if="selectedPlan.coin_price > (authStore.user?.coins || 0)" class="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p class="text-xs font-bold text-red-400 flex items-center gap-2">
            <AlertTriangle :size="16" :stroke-width="2" />
            Insufficient coins. You need {{ selectedPlan.coin_price - (authStore.user?.coins || 0) }} more coins.
          </p>
        </div>
      </div>
    </div>

    <!-- STEP 4: Success -->
    <div v-else-if="serverCreated" class="card-surface p-12 text-center space-y-6" style="animation: scaleIn 0.5s ease-out both;">
      <div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
        <CheckCircle2 :size="32" :stroke-width="1.5" class="text-green-500" />
      </div>
      <div>
        <h3 class="text-xl font-bold text-text-primary">Server Deployed!</h3>
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
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Search,
  X,
  Package,
  ChevronRight,
  SearchX,
  RefreshCw,
  Database,
  HardDrive,
  Check,
  Info,
  Coins,
  Loader2,
  Rocket,
  CheckCircle2,
} from 'lucide-vue-next'

const serversStore = useServersStore()
const authStore = useAuthStore()

const loading = ref(true)
const loadingEggs = ref(false)
const loadingProducts = ref(false)
const error = ref('')
const success = ref('')
const categories = ref([])
const categoryProducts = ref([])
const eggs = ref([])
const selectedCategory = ref(null)
const selectedPlan = ref(null)
const selectedEgg = ref(null)
const serverName = ref('')
const deploying = ref(false)
const serverCreated = ref(false)
const searchQuery = ref('')

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(cat =>
    cat.name.toLowerCase().includes(q) ||
    (cat.description && cat.description.toLowerCase().includes(q))
  )
})

onMounted(async () => {
  try {
    const [catRes] = await Promise.all([
      client.get('/categories'),
      authStore.fetchProfile().catch(() => {})
    ])
    categories.value = Array.isArray(catRes.data) ? catRes.data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load services'
  } finally {
    loading.value = false
  }
})

async function selectCategory(cat) {
  selectedCategory.value = cat
  selectedPlan.value = null
  selectedEgg.value = null
  loadingProducts.value = true
  categoryProducts.value = []

  try {
    const { data } = await client.get(`/categories/${cat.id}/products`)
    categoryProducts.value = Array.isArray(data) ? data : []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load plans'
  } finally {
    loadingProducts.value = false
  }
}

function selectPlan(plan) {
  selectedPlan.value = plan
  selectedEgg.value = null

  if (plan.egg_id) {
    // Plan has a specific egg — auto-select it, skip egg selection
    selectedEgg.value = { id: plan.egg_id, attributes: { name: plan.egg_name || 'Egg #' + plan.egg_id } }
  } else {
    // Neutral egg — load available eggs for user to choose
    loadEggs(plan)
  }
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
  } else {
    selectedCategory.value = null
    categoryProducts.value = []
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
    await serversStore.createServer(serverName.value, selectedPlan.value.id, {
      eggId: selectedEgg.value.attributes?.id || selectedEgg.value.id,
      nestId: selectedPlan.value.nest_id
    })
    await authStore.fetchProfile()
    serverCreated.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create server'
  } finally {
    deploying.value = false
  }
}
</script>
