<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Ticket...</p>
    </div>

    <div v-else-if="error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <AlertTriangle :size="20" :stroke-width="2" />
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error</p>
        <p class="text-xs text-text-muted mt-0.5">{{ error }}</p>
      </div>
    </div>

    <template v-else-if="ticket">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <router-link to="/ticket" class="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </router-link>
            <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ ticket.title }}</h2>
          </div>
          <div class="flex items-center gap-2 ml-12">
            <span class="text-sm font-mono font-bold text-accent">{{ formatTicketId(ticket) }}</span>
            <span class="text-text-muted">&middot;</span>
            <span class="text-xs text-text-muted">{{ formatDate(ticket.createdAt || ticket.created_at) }}</span>
            <span v-if="ticket.server" class="text-text-muted">&middot;</span>
            <span v-if="ticket.server" class="text-xs text-text-muted">Server #{{ ticket.server }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 ml-12 md:ml-0">
          <span :class="priorityClass(ticket.priority)" class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border">
            {{ ticket.priority }}
          </span>
          <span :class="statusClass(ticket.status)" class="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border">
            {{ ticket.status }}
          </span>
        </div>
      </div>

      <!-- Conversation Thread -->
      <div class="space-y-4">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-widest opacity-50 flex items-center gap-2">
          <MessageSquare :size="14" />
          Conversation
        </h3>

        <!-- Original Message -->
        <div class="card-surface p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-bold flex-shrink-0">
              {{ ticket.user?.username?.charAt(0).toUpperCase() || 'U' }}
            </div>
            <div>
              <p class="text-sm font-bold text-text-primary">{{ ticket.user?.username || 'You' }}</p>
              <p class="text-[10px] text-text-muted font-medium">{{ formatDateTime(ticket.createdAt || ticket.created_at) }}</p>
            </div>
          </div>
          <div class="ml-12">
            <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{{ ticket.message }}</p>
          </div>
        </div>

        <!-- Comments / Replies -->
        <div v-for="comment in ticket.comments" :key="comment.id" class="card-surface p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div
              :class="comment.user?.isAdmin ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-white/5 border-border text-text-muted'"
              class="w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0"
            >
              {{ comment.user?.username?.charAt(0).toUpperCase() || 'S' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-text-primary">{{ comment.user?.username || 'Support' }}</p>
                <span
                  v-if="comment.user?.isAdmin || comment.is_admin"
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-accent/15 text-accent"
                >Staff</span>
              </div>
              <p class="text-[10px] text-text-muted font-medium">{{ formatDateTime(comment.createdAt || comment.created_at) }}</p>
            </div>
          </div>
          <div class="ml-12">
            <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{{ comment.comment }}</p>
          </div>
        </div>
      </div>

      <!-- Closed Ticket HTML Snapshot -->
      <div v-if="ticket.status === 'closed'" class="card-surface p-6 border-yellow-500/20 bg-yellow-500/5">
        <div class="flex items-center gap-3 mb-3">
          <Lock :size="16" class="text-yellow-500" />
          <h4 class="text-sm font-bold text-text-primary">Ticket Closed</h4>
        </div>
        <p class="text-xs text-text-muted leading-relaxed">
          This ticket has been closed on {{ formatDateTime(ticket.updatedAt || ticket.updated_at) }}.
          No further replies can be added. If you need additional assistance, please create a new ticket.
        </p>
      </div>

      <!-- Reply Form -->
      <div v-if="ticket.status !== 'closed'" class="card-surface p-8 space-y-6">
        <h3 class="text-label">Reply to Ticket</h3>

        <div v-if="replyError" class="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-sm font-bold">{{ replyError }}</div>

        <div class="space-y-1.5">
          <textarea
            v-model="replyMessage"
            rows="4"
            class="input-field resize-y min-h-[100px]"
            placeholder="Type your reply..."
          ></textarea>
        </div>

        <div class="flex items-center justify-between pt-2">
          <p class="text-xs text-text-muted font-medium">Your reply will be visible to support staff.</p>
          <div class="flex items-center gap-3">
            <button
              v-if="ticket.status === 'open'"
              @click="handleClose"
              :disabled="closing"
              class="btn-secondary text-xs"
            >
              {{ closing ? 'Closing...' : 'Close Ticket' }}
            </button>
            <button
              @click="handleReply"
              :disabled="sending || !replyMessage.trim()"
              class="btn-primary px-8"
            >
              {{ sending ? 'Sending...' : 'Send Reply' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card-surface p-6 text-center">
        <p class="text-sm font-bold text-text-muted">This ticket is closed.</p>
        <p class="text-xs text-text-muted mt-1">No further replies can be added.</p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../api/client'
import { MessageSquare, Lock, AlertTriangle } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const ticket = ref(null)
const loading = ref(true)
const error = ref('')
const replyMessage = ref('')
const sending = ref(false)
const replyError = ref('')
const closing = ref(false)

const ticketId = computed(() => route.params.id)

onMounted(async () => {
  try {
    const { data } = await client.get(`/tickets/${ticketId.value}`)
    ticket.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load ticket'
  } finally {
    loading.value = false
  }
})

function formatTicketId(ticket) {
  if (ticket.ticket_id) {
    return `ZYPHC-${ticket.ticket_id.substring(0, 4).toUpperCase()}`
  }
  return `ZYPHC-${String(ticket.id).padStart(4, '0')}`
}

async function handleReply() {
  if (!replyMessage.value.trim()) return
  sending.value = true
  replyError.value = ''
  try {
    const { data } = await client.post(`/tickets/${ticketId.value}/reply`, { message: replyMessage.value.trim() })
    if (!ticket.value.comments) ticket.value.comments = []
    ticket.value.comments.push(data)
    replyMessage.value = ''
  } catch (err) {
    replyError.value = err.response?.data?.message || 'Failed to send reply'
  } finally {
    sending.value = false
  }
}

async function handleClose() {
  if (!confirm('Close this ticket? You will not be able to reply afterwards.')) return
  closing.value = true
  try {
    await client.post(`/tickets/${ticketId.value}/close`)
    ticket.value.status = 'closed'
  } catch (err) {
    replyError.value = err.response?.data?.message || 'Failed to close ticket'
  } finally {
    closing.value = false
  }
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

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
