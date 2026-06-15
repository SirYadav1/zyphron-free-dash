<template>
  <div class="space-y-10 max-w-4xl">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <router-link to="/admin/ticket" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Tickets</router-link>
        </div>
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ ticket.title || 'Loading...' }}</h2>
        <p class="text-sm text-text-muted">
          by {{ ticket.user?.username || '---' }} &middot;
          <span :class="statusClass(ticket.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ ticket.status }}</span>
          <span :class="priorityClass(ticket.priority)" class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ ticket.priority }}</span>
        </p>
      </div>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else>
      <div class="card-surface p-6 space-y-4">
        <p class="text-text-primary text-sm whitespace-pre-wrap">{{ ticket.description || ticket.message }}</p>
        <p class="text-xs text-text-muted">{{ formatDate(ticket.createdAt) }}</p>
      </div>

      <div class="space-y-4">
        <h3 class="text-label text-xs uppercase tracking-widest">Replies ({{ replies.length }})</h3>
        <div v-for="r in replies" :key="r.id" class="card-surface p-4 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-text-primary">{{ r.user?.username || 'System' }}</span>
            <span class="text-xs text-text-muted">{{ formatDate(r.createdAt) }}</span>
          </div>
          <p class="text-sm text-text-muted whitespace-pre-wrap">{{ r.comment }}</p>
        </div>
        <div v-if="replies.length === 0" class="text-center py-8">
          <p class="text-sm text-text-muted">No replies yet.</p>
        </div>
      </div>

      <div class="card-surface p-6 space-y-4">
        <h3 class="text-label text-xs uppercase tracking-widest">Reply as Admin</h3>
        <textarea v-model="replyMessage" class="input-field w-full" rows="4" placeholder="Write your reply..."></textarea>
        <div class="flex gap-3">
          <button @click="handleReply" :disabled="sendingReply || !replyMessage.trim()" class="btn-primary px-6 py-2">
            {{ sendingReply ? 'Sending...' : 'Send Reply' }}
          </button>
          <button @click="handleClose" :disabled="sendingReply" class="btn-secondary px-6 py-2" v-if="ticket.status !== 'closed'">
            Close Ticket
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '../../api/client'

const route = useRoute()
const loading = ref(true)
const sendingReply = ref(false)
const error = ref('')
const success = ref('')
const ticket = ref({})
const replies = ref([])
const replyMessage = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/tickets/${route.params.id}`)
    ticket.value = data.ticket || data
    replies.value = data.comments || data.replies || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load ticket'
  } finally {
    loading.value = false
  }
})

function statusClass(s) {
  return {
    open: 'text-accent bg-accent/10',
    closed: 'text-text-muted bg-white/5',
    resolved: 'text-emerald-400 bg-emerald-500/10'
  }[s] || 'text-text-muted bg-white/5'
}

function priorityClass(p) {
  return {
    low: 'text-blue-400 bg-blue-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-red-500 bg-red-500/10',
    urgent: 'text-purple-400 bg-purple-500/10'
  }[p] || 'text-text-muted bg-white/5'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'
}

async function handleReply() {
  sendingReply.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await client.post(`/admin/tickets/${route.params.id}/reply`, { comment: replyMessage.value })
    replies.value.push(data.reply || data)
    replyMessage.value = ''
    success.value = 'Reply sent'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send reply'
  } finally {
    sendingReply.value = false
  }
}

async function handleClose() {
  sendingReply.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post(`/admin/tickets/${route.params.id}/close`)
    ticket.value.status = 'closed'
    success.value = 'Ticket closed'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to close ticket'
  } finally {
    sendingReply.value = false
  }
}
</script>
