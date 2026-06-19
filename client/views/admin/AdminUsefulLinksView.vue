<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Useful Links</h2>
        <p class="text-sm text-text-muted">{{ links.length }} saved links</p>
      </div>
      <router-link to="/admin/usefullinks/create" class="btn-primary px-4 py-2 text-xs">Create Link</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Title</th>
              <th class="px-5 py-3 text-label">URL</th>
              <th class="px-5 py-3 text-label">Icon</th>
              <th class="px-5 py-3 text-label">Order</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="link in links" :key="link.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ link.title }}</td>
              <td class="px-5 py-3 max-w-[300px] truncate">
                <a :href="link.url" target="_blank" class="text-accent text-sm hover:text-white transition-colors">{{ link.url }}</a>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ link.icon || '---' }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ link.sortOrder || 0 }}</td>
              <td class="px-5 py-3 text-right">
                <router-link :to="`/admin/usefullinks/${link.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="links.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Links Found</p>
        <p class="text-sm text-text-muted/60">Create your first useful link.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const links = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/useful-links')
    links.value = Array.isArray(data) ? data : data.links || []
  } catch { /* ignore */ }
})
</script>
