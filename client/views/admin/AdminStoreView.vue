<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Coin Packages</h2>
        <p class="text-sm text-text-muted">{{ items.length }} package{{ items.length !== 1 ? 's' : '' }} available in store</p>
      </div>
      <router-link to="/admin/store/create" class="btn-primary px-4 py-2 text-xs">Create Store Item</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Price</th>
              <th class="px-5 py-3 text-label">Quantity</th>
              <th class="px-5 py-3 text-label">Description</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" :class="item.type === 'credits' ? 'text-accent bg-accent/10' : 'text-purple-400 bg-purple-500/10'">
                  {{ item.type === 'credits' ? 'Coins' : item.type }}
                </span>
              </td>
              <td class="px-5 py-3 text-accent font-bold">₹{{ item.price }}</td>
              <td class="px-5 py-3 text-text-primary text-sm font-bold">{{ item.quantity }} coins</td>
              <td class="px-5 py-3 text-text-muted text-sm max-w-[200px] truncate">{{ item.description }}</td>
              <td class="px-5 py-3">
                <span :class="item.isActive ? 'text-accent' : 'text-red-500'" class="text-xs font-bold">{{ item.isActive ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <router-link :to="`/admin/store/${item.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="items.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Store Items Found</p>
        <p class="text-sm text-text-muted/60">Create your first store item to get started.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const items = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/store')
    items.value = Array.isArray(data) ? data : data.items || []
  } catch { /* ignore */ }
})
</script>
