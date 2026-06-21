<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Invoice Management</h2>
        <p class="text-sm text-text-muted">{{ invoices.length }} total invoices</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary inline-flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Generate Invoice
      </button>
    </div>

    <!-- Status Filter -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="s in statusFilters"
        :key="s.value"
        @click="activeStatus = s.value"
        class="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border"
        :class="activeStatus === s.value
          ? 'bg-accent/10 text-accent border-accent/20'
          : 'bg-white/5 text-text-muted border-border hover:border-accent/20'"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading invoices...</p>
    </div>

    <!-- Invoices Table -->
    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Invoice #</th>
              <th class="px-5 py-3 text-label">User</th>
              <th class="px-5 py-3 text-label">Amount</th>
              <th class="px-5 py-3 text-label">Total</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label">Due Date</th>
              <th class="px-5 py-3 text-label">Created</th>
              <th class="px-5 py-3 text-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in filteredInvoices" :key="inv.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span class="text-accent font-bold text-xs">{{ inv.invoice_number }}</span>
              </td>
              <td class="px-5 py-3">
                <span class="text-text-primary font-bold text-sm">{{ inv.user?.username || '---' }}</span>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ inv.amount }} {{ inv.currency }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-xs">{{ inv.total_amount }} {{ inv.currency }}</td>
              <td class="px-5 py-3">
                <select
                  :value="inv.status"
                  @change="updateStatus(inv.id, $event.target.value)"
                  class="bg-base border border-border rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-1 focus:ring-accent/30"
                  :class="statusClass(inv.status)"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(inv.due_date) }}</td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(inv.created_at) }}</td>
              <td class="px-5 py-3">
                <button @click="deleteInvoice(inv.id)" class="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider transition-colors">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredInvoices.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Invoices Found</p>
        <p class="text-sm text-text-muted/60">No invoices match the selected filter.</p>
      </div>
    </div>

    <!-- Create Invoice Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="w-full max-w-lg bg-surface border border-border rounded-xl p-6 space-y-6 shadow-2xl">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-text-primary">Generate Invoice</h3>
          <button @click="showCreateModal = false" class="text-text-muted hover:text-text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">User ID</label>
            <input v-model="createForm.user_id" type="text" placeholder="Optional - leave blank for unassigned"
              class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30" />
          </div>
          <div>
            <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Amount</label>
            <input v-model.number="createForm.amount" type="number" min="0" placeholder="0"
              class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted/40 focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Currency</label>
              <select v-model="createForm.currency"
                class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Due Date</label>
              <input v-model="createForm.due_date" type="date"
                class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Status</label>
            <select v-model="createForm.status"
              class="w-full bg-base border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button @click="showCreateModal = false" class="px-4 py-2 text-sm font-medium text-text-muted border border-border rounded-lg hover:bg-white/5 transition-all">
            Cancel
          </button>
          <button @click="createInvoice" :disabled="creating" class="btn-primary">
            {{ creating ? 'Creating...' : 'Generate Invoice' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../../api/client'

const invoices = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)
const activeStatus = ref('all')

const createForm = ref({
  user_id: '',
  amount: 0,
  tax_amount: 0,
currency: 'INR',
  status: 'pending',
  due_date: '',
})

const statusFilters = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
]

const filteredInvoices = computed(() => {
  if (activeStatus.value === 'all') return invoices.value
  return invoices.value.filter(i => i.status === activeStatus.value)
})

onMounted(async () => {
  await fetchInvoices()
})

async function fetchInvoices() {
  loading.value = true
  try {
    const { data } = await client.get('/invoices/all')
    invoices.value = Array.isArray(data) ? data : data.invoices || []
  } catch { /* ignore */ }
  loading.value = false
}

async function createInvoice() {
  creating.value = true
  try {
    const payload = {
      amount: createForm.value.amount,
      tax_amount: 0,
      total_amount: createForm.value.amount,
      currency: createForm.value.currency,
      status: createForm.value.status,
      due_date: createForm.value.due_date || null,
    }
    if (createForm.value.user_id) {
      payload.user_id = createForm.value.user_id
    }
    await client.post('/invoices', payload)
    showCreateModal.value = false
    createForm.value = { user_id: '', amount: 0, currency: 'INR', status: 'pending', due_date: '' }
    await fetchInvoices()
  } catch { /* ignore */ }
  creating.value = false
}

async function updateStatus(id, newStatus) {
  try {
    await client.patch(`/invoices/${id}`, { status: newStatus })
    await fetchInvoices()
  } catch { /* ignore */ }
}

async function deleteInvoice(id) {
  if (!confirm('Are you sure you want to delete this invoice?')) return
  try {
    await client.delete(`/invoices/${id}`)
    await fetchInvoices()
  } catch { /* ignore */ }
}

function statusClass(status) {
  return {
    paid: 'text-accent bg-accent/10',
    pending: 'text-yellow-500 bg-yellow-500/10',
    overdue: 'text-red-500 bg-red-500/10',
    cancelled: 'text-text-muted bg-white/5',
  }[status] || 'text-text-muted bg-white/5'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
