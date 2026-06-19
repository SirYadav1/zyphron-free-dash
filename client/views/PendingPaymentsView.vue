<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header -->
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Pending Payments</h2>
      <p class="text-sm text-text-muted">Orders waiting for payment confirmation or review.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Orders...</p>
    </div>

    <!-- No orders -->
    <div v-else-if="pendingOrders.length === 0" class="card-surface p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-amber-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-text-muted font-medium">No pending payments</p>
      <p class="text-xs text-text-muted mt-1">Your pending orders will appear here.</p>
      <router-link to="/store" class="btn-primary inline-block mt-6 px-6 py-2 text-sm">Visit Coin Shop</router-link>
    </div>

    <!-- Orders list -->
    <div v-else class="space-y-4">
      <div
        v-for="order in pendingOrders"
        :key="order.id"
        class="card-surface p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-text-primary">{{ order.package_name }}</p>
            <p class="text-xs text-text-muted mt-0.5">Order #{{ order.id }} &middot; {{ formatDate(order.created_at) }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-bold text-text-primary tabular-nums">{{ order.price }} {{ order.currency_code }}</p>
            <p class="text-xs text-accent font-bold tabular-nums">{{ order.coins_amount }} coins</p>
          </div>
          <router-link :to="`/store/order/${order.id}`" class="btn-primary px-4 py-1.5 text-xs">
            View
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../api/client'

const orders = ref([])
const loading = ref(true)

const pendingOrders = computed(() =>
  orders.value.filter(o => ['pending', 'awaiting_screenshot'].includes(o.status))
)

onMounted(async () => {
  try {
    const { data } = await client.get('/coin-orders/list')
    orders.value = Array.isArray(data) ? data : data.orders || []
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
