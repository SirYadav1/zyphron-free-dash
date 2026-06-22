<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">API Keys</h2>
        <p class="text-sm text-text-muted">{{ keys.length }} registered keys</p>
      </div>
      <router-link to="/admin/api/create" class="btn-primary px-4 py-2 text-xs">Create API Key</router-link>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">Token</th>
              <th class="px-5 py-3 text-label">Memo</th>
              <th class="px-5 py-3 text-label">Created</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in keys" :key="k.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs">{{ k.id }}</td>
              <td class="px-5 py-3">
                <span class="text-accent font-mono text-sm">{{ maskToken(k.token) }}</span>
              </td>
              <td class="px-5 py-3 text-text-primary text-sm">{{ k.memo }}</td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(k.created_at || k.createdAt) }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/admin/api/${k.id}/edit`" class="text-xs font-bold text-accent hover:text-white transition-colors">Edit</router-link>
                  <button @click="handleDelete(k)" class="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="keys.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No API Keys Found</p>
        <p class="text-sm text-text-muted/60">Create your first API key.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const keys = ref([])

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/api')
    keys.value = Array.isArray(data) ? data : data.keys || []
  } catch { /* ignore */ }
})

function maskToken(token) {
  if (!token) return '---'
  if (token.length <= 8) return token
  return token.substring(0, 4) + '...' + token.substring(token.length - 4)
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}

async function handleDelete(key) {
  if (!confirm(`Delete API key "${key.memo}"?`)) return
  try {
    await client.delete(`/admin/api/${key.id}`)
    keys.value = keys.value.filter(k => k.id !== key.id)
  } catch { /* ignore */ }
}
</script>
