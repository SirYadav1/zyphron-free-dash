<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Invoices</h2>
        <p class="text-sm text-text-muted">View and manage your billing invoices.</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading invoices...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="invoices.length === 0" class="card-surface py-20 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40 text-3xl">
        📄
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Invoices Found</h3>
        <p class="text-sm text-text-muted max-w-xs mx-auto">
          You don't have any invoices yet. Invoices will appear here once payments are processed.
        </p>
      </div>
    </div>

    <!-- Invoices Table -->
    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-base/50 border-b border-border">
              <th class="px-6 py-4 text-label opacity-40">Invoice #</th>
              <th class="px-6 py-4 text-label opacity-40">Amount</th>
              <th class="px-6 py-4 text-label opacity-40">Total</th>
              <th class="px-6 py-4 text-label opacity-40">Status</th>
              <th class="px-6 py-4 text-label opacity-40">Due Date</th>
              <th class="px-6 py-4 text-label opacity-40">Created</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-white/[0.01] transition-colors group">
              <td class="px-6 py-4">
                <p class="text-sm font-bold text-accent">{{ inv.invoice_number }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm font-bold text-text-primary">{{ inv.amount }} {{ inv.currency }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm font-bold text-text-primary">{{ inv.total_amount }} {{ inv.currency }}</p>
              </td>
              <td class="px-6 py-4">
                <span :class="statusClass(inv.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border">
                  {{ inv.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-text-muted">{{ formatDate(inv.due_date) }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-text-muted">{{ formatDate(inv.created_at) }}</p>
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

const invoices = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await client.get('/invoices')
    invoices.value = Array.isArray(data) ? data : data.invoices || []
  } catch {
    // Error handled silently
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusClass(status) {
  return {
    paid: 'bg-accent/5 text-accent border-accent/20',
    pending: 'bg-yellow-500/5 text-yellow-400 border-yellow-500/20',
    overdue: 'bg-red-500/5 text-red-400 border-red-500/20',
    cancelled: 'bg-white/5 text-text-muted border-border',
  }[status] || 'bg-white/5 text-text-muted border-border'
}
</script>
