<template>
  <div class="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
    <!-- Background Decorations -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-accent/[0.02] rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-accent/[0.02] rounded-full blur-3xl"></div>

    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <!-- Back Button -->
      <button
        v-if="selectedCategory"
        @click="goBack"
        class="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft :size="18" :stroke-width="2.5" />
        Back
      </button>

      <!-- Error/Success -->
      <div v-if="error" class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold text-red-400 flex items-center gap-3">
        <AlertTriangle :size="16" /> {{ error }}
      </div>
      <div v-if="success" class="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-sm font-bold text-green-400 flex items-center gap-3">
        <CheckCircle :size="16" /> {{ success }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-32 gap-4">
        <div class="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading services...</p>
      </div>

      <!-- ==================== STEP 1: Categories ==================== -->
      <div v-if="!loading && !selectedCategory" class="space-y-8">
        <!-- Search -->
        <div class="relative max-w-md">
          <Search :size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search services..."
            class="w-full bg-[#12121a] border border-white/5 rounded-xl pl-11 pr-10 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/40 transition-colors"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X :size="16" />
          </button>
        </div>

        <!-- Category Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="(cat, index) in filteredCategories"
            :key="cat.id"
            @click="selectCategory(cat)"
            class="group bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1"
          >
            <!-- Banner -->
            <div class="relative h-48 overflow-hidden">
              <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 to-[#12121a] flex items-center justify-center">
                <Package :size="48" class="text-accent/40" />
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/20 to-transparent"></div>
              <!-- Plan Count Badge -->
              <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
                <span class="text-[10px] font-bold text-gray-400 uppercase">{{ cat.product_count || 0 }} Plans</span>
              </div>
            </div>

            <!-- Content -->
            <div class="p-6 -mt-8 relative">
              <h3 class="text-xl font-bold text-white group-hover:text-accent transition-colors mb-2">{{ cat.name }}</h3>
              <p class="text-sm text-gray-400 leading-relaxed line-clamp-2">{{ cat.description || 'Browse available hosting plans' }}</p>
              <div class="mt-4 flex items-center gap-2 text-accent text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                View Plans
                <ChevronRight :size="16" class="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="filteredCategories.length === 0" class="col-span-full py-20 text-center">
            <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <SearchX :size="28" class="text-gray-500" />
            </div>
            <p class="text-gray-400">No services found{{ searchQuery ? ` for "${searchQuery}"` : '' }}</p>
          </div>
        </div>
      </div>

      <!-- ==================== STEP 2: Plans ==================== -->
      <div v-if="!loading && selectedCategory && !selectedPlan" class="space-y-8">
        <!-- Category Banner -->
        <div class="relative bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden">
          <div class="relative h-48 sm:h-56 overflow-hidden">
            <img v-if="selectedCategory.image_url" :src="selectedCategory.image_url" :alt="selectedCategory.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gradient-to-br from-accent/20 to-[#12121a] flex items-center justify-center">
              <Package :size="56" class="text-accent/40" />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#12121a] via-[#12121a]/40 to-transparent"></div>
            <!-- Overlay Content -->
            <div class="absolute inset-0 flex items-end p-6 sm:p-8">
              <div class="flex-1">
                <h2 class="text-3xl sm:text-4xl font-bold text-white mb-2">{{ selectedCategory.name }}</h2>
                <p class="text-sm text-gray-300 max-w-xl">{{ selectedCategory.description || 'Choose a plan that best fits your requirements.' }}</p>
              </div>
              <div class="hidden sm:block text-right">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Plans</p>
                <p class="text-4xl font-bold text-accent">[ {{ categoryProducts.length }} ]</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingProducts" class="flex items-center justify-center py-16">
          <div class="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>

        <!-- Plans Grid -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            v-for="(plan, index) in categoryProducts"
            :key="plan.id"
            @click="selectPlan(plan)"
            class="group bg-[#12121a] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 hover:-translate-y-1 cursor-pointer"
          >
            <!-- Plan Header -->
            <div class="p-6 pb-4 text-center border-b border-white/5">
              <h4 class="text-2xl font-bold text-white group-hover:text-accent transition-colors">{{ plan.name }}</h4>
              <p v-if="plan.description" class="text-sm text-gray-400 mt-1">{{ plan.description }}</p>
            </div>

            <!-- Specs -->
            <div class="p-6 space-y-5">
              <!-- RAM / CPU / Disk -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-[#0a0a0f] rounded-xl p-4 text-center border border-white/5">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <MemoryStick :size="14" class="text-accent" />
                    <span class="text-[10px] font-bold text-gray-500 uppercase">RAM</span>
                  </div>
                  <p class="text-xl font-bold text-white">{{ formatRam(plan.ram) }}</p>
                </div>
                <div class="bg-[#0a0a0f] rounded-xl p-4 text-center border border-white/5">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <Cpu :size="14" class="text-accent" />
                    <span class="text-[10px] font-bold text-gray-500 uppercase">CPU</span>
                  </div>
                  <p class="text-xl font-bold text-white">{{ plan.cpu }}%</p>
                </div>
                <div class="bg-[#0a0a0f] rounded-xl p-4 text-center border border-white/5">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <HardDrive :size="14" class="text-accent" />
                    <span class="text-[10px] font-bold text-gray-500 uppercase">DISK</span>
                  </div>
                  <p class="text-xl font-bold text-white">{{ formatDisk(plan.disk) }}</p>
                </div>
              </div>

              <!-- Additional Specs -->
              <div class="flex items-center justify-center gap-6 text-xs text-gray-400">
                <span class="flex items-center gap-1.5">
                  <Database :size="12" />
                  {{ plan.databases || 0 }} DB
                </span>
                <span class="flex items-center gap-1.5">
                  <HardDrive :size="12" />
                  {{ plan.backups || 0 }} Backup
                </span>
                <span class="flex items-center gap-1.5">
                  <Clock :size="12" />
                  {{ plan.duration_days }} days history
                </span>
              </div>

              <!-- Price + Select -->
              <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="flex items-center gap-2">
                  <Coins :size="20" class="text-yellow-500" />
                  <span class="text-3xl font-bold text-white">{{ plan.coin_price }}</span>
                  <span class="text-sm text-gray-400">coins</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-400">{{ plan.duration_days }} days</span>
                  <button class="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2">
                    Select Plan
                    <CheckCircle :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="categoryProducts.length === 0 && !loadingProducts" class="col-span-full py-16 text-center bg-[#12121a] border border-white/5 rounded-2xl">
            <p class="text-gray-400">No plans available in this category yet.</p>
          </div>
        </div>
      </div>

      <!-- ==================== STEP 3: Configure + Deploy ==================== -->
      <div v-if="!loading && selectedPlan && !serverCreated" class="space-y-6 max-w-3xl mx-auto">
        <!-- Selected Plan Card -->
        <div class="bg-[#12121a] border border-accent/20 rounded-2xl p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center">
                <Package :size="24" class="text-accent" />
              </div>
              <div>
                <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected Plan</p>
                <p class="text-2xl font-bold text-white mt-0.5">{{ selectedPlan.name }}</p>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="text-right">
                <p class="text-2xl font-bold text-accent">{{ selectedPlan.coin_price }} <span class="text-sm text-gray-400">coins</span></p>
                <p class="text-xs text-gray-500">{{ selectedPlan.duration_days }} days</p>
              </div>
              <button @click="selectedPlan = null; selectedEgg = null" class="text-sm font-bold text-accent hover:text-white transition-colors">Change</button>
            </div>
          </div>
        </div>

        <!-- Egg Selection (neutral) -->
        <div v-if="!selectedPlan.egg_id" class="space-y-4">
          <h3 class="text-lg font-bold text-white">Select Software</h3>
          
          <div v-if="loadingEggs" class="flex items-center gap-3 py-8">
            <div class="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p class="text-sm text-gray-400">Loading options...</p>
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              v-for="egg in eggs"
              :key="egg.attributes?.id"
              @click="selectedEgg = egg"
              :class="[
                'p-5 rounded-xl border text-left transition-all duration-200',
                selectedEgg?.attributes?.id === egg.attributes?.id
                  ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/20'
                  : 'bg-[#12121a] border-white/5 hover:border-accent/20'
              ]"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-bold text-white">{{ egg.attributes?.name }}</p>
                  <p v-if="egg.attributes?.description" class="text-xs text-gray-400 mt-1 line-clamp-1">{{ egg.attributes.description }}</p>
                </div>
                <Check v-if="selectedEgg?.attributes?.id === egg.attributes?.id" :size="18" class="text-accent" />
              </div>
            </button>
          </div>
        </div>

        <!-- Auto egg -->
        <div v-else class="bg-accent/5 border border-accent/20 rounded-xl p-4 flex items-center gap-3">
          <Check :size="16" class="text-accent" />
          <div>
            <p class="text-sm font-bold text-white">Software: <span class="text-accent">{{ selectedEgg?.attributes?.name || selectedPlan.egg_name }}</span></p>
            <p class="text-xs text-gray-500">Pre-configured by admin</p>
          </div>
        </div>

        <!-- Server Name -->
        <div class="space-y-3">
          <h3 class="text-lg font-bold text-white">Server Name</h3>
          <div class="bg-[#12121a] border border-white/5 rounded-xl p-5">
            <div class="relative">
              <input
                v-model="serverName"
                type="text"
                maxlength="100"
                class="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-lg font-semibold text-white placeholder-gray-600 outline-none focus:border-accent/40 transition-colors pr-32"
                placeholder="my-minecraft-server"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-600 pointer-events-none">-free-dash</span>
            </div>
            <p class="text-xs text-gray-500 mt-3 flex items-center gap-1.5">
              <Info :size="12" />
              Server will be: <span class="text-white font-medium">{{ serverName || 'my-server' }}-free-dash</span>
            </p>
          </div>
        </div>

        <!-- Balance + Deploy -->
        <div class="bg-[#12121a] border border-white/5 rounded-2xl p-6">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Coins :size="28" class="text-yellow-500" />
              </div>
              <div>
                <p class="text-sm text-gray-400">Your Balance</p>
                <p class="text-2xl font-bold text-yellow-500">{{ authStore.user?.coins || 0 }} coins</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button @click="selectedPlan = null" class="px-6 py-3 border border-white/10 rounded-xl text-sm font-bold text-gray-400 hover:text-white hover:border-white/20 transition-all">
                Back
              </button>
              <button
                @click="deployServer"
                :disabled="deploying || !serverName || !selectedEgg || (selectedPlan.coin_price > (authStore.user?.coins || 0))"
                class="px-8 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-accent/20 flex items-center gap-2"
              >
                <Loader2 v-if="deploying" :size="16" class="animate-spin" />
                <Rocket v-else :size="16" />
                {{ deploying ? 'Deploying...' : 'Deploy Server' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== STEP 4: Success ==================== -->
      <div v-if="serverCreated" class="max-w-lg mx-auto text-center py-20 space-y-6">
        <div class="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle :size="48" class="text-green-500" />
        </div>
        <div class="space-y-2">
          <h2 class="text-3xl font-bold text-white">Server Created!</h2>
          <p class="text-gray-400">Your server is being installed. You'll receive an email when it's ready.</p>
        </div>
        <router-link to="/servers" class="inline-flex items-center gap-2 px-8 py-3 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl transition-all">
          <Server :size="16" />
          Go to Servers
        </router-link>
      </div>
    </div>

    <!-- Deploy Popup -->
    <div v-if="deploying" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-[#12121a] border border-white/10 rounded-2xl p-10 max-w-sm w-full mx-4 text-center space-y-6 shadow-2xl">
        <div class="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold text-white">Installing Server</h3>
          <p class="text-sm text-gray-400">This may take a few minutes...</p>
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
  ArrowLeft, Search, X, SearchX, Package, ChevronRight, Check, CheckCircle,
  AlertTriangle, MemoryStick, Cpu, HardDrive, Database, Clock, Coins,
  Info, Loader2, Rocket, Server,
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
  if (!mb) return '0'
  if (mb >= 1024) return (mb / 1024).toFixed(mb % 1024 === 0 ? 0 : 1) + ' GB'
  return mb + ' MB'
}

function formatDisk(mb) {
  if (!mb) return '0'
  if (mb >= 1024) return Math.round(mb / 1024) + ' GB'
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
      const { data } = await client.get(`/products/nests/${plan.nest_id}/eggs`)
      eggs.value = Array.isArray(data) ? data : []
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
    const payload = { serverName: serverName.value, productId: selectedPlan.value.id }
    if (selectedEgg.value) {
      payload.eggId = selectedEgg.value.attributes?.id || selectedEgg.value.id
      payload.nestId = selectedPlan.value.nest_id
    }
    await client.post('/servers', payload)
    serverCreated.value = true
    await authStore.fetchProfile()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create server.'
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
