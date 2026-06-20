<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Activity Logs</h2>
      <p class="text-sm text-text-muted">{{ logs.length }} recorded events</p>
    </div>

    <div class="flex items-center gap-3">
      <input v-model="searchQuery" type="text" placeholder="Search logs..." class="input-field w-full sm:w-64" />
    </div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Description</th>
              <th class="px-5 py-3 text-label">Subject</th>
              <th class="px-5 py-3 text-label">Causer</th>
              <th class="px-5 py-3 text-label">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-primary text-sm max-w-[300px] truncate">{{ log.description }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ log.subject || '---' }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ log.causer || 'System' }}</td>
              <td class="px-5 py-3 text-text-muted text-xs">{{ formatDate(log.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredLogs.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Logs Found</p>
        <p class="text-sm text-text-muted/60">{{ searchQuery ? 'No logs match your search.' : 'No activity has been recorded yet.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import client from '../../api/client'

const logs = ref([])
const searchQuery = ref('')

const filteredLogs = computed(() => {
  if (!searchQuery.value) return logs.value
  const q = searchQuery.value.toLowerCase()
  return logs.value.filter(l =>
    (l.description || '').toLowerCase().includes(q) ||
    (l.subject || '').toLowerCase().includes(q) ||
    (l.causer || '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/activitylogs')
    logs.value = Array.isArray(data) ? data : data.logs || []
  } catch { /* ignore */ }
})

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'
}
</script>
