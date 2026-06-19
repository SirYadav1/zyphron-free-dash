<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Payment History</h2>
      <p class="text-sm text-text-muted">{{ payments.length }} total transactions</p>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">User</th>
              <th class="px-5 py-3 text-label">Amount</th>
              <th class="px-5 py-3 text-label">Method</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ p.id }}</td>
              <td class="px-5 py-3">
                <span class="text-text-primary font-bold text-sm">{{ p.user?.username || '---' }}</span>
              </td>
              <td class="px-5 py-3 text-accent font-bold">{{ p.amount }}</td>
              <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-text-muted">{{ p.method }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="statusClass(p.status)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {{ p.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="payments.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Payments Found</p>
        <p class="text-sm text-text-muted/60">No transactions have been made yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const payments = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/payments')
    payments.value = Array.isArray(data) ? data : data.payments || []
  } catch { /* ignore */ }
})

function statusClass(status) {
  return {
    completed: 'text-accent bg-accent/10',
    pending: 'text-yellow-500 bg-yellow-500/10',
    failed: 'text-red-500 bg-red-500/10',
    refunded: 'text-purple-400 bg-purple-500/10'
  }[status] || 'text-text-muted bg-white/5'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
