<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Vouchers</h2>
        <p class="text-sm text-text-muted">{{ vouchers.length }} voucher codes</p>
      </div>
      <router-link to="/admin/vouchers/create" class="btn-primary px-4 py-2 text-xs">Create Voucher</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Code</th>
              <th class="px-5 py-3 text-label">Credits</th>
              <th class="px-5 py-3 text-label">Uses</th>
              <th class="px-5 py-3 text-label">Expires</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in vouchers" :key="v.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span class="text-accent font-mono font-bold text-sm">{{ v.code }}</span>
              </td>
              <td class="px-5 py-3 text-accent font-bold">{{ v.credits }}</td>
              <td class="px-5 py-3 text-text-primary text-sm">{{ v.uses || 0 }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ formatDate(v.expires_at) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/admin/vouchers/${v.id}/users`" class="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Users</router-link>
                  <router-link :to="`/admin/vouchers/${v.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="vouchers.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Vouchers Found</p>
        <p class="text-sm text-text-muted/60">Create your first voucher code.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const vouchers = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/vouchers')
    vouchers.value = Array.isArray(data) ? data : data.vouchers || []
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
