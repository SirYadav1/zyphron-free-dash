<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Services</h2>
        <p class="text-sm text-text-muted">{{ products.length }} server services</p>
      </div>
      <router-link to="/admin/services/create" class="btn-primary px-4 py-2 text-xs">Create Product</router-link>
    </div>

    <!-- Category Filter -->
    <div v-if="categories.length > 0" class="flex items-center gap-3">
      <label class="text-label text-xs">Filter by Category:</label>
      <select v-model="filterCategory" class="input-field w-48 text-xs py-1.5">
        <option :value="null">All Categories</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <span class="text-xs text-text-muted">{{ filteredProducts.length }} result{{ filteredProducts.length !== 1 ? 's' : '' }}</span>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Active</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Category</th>
              <th class="px-5 py-3 text-label">Coins</th>
              <th class="px-5 py-3 text-label">Billing</th>
              <th class="px-5 py-3 text-label">Memory</th>
              <th class="px-5 py-3 text-label">CPU</th>
              <th class="px-5 py-3 text-label">Swap</th>
              <th class="px-5 py-3 text-label">Disk</th>
              <th class="px-5 py-3 text-label">DBs</th>
              <th class="px-5 py-3 text-label">Backups</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filteredProducts" :key="p.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span :class="p.isActive ? 'text-accent' : 'text-text-muted/40'" class="text-xs font-bold">{{ p.isActive ? 'Yes' : 'No' }}</span>
              </td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ p.name }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ getCategoryName(p.category_id) }}</td>
              <td class="px-5 py-3 text-accent font-bold">{{ p.coin_price }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ p.billing_priority || '---' }}</td>
              <td class="px-5 py-3 text-blue-400 text-sm">{{ p.ram }}MB</td>
              <td class="px-5 py-3 text-amber-400 text-sm">{{ p.cpu }}%</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ p.swap }}MB</td>
              <td class="px-5 py-3 text-purple-400 text-sm">{{ p.disk }}MB</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ p.databases }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ p.backups }}</td>
              <td class="px-5 py-3 text-right">
                <router-link :to="`/admin/products/${p.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="products.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Services Found</p>
        <p class="text-sm text-text-muted/60">Create your first product to get started.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../../api/client'

const products = ref([])
const categories = ref([])
const filterCategory = ref(null)

const filteredProducts = computed(() => {
  if (filterCategory.value === null) return products.value
  return products.value.filter(p => p.category_id === filterCategory.value)
})

function getCategoryName(catId) {
  if (!catId) return 'Uncategorized'
  const cat = categories.value.find(c => c.id === catId)
  return cat ? cat.name : 'Unknown'
}

onMounted(async () => {
  try {
    const [prodRes, catRes] = await Promise.all([
      client.get('/admin/products'),
      client.get('/admin/categories').catch(() => ({ data: [] }))
    ])
    products.value = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data.products || []
    categories.value = Array.isArray(catRes.data) ? catRes.data : []
  } catch { /* ignore */ }
})
</script>
