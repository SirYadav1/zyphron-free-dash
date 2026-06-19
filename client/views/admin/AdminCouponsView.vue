<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Coupons</h2>
        <p class="text-sm text-text-muted">{{ coupons.length }} coupon codes</p>
      </div>
      <router-link to="/admin/coupons/create" class="btn-primary px-4 py-2 text-xs">Create Coupon</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Code</th>
              <th class="px-5 py-3 text-label">Discount</th>
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Uses</th>
              <th class="px-5 py-3 text-label">Expires</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in coupons" :key="c.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span class="text-accent font-mono font-bold text-sm">{{ c.code }}</span>
              </td>
              <td class="px-5 py-3 text-text-primary font-bold">{{ c.discount }}{{ c.type === 'percentage' ? '%' : '' }}</td>
              <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" :class="c.type === 'percentage' ? 'text-blue-400 bg-blue-500/10' : 'text-accent bg-accent/10'">
                  {{ c.type }}
                </span>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ c.uses || 0 }} / {{ c.maxUses || 'Unlimited' }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ formatDate(c.expiresAt) }}</td>
              <td class="px-5 py-3">
                <span :class="c.isActive ? 'text-accent' : 'text-red-500'" class="text-xs font-bold">{{ c.isActive ? 'Active' : 'Inactive' }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <router-link :to="`/admin/coupons/${c.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="coupons.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Coupons Found</p>
        <p class="text-sm text-text-muted/60">Create your first coupon code.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const coupons = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/coupons')
    coupons.value = Array.isArray(data) ? data : data.coupons || []
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
