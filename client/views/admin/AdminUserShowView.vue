<template>
  <div class="space-y-10">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <div class="flex items-center gap-3">
          <router-link to="/admin/users" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Users</router-link>
        </div>
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ user.username || 'Loading...' }}</h2>
        <p class="text-sm text-text-muted">User ID: {{ user.id }}</p>
      </div>
      <div class="flex items-center gap-3">
        <router-link :to="`/admin/users/${user.id}/edit`" class="btn-primary px-4 py-2 text-xs">Edit User</router-link>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <template v-else-if="error">
      <div class="bg-[#1e293b] border border-border rounded-xl p-6 text-center">
        <p class="text-red-500 font-bold">{{ error }}</p>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-[#1e293b] border border-border rounded-xl p-6 space-y-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
              {{ user.username ? user.username[0].toUpperCase() : '?' }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-text-primary">{{ user.username }}</h3>
              <p class="text-sm text-text-muted">{{ user.email }}</p>
              <span :class="user.isAdmin ? 'text-purple-400 bg-purple-500/10' : user.isBanned ? 'text-red-500 bg-red-500/10' : 'text-accent bg-accent/10'" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mt-1">
                {{ user.isBanned ? 'Banned' : user.isAdmin ? 'Admin' : 'Active' }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-[#1e293b] border border-border rounded-xl p-6 space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Account Details</p>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-text-muted">Coins</span>
              <span class="text-sm font-bold text-accent">{{ user.coins }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-text-muted">Servers</span>
              <span class="text-sm font-bold text-text-primary">{{ user.serverCount || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-text-muted">Email Verified</span>
              <span class="text-sm font-bold" :class="user.emailVerified ? 'text-accent' : 'text-yellow-500'">{{ user.emailVerified ? 'Yes' : 'No' }}</span>
            </div>
            <div v-if="user.first_name || user.last_name" class="flex justify-between">
              <span class="text-sm text-text-muted">Client Name</span>
              <span class="text-sm font-bold text-text-primary">{{ user.last_name }}{{ user.first_name ? ', ' + user.first_name : '' }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#1e293b] border border-border rounded-xl p-6 space-y-4">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Dates</p>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-sm text-text-muted">Created</span>
              <span class="text-sm font-bold text-text-primary">{{ formatDate(user.createdAt) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-text-muted">Updated</span>
              <span class="text-sm font-bold text-text-primary">{{ formatDate(user.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#1e293b] border border-border rounded-xl overflow-hidden">
        <div class="px-6 py-4 border-b border-border bg-[#0f172a]/50">
          <h3 class="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Servers ({{ servers.length }})</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border bg-[#0f172a]/30 text-left">
                <th class="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">ID</th>
                <th class="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Name</th>
                <th class="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Status</th>
                <th class="px-5 py-3 text-[10px] font-bold text-text-muted uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in servers" :key="s.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                <td class="px-5 py-3 text-text-muted text-xs font-mono">{{ s.id }}</td>
                <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ s.serverName }}</td>
                <td class="px-5 py-3">
                  <span :class="s.status === 'active' ? 'text-accent bg-accent/10' : s.status === 'suspended' ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10'" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{{ s.status }}</span>
                </td>
                <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(s.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="servers.length === 0" class="py-12 text-center">
          <p class="text-text-muted text-sm">This user has no servers.</p>
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
const user = ref({})
const servers = ref([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/users/${route.params.id}`)
    user.value = data.user || data
    servers.value = data.servers || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load user'
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}
</script>
