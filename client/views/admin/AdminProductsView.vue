<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Services</h2>
        <p class="text-sm text-text-muted">{{ products.length }} server services</p>
      </div>
      <router-link to="/admin/services/create" class="btn-primary px-4 py-2 text-xs flex items-center gap-2">
        <Plus :size="14" :stroke-width="2.5" />
        Create Service
      </router-link>
    </div>

    <!-- Search & Filter -->
    <div class="card-surface p-4 flex flex-col sm:flex-row items-center gap-4">
      <div class="flex items-center gap-3 flex-1">
        <Search :size="18" :stroke-width="2" class="text-text-muted shrink-0" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search services..."
          class="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
      </div>
      <div v-if="categories.length > 0" class="flex items-center gap-3">
        <label class="text-label text-xs">Category:</label>
        <select v-model="filterCategory" class="input-field w-48 text-xs py-1.5">
          <option :value="null">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading services...</p>
    </div>

    <!-- Service Cards Grid -->
    <div v-else-if="filteredProducts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="(p, index) in filteredProducts"
        :key="p.id"
        class="stagger-item card-surface p-6 flex flex-col group relative overflow-hidden transition-all hover:border-accent/30 hover:bg-accent/[0.02]"
        :style="{ animationDelay: (index * 0.06) + 's' }"
      >
        <!-- Background Glow -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all duration-500"></div>

        <div class="relative flex-1 space-y-5">
          <!-- Status Badge + Active -->
          <div class="flex items-center justify-between">
            <span
              :class="p.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'"
              class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full"
            >
              {{ p.isActive ? 'Active' : 'Inactive' }}
            </span>
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider">ID: {{ p.id }}</span>
          </div>

          <!-- Service Name -->
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-text-primary group-hover:text-accent transition-colors">{{ p.name }}</h3>
            <p class="text-xs text-text-muted">{{ getCategoryName(p.category_id) }}</p>
          </div>

          <!-- Price -->
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold text-accent">{{ p.coin_price }}</span>
            <span class="text-xs text-text-muted">coins</span>
            <span v-if="p.billing_priority" class="ml-auto text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
              {{ p.billing_priority }}
            </span>
          </div>

          <!-- Specs -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HardDrive :size="13" :stroke-width="2" class="text-blue-400" />
              </div>
              <div>
                <p class="text-xs font-bold text-blue-400">{{ p.ram }}MB</p>
                <p class="text-[10px] text-text-muted">Memory</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap :size="13" :stroke-width="2" class="text-amber-400" />
              </div>
              <div>
                <p class="text-xs font-bold text-amber-400">{{ p.cpu }}%</p>
                <p class="text-[10px] text-text-muted">CPU</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Database :size="13" :stroke-width="2" class="text-purple-400" />
              </div>
              <div>
                <p class="text-xs font-bold text-purple-400">{{ p.disk }}MB</p>
                <p class="text-[10px] text-text-muted">Disk</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <RefreshCw :size="13" :stroke-width="2" class="text-cyan-400" />
              </div>
              <div>
                <p class="text-xs font-bold text-cyan-400">{{ p.swap }}MB</p>
                <p class="text-[10px] text-text-muted">Swap</p>
              </div>
            </div>
          </div>

          <!-- Extra Info -->
          <div class="flex items-center gap-4 pt-2 text-xs text-text-muted">
            <span v-if="p.databases" class="flex items-center gap-1.5">
              <Server :size="12" :stroke-width="2" class="opacity-60" /> {{ p.databases }} DBs
            </span>
            <span v-if="p.backups" class="flex items-center gap-1.5">
              <HardDrive :size="12" :stroke-width="2" class="opacity-60" /> {{ p.backups }} Backups
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="relative mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
          <router-link :to="`/admin/services/${p.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors flex items-center gap-1.5">
            <Pencil :size="12" :stroke-width="2.5" /> Edit
          </router-link>
          <button @click="deleteProduct(p)" class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5">
            <Trash2 :size="12" :stroke-width="2.5" /> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="card-surface p-12 text-center">
      <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Package :size="28" :stroke-width="1.5" class="text-text-muted opacity-40" />
      </div>
      <p class="text-text-muted text-lg font-bold mb-1">No Services Found</p>
      <p class="text-sm text-text-muted/60">Create your first service to get started.</p>
      <router-link to="/admin/services/create" class="inline-block mt-4 text-sm text-accent hover:text-white transition-colors">
        + Create Service
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../../api/client'
import {
  Plus,
  Search,
  HardDrive,
  Zap,
  Database,
  RefreshCw,
  Server,
  Pencil,
  Trash2,
  Package,
} from 'lucide-vue-next'

const products = ref([])
const categories = ref([])
const filterCategory = ref(null)
const searchQuery = ref('')
const loading = ref(true)

const filteredProducts = computed(() => {
  let result = products.value

  if (filterCategory.value !== null) {
    result = result.filter(p => p.category_id === filterCategory.value)
  }

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      getCategoryName(p.category_id).toLowerCase().includes(q)
    )
  }

  return result
})

const getCategoryName = (catId) => {
  const cat = categories.value.find(c => c.id === catId)
  return cat ? cat.name : 'Uncategorized'
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      client.get('/admin/products'),
      client.get('/admin/categories')
    ])
    products.value = productsRes.data || []
    categories.value = categoriesRes.data || []
  } catch (e) {
    console.error('Failed to load services:', e)
  } finally {
    loading.value = false
  }
}

const deleteProduct = async (product) => {
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return
  try {
    await client.delete(`/admin/products/${product.id}`)
    products.value = products.value.filter(p => p.id !== product.id)
  } catch (e) {
    alert('Failed to delete: ' + (e.response?.data?.message || e.message))
  }
}

onMounted(fetchProducts)
</script>
