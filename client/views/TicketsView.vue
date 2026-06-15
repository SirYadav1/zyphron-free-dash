<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Support Tickets</h2>
        <p class="text-sm text-text-muted">View and manage your support requests.</p>
      </div>
      <router-link to="/ticket/create" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Create Ticket
      </router-link>
    </div>

    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Tickets...</p>
    </div>

    <div v-else-if="tickets.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Tickets Yet</h3>
        <p class="text-sm text-text-muted max-w-sm mx-auto">
          You haven't created any support tickets. Open one to get help from our team.
        </p>
      </div>
      <router-link to="/ticket/create" class="btn-primary inline-flex">
        Create Ticket
      </router-link>
    </div>

    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-base/50 border-b border-border">
              <th class="px-6 py-4 text-label opacity-40">Ticket ID</th>
              <th class="px-6 py-4 text-label opacity-40">Category</th>
              <th class="px-6 py-4 text-label opacity-40">Title</th>
              <th class="px-6 py-4 text-label opacity-40">Priority</th>
              <th class="px-6 py-4 text-label opacity-40">Status</th>
              <th class="px-6 py-4 text-label opacity-40">Last Updated</th>
              <th class="px-6 py-4 text-label opacity-40">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="ticket in tickets" :key="ticket.id" class="hover:bg-white/[0.01] transition-colors group">
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-text-primary font-mono">#{{ String(ticket.id).substring(0, 8) }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-text-muted">{{ ticket.category || 'General' }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">{{ ticket.title }}</p>
              </td>
              <td class="px-6 py-4">
                <span :class="priorityClass(ticket.priority)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                  {{ ticket.priority }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span :class="statusClass(ticket.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                  {{ ticket.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-text-muted">{{ formatDate(ticket.updatedAt || ticket.updated_at) }}</p>
              </td>
              <td class="px-6 py-4">
                <router-link :to="`/ticket/${ticket.id}`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">
                  View
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../api/client'

const tickets = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await client.get('/tickets')
    tickets.value = data
  } catch {
    // error handled silently
  } finally {
    loading.value = false
  }
})

function priorityClass(priority) {
  return {
    low: 'bg-green-500/5 text-green-400 border-green-500/20',
    medium: 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/5 text-red-400 border-red-500/20',
    critical: 'bg-purple-500/5 text-purple-400 border-purple-500/20',
  }[priority?.toLowerCase()] || 'bg-white/5 text-text-muted border-border'
}

function statusClass(status) {
  return {
    open: 'bg-green-500/5 text-green-400 border-green-500/20',
    in_progress: 'bg-blue-500/5 text-blue-400 border-blue-500/20',
    waiting: 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20',
    closed: 'bg-white/5 text-text-muted border-border',
  }[status?.toLowerCase()] || 'bg-white/5 text-text-muted border-border'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
