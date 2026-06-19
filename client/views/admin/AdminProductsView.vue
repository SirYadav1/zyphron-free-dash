<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Products</h2>
        <p class="text-sm text-text-muted">{{ products.length }} server products</p>
      </div>
      <router-link to="/admin/products/create" class="btn-primary px-4 py-2 text-xs">Create Product</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Active</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Price</th>
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
            <tr v-for="p in products" :key="p.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span :class="p.isActive ? 'text-accent' : 'text-text-muted/40'" class="text-xs font-bold">{{ p.isActive ? 'Yes' : 'No' }}</span>
              </td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ p.name }}</td>
              <td class="px-5 py-3 text-accent font-bold">{{ p.price }}</td>
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
        <p class="text-text-muted text-lg font-bold mb-1">No Products Found</p>
        <p class="text-sm text-text-muted/60">Create your first product to get started.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const products = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/products')
    products.value = Array.isArray(data) ? data : data.products || []
  } catch { /* ignore */ }
})
</script>
