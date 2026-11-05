<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Categories</h2>
        <p class="text-sm text-text-muted">{{ categories.length }} service categories</p>
      </div>
      <router-link to="/admin/categories/create" class="btn-primary px-4 py-2 text-xs">Create Category</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Image</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Description</th>
              <th class="px-5 py-3 text-label">Active</th>
              <th class="px-5 py-3 text-label">Order</th>
              <th class="px-5 py-3 text-label">Products</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-base border border-border flex items-center justify-center">
                  <img v-if="cat.image_url" :src="cat.image_url" :alt="cat.name" class="w-full h-full object-cover" />
                  <span v-else class="text-text-muted/40"><Package :size="18" :stroke-width="2" /></span>
                </div>
              </td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ cat.name }}</td>
              <td class="px-5 py-3 text-text-muted text-sm max-w-[200px] truncate">{{ cat.description || '---' }}</td>
              <td class="px-5 py-3">
                <span :class="cat.is_active ? 'text-accent' : 'text-text-muted/40'" class="text-xs font-bold">{{ cat.is_active ? 'Yes' : 'No' }}</span>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ cat.display_order }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ cat.product_count || 0 }}</td>
              <td class="px-5 py-3 text-right space-x-3">
                <router-link :to="`/admin/categories/${cat.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                <button @click="deleteCategory(cat)" class="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="categories.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Categories Found</p>
        <p class="text-sm text-text-muted/60">Create your first category to get started.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Package } from 'lucide-vue-next'
import client from '../../api/client'

const categories = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/categories')
    categories.value = Array.isArray(data) ? data : []
  } catch { /* ignore */ }
})

async function deleteCategory(cat) {
  if (!confirm(`Delete category "${cat.name}"? This will NOT delete the products inside it.`)) return
  try {
    await client.delete(`/admin/categories/${cat.id}`)
    categories.value = categories.value.filter(c => c.id !== cat.id)
  } catch { /* ignore */ }
}
</script>
