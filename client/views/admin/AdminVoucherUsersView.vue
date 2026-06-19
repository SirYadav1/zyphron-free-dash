<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/vouchers" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Vouchers</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Voucher Users</h2>
      <p class="text-sm text-text-muted">Code: <span class="text-accent font-mono font-bold">{{ code }}</span></p>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">User ID</th>
              <th class="px-5 py-3 text-label">Username</th>
              <th class="px-5 py-3 text-label">Email</th>
              <th class="px-5 py-3 text-label">Redeemed At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ u.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ u.username }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ u.email }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ formatDate(u.redeemedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="users.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Users Found</p>
        <p class="text-sm text-text-muted/60">This voucher has not been redeemed by anyone yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '../../api/client'

const route = useRoute()
const users = ref([])
const code = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/vouchers/${route.params.id}/users`)
    users.value = Array.isArray(data) ? data : data.users || []
    code.value = data.code || ''
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
