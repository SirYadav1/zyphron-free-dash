<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Useful Links</h2>
        <p class="text-sm text-text-muted mt-1">{{ links.length }} saved link{{ links.length !== 1 ? 's' : '' }}</p>
      </div>
      <router-link to="/admin/usefullinks/create" class="px-4 py-2 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors">
        + Create Link
      </router-link>
    </div>

    <!-- Table -->
    <div v-if="links.length > 0" class="bg-base-secondary border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-base/50">
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Title</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">URL</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Description</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Position</th>
            <th class="px-5 py-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="link in links" :key="link.id" class="border-b border-border/40 last:border-b-0 hover:bg-white/[0.02] transition-colors">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <span v-if="link.icon" class="text-accent text-xs">{{ link.icon }}</span>
                <span class="text-text-primary font-bold text-sm">{{ link.title }}</span>
              </div>
            </td>
            <td class="px-5 py-3 max-w-[250px] truncate">
              <a :href="link.link" target="_blank" class="text-accent text-xs hover:text-white transition-colors">{{ link.link }}</a>
            </td>
            <td class="px-5 py-3">
              <span class="text-text-muted text-xs">{{ link.description || '—' }}</span>
            </td>
            <td class="px-5 py-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent">{{ link.position || 'sidebar' }}</span>
            </td>
            <td class="px-5 py-3 text-right">
              <div class="flex gap-2 justify-end">
                <router-link :to="`/admin/usefullinks/${link.id}/edit`"
                  class="px-2.5 py-1 text-[10px] font-bold text-accent border border-accent/20 rounded hover:bg-accent/10 transition-colors">
                  Edit
                </router-link>
                <button @click="handleDelete(link)"
                  class="px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors">
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-base-secondary border border-border rounded-xl py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Links Found</p>
      <p class="text-sm text-text-muted/60">Create your first useful link.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const links = ref([])

onMounted(async () => {
  await fetchLinks()
})

async function fetchLinks() {
  try {
    const { data } = await client.get('/admin/useful-links')
    links.value = Array.isArray(data) ? data : data.links || []
  } catch { /* ignore */ }
}

async function handleDelete(link) {
  if (!confirm(`Delete "${link.title}"?`)) return
  try {
    await client.delete(`/admin/useful-links/${link.id}`)
    await fetchLinks()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete')
  }
}
</script>
