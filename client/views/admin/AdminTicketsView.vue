<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Support Tickets</h2>
        <p class="text-sm text-text-muted">{{ tickets.length }} total tickets</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link to="/admin/ticket/blacklist" class="btn-secondary px-4 py-2 text-xs">Blacklist</router-link>
      </div>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">User</th>
              <th class="px-5 py-3 text-label">Title</th>
              <th class="px-5 py-3 text-label">Priority</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label">Date</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in tickets" :key="t.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ t.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ t.user?.username || '---' }}</td>
              <td class="px-5 py-3 text-text-primary text-sm max-w-[200px] truncate">{{ t.title }}</td>
              <td class="px-5 py-3">
                <span :class="priorityClass(t.priority)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ t.priority }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="statusClass(t.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ t.status }}</span>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(t.createdAt) }}</td>
              <td class="px-5 py-3 text-right">
                <router-link :to="`/admin/ticket/${t.id}`" class="text-xs font-bold text-accent hover:text-white transition-colors">View</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="tickets.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Tickets Found</p>
        <p class="text-sm text-text-muted/60">No support tickets have been created yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const tickets = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/tickets')
    tickets.value = Array.isArray(data) ? data : data.tickets || []
  } catch { /* ignore */ }
})

function priorityClass(p) {
  return {
    low: 'text-blue-400 bg-blue-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-red-500 bg-red-500/10',
    urgent: 'text-purple-400 bg-purple-500/10'
  }[p] || 'text-text-muted bg-white/5'
}

function statusClass(s) {
  return {
    open: 'text-accent bg-accent/10',
    closed: 'text-text-muted bg-white/5',
    resolved: 'text-emerald-400 bg-emerald-500/10'
  }[s] || 'text-text-muted bg-white/5'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
