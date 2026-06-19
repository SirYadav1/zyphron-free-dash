<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/servers" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Servers</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ server.serverName || 'Loading...' }}</h2>
      <p class="text-sm text-text-muted">Server ID: {{ server.id }}</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Name</span>
            <span class="text-text-primary text-sm font-bold">{{ server.serverName }}</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Status</span>
            <span :class="server.status === 'active' ? 'text-accent' : 'text-yellow-500'" class="text-sm font-bold">{{ server.status }}</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Owner</span>
            <span class="text-text-primary text-sm">{{ server.user?.username || '---' }}</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Owner Email</span>
            <span class="text-text-primary text-sm">{{ server.user?.email || '---' }}</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">RAM</span>
            <span class="text-blue-400 text-sm font-bold">{{ server.ramMb }} MB</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">CPU</span>
            <span class="text-amber-400 text-sm font-bold">{{ server.cpuPercent }}%</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Disk</span>
            <span class="text-purple-400 text-sm font-bold">{{ server.diskMb }} MB</span>
          </div>
          <div class="bg-base/50 border border-border rounded-xl p-4">
            <span class="text-label block mb-1">Created</span>
            <span class="text-text-primary text-sm">{{ formatDate(server.createdAt) }}</span>
          </div>
        </div>

        <div class="space-y-3 pt-4 border-t border-border">
          <p class="text-label">Actions</p>
          <div class="flex gap-3">
            <button @click="handleToggleSuspend" :disabled="acting" class="btn-secondary px-6 py-2"
              :class="server.status === 'active' ? 'text-yellow-500 hover:border-yellow-500/50' : 'text-accent'">
              {{ acting ? 'Processing...' : server.status === 'active' ? 'Suspend Server' : 'Unsuspend Server' }}
            </button>
            <button @click="handleDelete" :disabled="acting" class="btn-secondary text-red-500 border-red-500/20 hover:bg-red-500/10 px-6 py-2">
              {{ acting ? 'Processing...' : 'Delete Server' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../../api/client'
import { useAdminStore } from '../../stores/admin'

const route = useRoute()
const router = useRouter()
const store = useAdminStore()
const server = ref({})
const loading = ref(true)
const acting = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/servers/${route.params.id}`)
    server.value = data.server || data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load server'
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}

async function handleToggleSuspend() {
  acting.value = true
  error.value = ''
  success.value = ''
  try {
    if (server.value.status === 'active') {
      await store.suspendServer(server.value.id)
      server.value.status = 'suspended'
      success.value = 'Server suspended'
    } else {
      await store.unsuspendServer(server.value.id)
      server.value.status = 'active'
      success.value = 'Server unsuspended'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Action failed'
  } finally {
    acting.value = false
  }
}

async function handleDelete() {
  if (!confirm(`Delete server "${server.value.serverName}"? This cannot be undone.`)) return
  acting.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post(`/admin/servers/${server.value.id}/delete`)
    success.value = 'Server deleted'
    setTimeout(() => router.push('/admin/servers'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete'
  } finally {
    acting.value = false
  }
}
</script>
