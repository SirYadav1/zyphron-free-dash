<template>
  <div class="min-h-screen bg-base relative overflow-hidden">
    <!-- Background Decorations -->
    <div class="absolute top-20 right-20 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 left-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl"></div>
    <div class="absolute top-1/2 right-1/4 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl"></div>

    <div class="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
      <!-- Back Button -->
      <button
        v-if="selectedCategory"
        @click="goBack"
        class="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-accent transition-colors"
      >
        <ArrowLeft :size="16" :stroke-width="2" />
        Back
      </button>

      <!-- Feedback Messages -->
      <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 flex items-center gap-3">
        <AlertTriangle :size="16" :stroke-width="2.5" /> {{ error }}
      </div>
      <div v-if="success" class="p-4 bg-accent/10 border border-accent/20 rounded-xl text-sm font-bold text-accent flex items-center gap-3">
        <CheckCircle :size="16" :stroke-width="2.5" /> {{ success }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
        <div class="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading services...</p>
      </div>

      <!-- STEP 1: Category Selection -->
      <div v-if="!loading && !selectedCategory" class="space-y-8">
        <!-- Search Bar -->
        <div class="bg-[#1e293b] border border-border/50 rounded-xl p-4 flex items-center gap-3">
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
            class="bg-[#1e293b] border border-border/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 group"
            :style="{ animationDelay: (index * 0.08) + 's' }"
          >
            <!-- Banner Image -->
            <div class="relative w-full h-44 overflow-hidden">
              <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-[#1e293b] flex items-center justify-center">
                <Package :size="40" :stroke-width="1.5" class="text-accent/60" />
              </div>
              <!-- Gradient fade overlay -->
              <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1e293b] to-transparent"></div>
            </div>

            <!-- Content -->
            <div class="p-6 pt-2 space-y-4">
              <div class="space-y-1.5">
                <h3 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{{ cat.name }}</h3>
                <p class="text-sm text-text-muted leading-relaxed line-clamp-2">{{ cat.description || 'Browse available plans' }}</p>
              </div>

              <!-- Stats -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <div class="w-1.5 h-1.5 rounded-full bg-accent/60"></div>
                  <span class="text-xs font-medium text-text-muted">{{ cat.product_count || cat.productCount || 0 }} plan{{ (cat.product_count || cat.productCount || 0) !== 1 ? 's' : '' }}</span>
                </div>
                <ChevronRight :size="18" :stroke-width="2" class="text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </div>
          </div>

          <!-- Empty States -->
          <div v-if="filteredCategories.length === 0 && searchQuery" class="col-span-full p-12 text-center bg-[#1e293b] border border-border/50 rounded-2xl">
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <SearchX :size="28" :stroke-width="1.5" class="text-text-muted" />
            </div>
            <p class="text-text-muted">No services match "{{ searchQuery }}"</p>
          </div>
          <div v-if="categories.length === 0 && !loading" class="col-span-full p-12 text-center bg-[#1e293b] border border-border/50 rounded-2xl">
            <p class="text-text-muted">No services available yet. Check back later.</p>
          </div>
        </div>
      </div>

      <!-- STEP 2: Plan Selection (within category) -->
      <div v-if="!loading && selectedCategory && !selectedPlan" class="space-y-8">
        <!-- Category Banner -->
        <div class="bg-[#1e293b] border border-border/50 rounded-2xl overflow-hidden flex flex-col sm:flex-row">
          <!-- Banner Image -->
          <div class="relative w-full sm:w-64 h-40 sm:h-auto shrink-0 overflow-hidden">
            <img v-if="selectedCategory.image_url" :src="selectedCategory.image_url" :alt="selectedCategory.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 via-accent/10 to-[#1e293b] flex items-center justify-center">
              <Package :size="40" :stroke-width="1.5" class="text-accent/60" />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#1e293b] to-transparent"></div>
          </div>

          <!-- Content -->
          <div class="flex-1 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-2">
              <h2 class="text-2xl font-bold text-text-primary">{{ selectedCategory.name }}</h2>
              <p class="text-sm text-text-muted">{{ selectedCategory.description || 'Choose a plan that best fits your requirements.' }}</p>
            </div>
            <div class="text-left sm:text-right">
              <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Available Plans</p>
              <p class="text-2xl font-bold text-accent mt-1">[ {{ categoryProducts.length }} ]</p>
            </div>
          </div>
        </div>

        <!-- Loading Products -->
        <div v-if="loadingProducts" class="flex items-center justify-center py-12">
          <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Plans Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="(plan, index) in categoryProducts"
            :key="plan.id"
            @click="selectPlan(plan)"
            class="bg-[#1e293b] border border-border/50 rounded-2xl p-6 transition-all cursor-pointer group hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5"
            :style="{ animationDelay: (index * 0.06) + 's' }"
          >
            <!-- Plan Header -->
            <div class="text-center mb-5">
              <h4 class="text-xl font-bold text-text-primary group-hover:text-accent transition-colors">{{ plan.name }}</h4>
              <p v-if="plan.description" class="text-sm text-text-muted mt-1">{{ plan.description }}</p>
            </div>

            <!-- Specs Grid -->
            <div class="grid grid-cols-3 gap-3 mb-5">
              <div class="bg-[#0f172a] rounded-xl p-4 text-center border border-border/30">
                <div class="flex items-center justify-center gap-1.5 mb-2">
                  <MemoryStick :size="14" :stroke-width="2" class="text-accent/70" />
                  <span class="text-[10px] font-bold text-text-muted uppercase">RAM</span>
                </div>
                <p class="text-lg font-bold text-text-primary">{{ formatRam(plan.ram) }}</p>
              </div>
              <div class="bg-[#0f172a] rounded-xl p-4 text-center border border-border/30">
                <div class="flex items-center justify-center gap-1.5 mb-2">
                  <Cpu :size="14" :stroke-width="2" class="text-accent/70" />
                  <span class="text-[10px] font-bold text-text-muted uppercase">CPU</span>
                </div>
                <p class="text-lg font-bold text-text-primary">{{ plan.cpu }}%</p>
              </div>
              <div class="bg-[#0f172a] rounded-xl p-4 text-center border border-border/30">
                <div class="flex items-center justify-center gap-1.5 mb-2">
                  <HardDrive :size="14" :stroke-width="2" class="text-accent/70" />
                  <span class="text-[10px] font-bold text-text-muted uppercase">DISK</span>
                </div>
                <p class="text-lg font-bold text-text-primary">{{ formatDisk(plan.disk) }}</p>
              </div>
            </div>

            <!-- Additional Info -->
            <div class="flex items-center justify-center gap-4 text-xs text-text-muted mb-5">
              <span class="flex items-center gap-1.5">
                <Database :size="12" :stroke-width="2" />
                {{ plan.databases || 0 }} DB
              </span>
              <span class="flex items-center gap-1.5">
                <HardDrive :size="12" :stroke-width="2" />
                {{ plan.backups || 0 }} Backup
              </span>
              <span class="flex items-center gap-1.5">
                <Clock :size="12" :stroke-width="2" />
                {{ plan.duration_days }} days history
              </span>
            </div>

            <!-- Price & Select Button -->
            <div class="flex items-center justify-between pt-5 border-t border-border/30">
              <div class="flex items-center gap-2">
                <Coins :size="18" :stroke-width="2" class="text-yellow-500" />
                <span class="text-2xl font-bold text-text-primary">{{ plan.coin_price }}</span>
                <span class="text-sm text-text-muted">coins</span>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-right">
                  <p class="text-[10px] font-bold text-text-muted uppercase">Duration</p>
                  <p class="text-sm font-bold text-text-primary">{{ plan.duration_days }} days</p>
                </div>
                <button class="px-5 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2">
                  Select Plan
                  <CheckCircle :size="14" :stroke-width="2.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty Products -->
          <div v-if="categoryProducts.length === 0 && !loadingProducts" class="col-span-full p-12 text-center bg-[#1e293b] border border-border/50 rounded-2xl">
            <p class="text-text-muted">No plans available in this category yet.</p>
          </div>
        </div>
      </div>

      <!-- STEP 3: Egg Selection + Server Name + Deploy -->
      <div v-if="!loading && selectedPlan && !serverCreated" class="space-y-6 max-w-3xl">
        <!-- Selected Plan Summary -->
        <div class="bg-[#1e293b] border border-border/50 rounded-2xl p-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Package :size="20" :stroke-width="2" class="text-accent" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-text-muted uppercase tracking-widest">Selected Plan</p>
              <p class="text-xl font-bold text-text-primary mt-0.5">{{ selectedPlan.name }}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-xl font-bold text-accent">{{ selectedPlan.coin_price }} coins</p>
              <p class="text-xs text-text-muted">{{ selectedPlan.duration_days }} days</p>
            </div>
            <button @click="selectedPlan = null" class="text-xs font-bold text-accent hover:text-white transition-colors">Change</button>
          </div>
        </div>

        <!-- Egg Selection (neutral egg) -->
        <div v-if="!selectedPlan.egg_id" class="space-y-4">
          <div class="space-y-1">
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Select Software</h3>
            <p class="text-sm text-text-muted">Choose what you want to run on your server.</p>
          </div>

          <div v-if="loadingEggs" class="flex items-center gap-3 py-8">
            <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-text-muted">Loading available options...</p>
          </div>

          <div v-else-if="eggs.length === 0" class="bg-[#1e293b] border border-border/50 rounded-2xl p-8 text-center">
            <p class="text-text-muted">No software options available for this plan.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="egg in eggs"
              :key="egg.attributes?.id || egg.id"
              type="button"
              @click="selectedEgg = egg"
              :class="[
                'bg-[#1e293b] border rounded-xl p-5 text-left transition-all duration-200',
                selectedEgg?.attributes?.id === (egg.attributes?.id || egg.id) 
                  ? 'border-accent/50 bg-accent/[0.05] ring-1 ring-accent/20' 
                  : 'border-border/50 hover:border-accent/30'
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

        <!-- Auto-selected egg info -->
        <div v-else class="bg-accent/5 border border-accent/20 rounded-2xl p-4">
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
          <div class="bg-[#1e293b] border border-border/50 rounded-2xl p-6 space-y-4">
            <div class="relative">
              <input
                id="serverName"
                v-model="serverName"
                type="text"
                required
                maxlength="100"
                class="w-full bg-[#0f172a] border border-border/50 rounded-xl px-4 py-3 text-lg font-semibold text-text-primary placeholder-text-muted/50 outline-none focus:border-accent/50 transition-colors pr-36"
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
        <div class="bg-[#1e293b] border border-border/50 rounded-2xl p-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Coins :size="24" :stroke-width="2" class="text-yellow-500" />
              </div>
              <div>
                <p class="text-sm text-text-muted">Your Balance</p>
                <p class="text-xl font-bold text-yellow-500 tabular-nums">{{ authStore.user?.coins || 0 }} coins</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button @click="selectedPlan = null" class="px-6 py-2.5 border border-border/50 rounded-xl text-sm font-bold text-text-muted hover:text-text-primary hover:border-accent/30 transition-all">
                Back
              </button>
              <button
                @click="deployServer"
                :disabled="deploying || !serverName || !selectedEgg || (selectedPlan.coin_price > (authStore.user?.coins || 0))"
                class="px-8 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2"
              >
                <Loader2 v-if="deploying" :size="16" :stroke-width="2" class="animate-spin" />
                <Rocket v-else :size="16" :stroke-width="2" />
                {{ deploying ? 'Deploying...' : 'Deploy Server' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 4: Success -->
      <div v-if="serverCreated" class="max-w-2xl mx-auto text-center py-12 space-y-6">
        <div class="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
          <CheckCircle :size="40" :stroke-width="2" class="text-accent" />
        </div>
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-text-primary">Server Created!</h2>
          <p class="text-text-muted">Your server is being installed. This may take a few minutes.</p>
        </div>
        <router-link to="/servers" class="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all">
          <Server :size="16" :stroke-width="2" />
          Go to Servers
        </router-link>
      </div>
    </div>

    <!-- Deploy Popup -->
    <div v-if="deploying" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div class="bg-[#1e293b] border border-border/50 rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-6 shadow-2xl">
        <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold text-text-primary">Installing Server</h3>
          <p class="text-sm text-text-muted">Your server is being set up. This may take a few minutes...</p>
        </div>
        <div class="w-full bg-[#0f172a] rounded-full h-2 overflow-hidden">
          <div class="h-full bg-accent rounded-full animate-pulse" style="width: 60%"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  ArrowLeft,
  Search,
  X,
  SearchX,
  Package,
  ChevronRight,
  Check,
  CheckCircle,
  AlertTriangle,
  MemoryStick,
  Cpu,
  HardDrive,
  Database,
  Clock,
  Coins,
  Info,
  Loader2,
  Rocket,
  Server,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const loadingProducts = ref(false)
const loadingEggs = ref(false)
const error = ref('')
const success = ref('')
const searchQuery = ref('')
const categories = ref([])
const selectedCategory = ref(null)
const categoryProducts = ref([])
const selectedPlan = ref(null)
const eggs = ref([])
const selectedEgg = ref(null)
const serverName = ref('')
const deploying = ref(false)
const serverCreated = ref(false)

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(c => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
})

function formatRam(mb) {
  if (!mb) return '0 MB'
  if (mb >= 1024) return (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (!mb) return '0 MB'
  if (mb >= 1024) return (mb / 1024).toFixed(0) + ' GB'
  return mb + ' MB'
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

async function selectCategory(cat) {
  selectedCategory.value = cat
  loadingProducts.value = true
  try {
    const { data } = await client.get(`/categories/${cat.id}/products`)
    categoryProducts.value = Array.isArray(data) ? data : []
  } catch {
    categoryProducts.value = []
  } finally {
    loadingProducts.value = false
  }
}

async function selectPlan(plan) {
  selectedPlan.value = plan
  selectedEgg.value = null
  
  if (!plan.egg_id) {
    loadingEggs.value = true
    try {
      const nestId = plan.nest_id
      if (nestId) {
        const { data } = await client.get(`/products/nests/${nestId}/eggs`)
        eggs.value = Array.isArray(data) ? data : []
      }
    } catch {
      eggs.value = []
    } finally {
      loadingEggs.value = false
    }
  } else {
    selectedEgg.value = { id: plan.egg_id, attributes: { id: plan.egg_id, name: plan.egg_name || 'Egg' } }
  }
}

async function deployServer() {
  if (!serverName.value || !selectedPlan.value) return
  deploying.value = true
  error.value = ''
  
  try {
    const payload = {
      serverName: serverName.value,
      productId: selectedPlan.value.id,
    }
    if (selectedEgg.value) {
      payload.eggId = selectedEgg.value.attributes?.id || selectedEgg.value.id
      payload.nestId = selectedPlan.value.nest_id
    }
    
    await client.post('/servers', payload)
    serverCreated.value = true
    await authStore.fetchProfile()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create server. Please try again.'
  } finally {
    deploying.value = false
  }
}

onMounted(async () => {
  try {
    const { data } = await client.get('/categories')
    categories.value = Array.isArray(data) ? data : []
    
    if (route.query.category) {
      const cat = categories.value.find(c => c.id === Number(route.query.category))
      if (cat) await selectCategory(cat)
    }
  } catch {
    error.value = 'Failed to load services.'
  } finally {
    loading.value = false
  }
})
</script>
