<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/partners" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Partners</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Partner Users</h2>
      <p class="text-sm text-text-muted">Partner: <span class="text-accent font-bold">{{ partnerName }}</span></p>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">User ID</th>
              <th class="px-5 py-3 text-label">Username</th>
              <th class="px-5 py-3 text-label">Email</th>
              <th class="px-5 py-3 text-label">Joined At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ u.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ u.username }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ u.email }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ formatDate(u.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="users.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Users Found</p>
        <p class="text-sm text-text-muted/60">This partner has no referred users yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '../../api/client'

const route = useRoute()
const users = ref([])
const partnerName = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/partners/${route.params.id}/users`)
    users.value = Array.isArray(data) ? data : data.users || []
    partnerName.value = data.partnerName || ''
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
