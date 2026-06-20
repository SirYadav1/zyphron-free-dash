<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Coin Packages</h2>
        <p class="text-sm text-text-muted">{{ items.length }} package{{ items.length !== 1 ? 's' : '' }} available in store</p>
      </div>
      <router-link to="/admin/store/create" class="btn-primary px-4 py-2 text-xs">Create Store Item</router-link>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent flex items-center gap-2">{{ success }}</div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Price</th>
              <th class="px-5 py-3 text-label">Quantity</th>
              <th class="px-5 py-3 text-label">Description</th>
              <th class="px-5 py-3 text-label">Visible to Users</th>
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
                <button
                  @click="toggleVisibility(item)"
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  :class="!item.disabled ? 'bg-accent' : 'bg-white/10'"
                >
                  <span
                    class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
                    :class="!item.disabled ? 'translate-x-[18px]' : 'translate-x-[3px]'"
                  ></span>
                </button>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center gap-3 justify-end">
                  <router-link :to="`/admin/store/${item.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                  <button @click="handleDelete(item)" class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors">Delete</button>
                </div>
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
const error = ref('')
const success = ref('')

async function loadItems() {
  try {
    const { data } = await client.get('/admin/store')
    items.value = Array.isArray(data) ? data : data.items || []
  } catch { /* ignore */ }
}

async function toggleVisibility(item) {
  error.value = ''
  success.value = ''
  try {
    const newDisabled = item.disabled ? 0 : 1
    await client.put(`/admin/store/${item.id}`, { disabled: newDisabled })
    item.disabled = newDisabled
    success.value = `Package ${newDisabled ? 'hidden from' : 'now visible to'} users`
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update'
  }
}

async function handleDelete(item) {
  if (!confirm(`Delete "${item.description || item.type}" package? This cannot be undone.`)) return
  error.value = ''
  success.value = ''
  try {
    await client.delete(`/admin/store/${item.id}`)
    success.value = 'Package deleted'
    await loadItems()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete'
  }
}

onMounted(() => loadItems())
</script>
