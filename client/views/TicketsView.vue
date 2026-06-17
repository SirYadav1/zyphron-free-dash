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

    <!-- Open Tickets -->
    <div v-if="openTickets.length > 0" class="space-y-4">
      <h3 class="text-sm font-bold text-text-primary uppercase tracking-widest opacity-50">Open Tickets</h3>
      <div class="space-y-2">
        <router-link
          v-for="ticket in openTickets"
          :key="ticket.id"
          :to="`/ticket/${ticket.id}`"
          class="card-surface p-4 flex items-center gap-4 group hover:border-accent/30 transition-all block"
        >
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
            <MessageSquare :size="18" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-accent font-mono">{{ formatTicketId(ticket) }}</span>
              <span :class="statusClass(ticket.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                {{ ticket.status }}
              </span>
              <span :class="priorityClass(ticket.priority)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                {{ ticket.priority }}
              </span>
            </div>
            <p class="text-sm font-bold text-text-primary group-hover:text-accent transition-colors truncate mt-1">{{ ticket.title }}</p>
            <p class="text-[11px] text-text-muted mt-0.5">Updated {{ formatDate(ticket.updatedAt || ticket.updated_at) }}</p>
          </div>
          <svg class="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>

    <!-- Closed Tickets -->
    <div v-if="closedTickets.length > 0" class="space-y-4">
      <h3 class="text-sm font-bold text-text-primary uppercase tracking-widest opacity-50">Closed Tickets</h3>
      <div class="space-y-2">
        <router-link
          v-for="ticket in closedTickets"
          :key="ticket.id"
          :to="`/ticket/${ticket.id}`"
          class="card-surface p-4 flex items-center gap-4 group hover:border-accent/30 transition-all block opacity-60 hover:opacity-100"
        >
          <div class="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-text-muted flex-shrink-0">
            <CheckCircle :size="18" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-text-muted font-mono">{{ formatTicketId(ticket) }}</span>
              <span :class="statusClass(ticket.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                {{ ticket.status }}
              </span>
            </div>
            <p class="text-sm font-bold text-text-primary truncate mt-1">{{ ticket.title }}</p>
            <p class="text-[11px] text-text-muted mt-0.5">Closed {{ formatDate(ticket.updatedAt || ticket.updated_at) }}</p>
          </div>
          <svg class="w-4 h-4 text-text-muted group-hover:text-accent transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../api/client'
import { MessageSquare, CheckCircle } from 'lucide-vue-next'

const tickets = ref([])
const loading = ref(true)

const openTickets = computed(() => tickets.value.filter(t => t.status !== 'closed'))
const closedTickets = computed(() => tickets.value.filter(t => t.status === 'closed'))

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

function formatTicketId(ticket) {
  // use ticket_id (hex) if available, otherwise fall back to numeric ID
  if (ticket.ticket_id) {
    return `ZYPHC-${ticket.ticket_id.substring(0, 4).toUpperCase()}`
  }
  return `ZYPHC-${String(ticket.id).padStart(4, '0')}`
}

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
