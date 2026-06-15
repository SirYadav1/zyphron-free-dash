<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Coin Orders</h2>
        <p class="text-sm text-text-muted">{{ orders.length }} total orders</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500">
          {{ pendingCount }} pending review
        </span>
      </div>
    </div>

    <!-- Status Filter -->
    <div class="flex items-center gap-3">
      <label class="text-label text-xs">Filter:</label>
      <select v-model="filterStatus" class="input-field w-48 text-xs py-1.5">
        <option :value="null">All Orders</option>
        <option value="pending">Pending Payment</option>
        <option value="awaiting_screenshot">Awaiting Review</option>
        <option value="approved">Approved</option>
        <option value="declined">Declined</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Orders Table -->
    <div v-else class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">User</th>
              <th class="px-5 py-3 text-label">Package</th>
              <th class="px-5 py-3 text-label">Coins</th>
              <th class="px-5 py-3 text-label">Price</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label">Date</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in filteredOrders" :key="o.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-sm">#{{ o.id }}</td>
              <td class="px-5 py-3 text-text-primary text-sm font-bold">
                {{ o.user?.username || o.user_id }}
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ o.package_name }}</td>
              <td class="px-5 py-3 text-accent font-bold">{{ o.coins_amount }}</td>
              <td class="px-5 py-3 text-text-primary text-sm">{{ o.price }} {{ o.currency_code }}</td>
              <td class="px-5 py-3">
                <span
                  :class="{
                    'bg-amber-500/10 text-amber-500': o.status === 'pending',
                    'bg-blue-500/10 text-blue-500': o.status === 'awaiting_screenshot',
                    'bg-emerald-500/10 text-emerald-500': o.status === 'approved',
                    'bg-red-500/10 text-red-500': o.status === 'declined',
                  }"
                  class="text-xs font-bold px-2 py-1 rounded-full"
                >
                  {{ statusLabels[o.status] || o.status }}
                </span>
              </td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(o.created_at) }}</td>
              <td class="px-5 py-3 text-right">
                <button @click="openModal(o)" class="text-xs font-bold text-accent hover:text-white transition-colors">
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="orders.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Orders Yet</p>
        <p class="text-sm text-text-muted/60">Orders will appear here when users purchase coin packages.</p>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="selectedOrder" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="selectedOrder = null">
      <div class="card-surface w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-6">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-text-primary">Order #{{ selectedOrder.id }}</h3>
          <button @click="selectedOrder = null" class="text-text-muted hover:text-text-primary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Order Info -->
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">User</span>
            <span class="text-text-primary font-bold">{{ selectedOrder.user?.username || selectedOrder.user_id }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Package</span>
            <span class="text-text-primary font-bold">{{ selectedOrder.package_name }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Coins</span>
            <span class="text-accent font-bold">{{ selectedOrder.coins_amount }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Price</span>
            <span class="text-text-primary font-bold">{{ selectedOrder.price }} {{ selectedOrder.currency_code }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Status</span>
            <span
              :class="{
                'bg-amber-500/10 text-amber-500': selectedOrder.status === 'pending',
                'bg-blue-500/10 text-blue-500': selectedOrder.status === 'awaiting_screenshot',
                'bg-emerald-500/10 text-emerald-500': selectedOrder.status === 'approved',
                'bg-red-500/10 text-red-500': selectedOrder.status === 'declined',
              }"
              class="text-xs font-bold px-2 py-1 rounded-full"
            >
              {{ statusLabels[selectedOrder.status] || selectedOrder.status }}
            </span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-text-muted">Created</span>
            <span class="text-text-primary text-xs">{{ formatDate(selectedOrder.created_at) }}</span>
          </div>
        </div>

        <!-- Screenshot -->
        <div v-if="selectedOrder.screenshot_path" class="space-y-2">
          <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Payment Screenshot</p>
          <div class="rounded-xl overflow-hidden border border-border">
            <img :src="selectedOrder.screenshot_path" alt="Payment screenshot" class="w-full max-h-64 object-contain bg-base/50" />
          </div>
        </div>

        <!-- Admin Message -->
        <div v-if="selectedOrder.admin_message" class="p-3 bg-white/[0.03] border border-border rounded-lg">
          <p class="text-xs font-bold text-text-muted mb-1">Admin Message</p>
          <p class="text-sm text-text-primary">{{ selectedOrder.admin_message }}</p>
        </div>

        <!-- Admin Message Input -->
        <div class="space-y-1">
          <label class="text-label text-xs">Message (optional)</label>
          <textarea v-model="adminMessage" class="input-field w-full text-sm" rows="2" placeholder="Add a note for this order..."></textarea>
        </div>

        <!-- Actions -->
        <div v-if="selectedOrder.status === 'awaiting_screenshot'" class="flex gap-3 pt-2">
          <button @click="approveOrder" :disabled="acting" class="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold py-2.5 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors">
            {{ acting ? 'Processing...' : '✅ Approve & Credit Coins' }}
          </button>
          <button @click="declineOrder" :disabled="acting" class="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 font-bold py-2.5 rounded-lg text-sm hover:bg-red-500/20 transition-colors">
            {{ acting ? 'Processing...' : '❌ Decline' }}
          </button>
        </div>
        <div v-else class="pt-2">
          <button @click="sendMessage" :disabled="acting || !adminMessage" class="w-full bg-accent/10 border border-accent/20 text-accent font-bold py-2.5 rounded-lg text-sm hover:bg-accent/20 transition-colors">
            {{ acting ? 'Sending...' : '💬 Send Message' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../../api/client'

const orders = ref([])
const loading = ref(true)
const filterStatus = ref(null)
const selectedOrder = ref(null)
const adminMessage = ref('')
const acting = ref(false)
const pendingCount = ref(0)

const statusLabels = {
  pending: 'Awaiting Payment',
  awaiting_screenshot: 'Under Review',
  approved: 'Approved',
  declined: 'Declined',
}

const filteredOrders = computed(() => {
  if (filterStatus.value === null) return orders.value
  return orders.value.filter(o => o.status === filterStatus.value)
})

function formatDate(dateStr) {
  if (!dateStr) return '---'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openModal(order) {
  selectedOrder.value = { ...order }
  adminMessage.value = order.admin_message || ''
}

async function loadOrders() {
  loading.value = true
  try {
    const [ordersRes, countRes] = await Promise.all([
      client.get('/admin/coin-orders'),
      client.get('/admin/coin-orders/pending-count').catch(() => ({ data: { count: 0 } })),
    ])
    orders.value = Array.isArray(ordersRes.data) ? ordersRes.data : []
    pendingCount.value = countRes.data.count || 0
  } catch { /* ignore */ }
  loading.value = false
}

async function approveOrder() {
  if (!selectedOrder.value || acting.value) return
  acting.value = true
  try {
    await client.post(`/admin/coin-orders/${selectedOrder.value.id}/approve`, {
      message: adminMessage.value || undefined,
    })
    selectedOrder.value = null
    adminMessage.value = ''
    await loadOrders()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to approve order')
  }
  acting.value = false
}

async function declineOrder() {
  if (!selectedOrder.value || acting.value) return
  acting.value = true
  try {
    await client.post(`/admin/coin-orders/${selectedOrder.value.id}/decline`, {
      message: adminMessage.value || undefined,
    })
    selectedOrder.value = null
    adminMessage.value = ''
    await loadOrders()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to decline order')
  }
  acting.value = false
}

async function sendMessage() {
  if (!selectedOrder.value || acting.value || !adminMessage.value) return
  acting.value = true
  try {
    await client.post(`/admin/coin-orders/${selectedOrder.value.id}/message`, {
      message: adminMessage.value,
    })
    // refresh order data
    const { data } = await client.get(`/admin/coin-orders/${selectedOrder.value.id}`)
    selectedOrder.value = { ...data }
    adminMessage.value = data.admin_message || ''
    await loadOrders()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to send message')
  }
  acting.value = false
}

onMounted(loadOrders)
</script>
