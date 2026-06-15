<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Partners</h2>
        <p class="text-sm text-text-muted">{{ partners.length }} partner accounts</p>
      </div>
      <router-link to="/admin/partners/create" class="btn-primary px-4 py-2 text-xs">Create Partner</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Code</th>
              <th class="px-5 py-3 text-label">Commission</th>
              <th class="px-5 py-3 text-label">Users</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in partners" :key="p.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ p.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ p.name }}</td>
              <td class="px-5 py-3 text-accent font-mono text-sm">{{ p.code }}</td>
              <td class="px-5 py-3 text-text-primary text-sm">{{ p.commission }}%</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ p.userCount || 0 }}</td>
              <td class="px-5 py-3">
                <span :class="p.isActive ? 'text-accent bg-accent/10' : 'text-red-500 bg-red-500/10'" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ p.isActive ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/admin/partners/${p.id}/users`" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Users</router-link>
                  <router-link :to="`/admin/partners/${p.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="partners.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Partners Found</p>
        <p class="text-sm text-text-muted/60">Create your first partner account.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const partners = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/partners')
    partners.value = Array.isArray(data) ? data : data.partners || []
  } catch { /* ignore */ }
})
</script>
