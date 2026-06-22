<template>
  <div class="min-h-screen bg-[#0a0f1a] relative overflow-hidden">
    <!-- Background Decorations -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-blue-500/[0.03] rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/[0.03] rounded-full blur-3xl"></div>

    <div class="relative z-10 app-container py-8 space-y-8">
      <!-- Back Button -->
      <button
        @click="goBack"
        class="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft :size="18" :stroke-width="2.5" />
        Back to Services
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
        <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Loading...</p>
      </div>

      <template v-else-if="category">
        <!-- ==================== Category Banner ==================== -->
        <div class="relative bg-[#0f1729] border border-blue-500/10 rounded-2xl overflow-hidden">
          <div class="relative h-48 sm:h-64 overflow-hidden">
            <img v-if="category.image_url" :src="category.image_url" :alt="category.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full bg-gradient-to-br from-blue-500/20 to-[#0f1729] flex items-center justify-center">
              <Package :size="56" class="text-blue-400/40" />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/40 to-transparent"></div>
            <!-- Sub Image Badge -->
            <img v-if="category.sub_image_url" :src="category.sub_image_url" alt="badge" class="absolute top-4 left-4 w-12 h-12 rounded-xl object-cover border border-blue-500/30 shadow-lg z-10" />
            <!-- Overlay Content -->
            <div class="absolute inset-0 flex items-end p-6 sm:p-8">
              <div class="flex-1">
                <h2 class="text-3xl sm:text-4xl font-bold text-white mb-2">{{ category.name }}</h2>
                <p class="text-sm text-gray-300 max-w-xl">{{ category.description || 'Choose a plan that best fits your requirements.' }}</p>
              </div>
              <div class="hidden sm:block text-right">
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Plans</p>
                <p class="text-4xl font-bold text-blue-400">[ {{ plans.length }} ]</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== Plans Grid ==================== -->
        <div v-if="loadingPlans" class="flex items-center justify-center py-16">
          <div class="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div v-else-if="!selectedPlan" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            @click="selectPlan(plan)"
            class="group bg-[#0f1729] border border-blue-500/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer"
          >
            <!-- Plan Banner Image -->
            <div v-if="plan.image_url" class="relative h-32 overflow-hidden">
              <img :src="plan.image_url" :alt="plan.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#0f1729] via-[#0f1729]/40 to-transparent"></div>
              <div class="absolute bottom-0 left-0 right-0 p-4 pb-3 text-center">
                <h4 class="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{{ plan.name }}</h4>
                <p v-if="plan.description" class="text-xs text-gray-300 mt-0.5 line-clamp-1">{{ plan.description }}</p>
              </div>
            </div>
            <!-- Plan Header (fallback when no image) -->
            <div v-else class="p-6 pb-4 text-center border-b border-white/5">
              <h4 class="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{{ plan.name }}</h4>
              <p v-if="plan.description" class="text-sm text-gray-400 mt-1">{{ plan.description }}</p>
            </div>

            <!-- Specs -->
            <div class="p-6 space-y-5">
              <!-- RAM / CPU / Disk -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="bg-[#0a0f1a] rounded-xl p-4 text-center border border-blue-500/10">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <MemoryStick :size="14" class="text-blue-400" />
                    <span class="text-[10px] font-bold text-gray-500 uppercase">RAM</span>
                  </div>
                  <p class="text-xl font-bold text-white">{{ formatRam(plan.ram) }}</p>
                </div>
                <div class="bg-[#0a0f1a] rounded-xl p-4 text-center border border-blue-500/10">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <Cpu :size="14" class="text-blue-400" />
                    <span class="text-[10px] font-bold text-gray-500 uppercase">CPU</span>
                  </div>
                  <p class="text-xl font-bold text-white">{{ plan.cpu }}%</p>
                </div>
                <div class="bg-[#0a0f1a] rounded-xl p-4 text-center border border-blue-500/10">
                  <div class="flex items-center justify-center gap-1.5 mb-2">
                    <HardDrive :size="14" class="text-blue-400" />
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
                  {{ plan.duration_days }} days
                </span>
              </div>

              <!-- Price + Select -->
              <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="flex items-center gap-2">
                  <Coins :size="20" class="text-yellow-500" />
                  <span class="text-3xl font-bold text-white">{{ plan.coin_price }}</span>
                  <span class="text-sm text-gray-400">coins</span>
                </div>
                <button class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2">
                  Select Plan
                  <CheckCircle :size="14" />
                </button>
              </div>
            </div>
          </div>

          <!-- Empty -->
          <div v-if="plans.length === 0" class="col-span-full py-16 text-center bg-[#12121a] border border-white/5 rounded-2xl">
            <p class="text-gray-400">No plans available in this category yet.</p>
          </div>
        </div>

        <!-- ==================== Configure + Deploy ==================== -->
        <div v-if="selectedPlan && !serverCreated" class="space-y-6 max-w-3xl mx-auto">
          <!-- Selected Plan Card -->
          <div class="bg-[#0f1729] border border-blue-500/20 rounded-2xl p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Package :size="24" class="text-blue-400" />
                </div>
                <div>
                  <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selected Plan</p>
                  <p class="text-2xl font-bold text-white mt-0.5">{{ selectedPlan.name }}</p>
                </div>
              </div>
              <div class="flex items-center gap-6">
                <div class="text-right">
                  <p class="text-2xl font-bold text-blue-400">{{ selectedPlan.coin_price }} <span class="text-sm text-gray-400">coins</span></p>
                  <p class="text-xs text-gray-500">{{ selectedPlan.duration_days }} days</p>
                </div>
                <button @click="selectedPlan = null; selectedEgg = null" class="text-sm font-bold text-blue-400 hover:text-white transition-colors">Change</button>
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
                    ? 'bg-blue-500/10 border-blue-500/40 ring-1 ring-blue-500/20'
                    : 'bg-[#12121a] border-white/5 hover:border-accent/20'
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-bold text-white">{{ egg.attributes?.name }}</p>
                    <p v-if="egg.attributes?.description" class="text-xs text-gray-400 mt-1 line-clamp-1">{{ egg.attributes.description }}</p>
                  </div>
                  <Check v-if="selectedEgg?.attributes?.id === egg.attributes?.id" :size="18" class="text-blue-400" />
                </div>
              </button>
            </div>
          </div>

          <!-- Auto egg -->
          <div v-else class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
            <Check :size="16" class="text-blue-400" />
            <div>
              <p class="text-sm font-bold text-white">Software: <span class="text-blue-400">{{ selectedEgg?.attributes?.name || selectedPlan.egg_name }}</span></p>
              <p class="text-xs text-gray-500">Pre-configured by admin</p>
            </div>
          </div>

          <!-- Server Name -->
          <div class="space-y-3">
            <h3 class="text-lg font-bold text-white">Server Name</h3>
            <div class="bg-[#0f1729] border border-blue-500/10 rounded-xl p-5">
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
          <div class="bg-[#0f1729] border border-blue-500/10 rounded-2xl p-6">
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
                  class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
                >
                  <Loader2 v-if="deploying" :size="16" class="animate-spin" />
                  <Rocket v-else :size="16" />
                  {{ deploying ? 'Deploying...' : 'Deploy Server' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== Success ==================== -->
        <div v-if="serverCreated" class="max-w-lg mx-auto text-center py-20 space-y-6">
          <div class="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle :size="48" class="text-green-500" />
          </div>
          <div class="space-y-2">
            <h2 class="text-3xl font-bold text-white">Server Created!</h2>
            <p class="text-gray-400">Your server is being installed. You'll receive an email when it's ready.</p>
          </div>
          <router-link to="/servers" class="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
            <Server :size="16" />
            Go to Servers
          </router-link>
        </div>
      </template>
    </div>

    <!-- Deploy Popup -->
    <div v-if="deploying" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div class="bg-[#0f1729] border border-blue-500/20 rounded-2xl p-10 max-w-sm w-full mx-4 text-center space-y-6 shadow-2xl">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div class="space-y-2">
          <h3 class="text-xl font-bold text-white">Installing Server</h3>
          <p class="text-sm text-gray-400">This may take a few minutes...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  ArrowLeft, Package, Check, CheckCircle,
  AlertTriangle, MemoryStick, Cpu, HardDrive, Database, Clock, Coins,
  Info, Loader2, Rocket, Server,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const loadingPlans = ref(false)
const loadingEggs = ref(false)
const error = ref('')
const success = ref('')
const category = ref(null)
const plans = ref([])
const selectedPlan = ref(null)
const eggs = ref([])
const selectedEgg = ref(null)
const serverName = ref('')
const deploying = ref(false)
const serverCreated = ref(false)

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
    router.push('/services')
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
  const categoryId = route.params.categoryId
  try {
    // Fetch category details
    const { data: categoriesData } = await client.get('/categories')
    const allCategories = Array.isArray(categoriesData) ? categoriesData : []
    category.value = allCategories.find(c => c.id === Number(categoryId))
    
    if (!category.value) {
      error.value = 'Category not found.'
      return
    }

    // Fetch plans for this category
    loadingPlans.value = true
    try {
      const { data } = await client.get(`/categories/${categoryId}/products`)
      plans.value = Array.isArray(data) ? data : []
    } catch {
      plans.value = []
    } finally {
      loadingPlans.value = false
    }
  } catch {
    error.value = 'Failed to load category.'
  } finally {
    loading.value = false
  }
})
</script>
