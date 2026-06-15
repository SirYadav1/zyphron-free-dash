<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Ledger</h2>
        <p class="text-sm text-text-muted">History of all credit movements and resource operations.</p>
      </div>
    </div>

    <!-- Content -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Synchronizing Ledger...</p>
    </div>

    <div v-else-if="transactions.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40 text-3xl">
        📜
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Records Found</h3>
        <p class="text-sm text-text-muted max-w-xs mx-auto">
          Your credit ledger is currently empty. Generated rewards will appear here.
        </p>
      </div>
      <router-link to="/afk" class="btn-primary inline-flex">
        Start Earning
      </router-link>
    </div>

    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-base/50 border-b border-border">
              <th class="px-6 py-4 text-label opacity-40">Timestamp</th>
              <th class="px-6 py-4 text-label opacity-40">Category</th>
              <th class="px-6 py-4 text-label opacity-40">Volume</th>
              <th class="px-6 py-4 text-label opacity-40">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="tx in transactions" :key="tx.id" class="hover:bg-white/[0.01] transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm font-bold text-text-primary/90">{{ formatDate(tx.createdAt || tx.created_at) }}</p>
                <p class="text-[10px] text-text-muted font-medium opacity-50">{{ formatTime(tx.createdAt || tx.created_at) }}</p>
              </td>
              <td class="px-6 py-4">
                <span :class="typeClass(tx.type)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                  {{ tx.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm font-bold tabular-nums" :class="tx.amount > 0 ? 'text-accent' : 'text-red-400'">
                  {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }} CR
                </p>
              </td>
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">
                  {{ tx.description || 'Infrastructure Operation' }}
                </p>
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

const transactions = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await client.get('/transactions')
    transactions.value = data
  } catch {
    // error handled silently
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function typeClass(type) {
  return {
    earn: 'bg-accent/5 text-accent border-accent/20',
    spend: 'bg-red-500/5 text-red-400 border-red-500/20',
    renewal: 'bg-blue-500/5 text-blue-400 border-blue-500/20',
    server_create: 'bg-purple-500/5 text-purple-400 border-purple-500/20',
  }[type] || 'bg-white/5 text-text-muted border-border'
}
</script>
