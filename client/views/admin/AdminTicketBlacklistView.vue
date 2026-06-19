<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Ticket Blacklist</h2>
        <p class="text-sm text-text-muted">{{ blacklist.length }} blacklisted items</p>
      </div>
      <router-link to="/admin/ticket" class="btn-secondary px-4 py-2 text-xs">Back to Tickets</router-link>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-4">
      <h3 class="text-label text-xs uppercase tracking-widest">Add to Blacklist</h3>
      <div class="flex items-center gap-3">
        <select v-model="newEntry.type" class="input-field flex-1">
          <option value="email">Email</option>
          <option value="ip">IP Address</option>
          <option value="domain">Domain</option>
        </select>
        <input v-model="newEntry.value" type="text" class="input-field flex-[2]" placeholder="Enter value to blacklist..." />
        <button @click="handleAdd" :disabled="adding || !newEntry.value.trim()" class="btn-primary px-6 py-2 whitespace-nowrap">
          {{ adding ? 'Adding...' : 'Add' }}
        </button>
      </div>
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Value</th>
              <th class="px-5 py-3 text-label">Added By</th>
              <th class="px-5 py-3 text-label">Date</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in blacklist" :key="b.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-text-muted">{{ b.type }}</span>
              </td>
              <td class="px-5 py-3 text-text-primary font-mono text-sm">{{ b.value }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ b.addedBy?.username || '---' }}</td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(b.createdAt) }}</td>
              <td class="px-5 py-3 text-right">
                <button @click="handleRemove(b)" class="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="blacklist.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">Blacklist Empty</p>
        <p class="text-sm text-text-muted/60">No items have been blacklisted.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const blacklist = ref([])
const adding = ref(false)
const error = ref('')
const success = ref('')
const newEntry = ref({
  type: 'email',
  value: ''
})

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/tickets/blacklist')
    blacklist.value = Array.isArray(data) ? data : data.blacklist || []
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '---'
}

async function handleAdd() {
  adding.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await client.post('/admin/tickets/blacklist', newEntry.value)
    blacklist.value.push(data.entry || data)
    newEntry.value.value = ''
    success.value = 'Added to blacklist'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to add'
  } finally {
    adding.value = false
  }
}

async function handleRemove(entry) {
  if (!confirm(`Remove "${entry.value}" from blacklist?`)) return
  try {
    await client.delete(`/admin/tickets/blacklist/${entry.id}`)
    blacklist.value = blacklist.value.filter(b => b.id !== entry.id)
    success.value = 'Removed from blacklist'
  } catch { /* ignore */ }
}
</script>
