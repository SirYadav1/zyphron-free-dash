<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Email Templates</h2>
        <p class="text-sm text-text-muted">{{ templates.length }} templates configured</p>
      </div>
      <button @click="showCreateModal = true" class="btn-primary px-4 py-2 text-xs">Create Template</button>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2"><AlertTriangle :size="14" :stroke-width="2.5" /> {{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent flex items-center gap-2"><CheckCircle :size="14" :stroke-width="2.5" /> {{ success }}</div>

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">Name</th>
              <th class="px-5 py-3 text-label">Type</th>
              <th class="px-5 py-3 text-label">Subject</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="template in templates"
              :key="template.id"
              class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ template.name }}</td>
              <td class="px-5 py-3">
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="getTypeBadgeClass(template.type)">
                  {{ formatType(template.type) }}
                </span>
              </td>
              <td class="px-5 py-3 max-w-[300px] truncate text-text-muted text-sm">{{ template.subject }}</td>
              <td class="px-5 py-3">
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="template.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'"
                >
                  {{ template.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex gap-3 justify-end">
                  <router-link
                    :to="`/admin/email-templates/${template.id}/edit`"
                    class="text-xs font-bold text-accent hover:text-white transition-colors"
                  >Edit</router-link>
                  <button
                    @click="handleDelete(template)"
                    class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="templates.length === 0 && !loading" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Templates Found</p>
        <p class="text-sm text-text-muted/60">Create your first email template to get started.</p>
      </div>
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" @click.self="showCreateModal = false">
      <div class="card-surface p-6 space-y-6 w-full max-w-lg">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-text-primary">Create Email Template</h3>
          <button @click="showCreateModal = false" class="text-text-muted hover:text-text-primary transition-colors">&times;</button>
        </div>
        <div class="space-y-4">
          <div class="space-y-1">
            <label class="text-label">Template Name</label>
            <input v-model="createForm.name" type="text" class="input-field w-full" placeholder="e.g. welcome_email" />
          </div>
          <div class="space-y-1">
            <label class="text-label">Type</label>
            <select v-model="createForm.type" class="input-field w-full">
              <option value="">Select type...</option>
              <option v-for="t in templateTypes" :key="t" :value="t">{{ formatType(t) }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-label">Subject</label>
            <input v-model="createForm.subject" type="text" class="input-field w-full" placeholder="Welcome to company_name!" />
          </div>
          <div class="space-y-1">
            <label class="text-label">Body (HTML)</label>
            <textarea v-model="createForm.body" class="input-field w-full h-40 font-mono text-xs" placeholder="<h1>Welcome!</h1><p>Hi user_name,</p>"></textarea>
            <p class="text-[10px] text-text-muted">Use <code class="text-accent" v-text="'{{variable}}'"></code> syntax for dynamic values.</p>
          </div>
        </div>
        <div class="flex gap-3 pt-4 border-t border-border">
          <button @click="handleCreate" :disabled="creating" class="btn-primary px-6 py-2 text-xs">
            {{ creating ? 'Creating...' : 'Create Template' }}
          </button>
          <button @click="showCreateModal = false" class="btn-secondary px-6 py-2 text-xs">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'
import { AlertTriangle, CheckCircle } from 'lucide-vue-next'

const templates = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const showCreateModal = ref(false)
const creating = ref(false)

const createForm = ref({
  name: '',
  subject: '',
  body: '',
  type: '',
  is_active: true
})

const templateTypes = [
  'welcome',
  'password_reset',
  'server_suspended',
  'server_renewed',
  'payment_received',
  'ticket_created',
  'ticket_replied',
  'invoice_generated',
  '2fa_enabled',
  'account_banned',
  'account_unbanned'
]

function formatType(type) {
  return type ? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''
}

function getTypeBadgeClass(type) {
  const map = {
    welcome: 'bg-green-500/15 text-green-400',
    password_reset: 'bg-yellow-500/15 text-yellow-400',
    server_suspended: 'bg-red-500/15 text-red-400',
    server_renewed: 'bg-blue-500/15 text-blue-400',
    payment_received: 'bg-emerald-500/15 text-emerald-400',
    ticket_created: 'bg-purple-500/15 text-purple-400',
    ticket_replied: 'bg-indigo-500/15 text-indigo-400',
    invoice_generated: 'bg-cyan-500/15 text-cyan-400',
    '2fa_enabled': 'bg-orange-500/15 text-orange-400',
    account_banned: 'bg-red-600/15 text-red-300',
    account_unbanned: 'bg-green-600/15 text-green-300',
  }
  return map[type] || 'bg-gray-500/15 text-gray-400'
}

async function loadTemplates() {
  loading.value = true
  try {
    const { data } = await client.get('/admin/email-templates')
    templates.value = Array.isArray(data) ? data : data.templates || []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!createForm.value.name || !createForm.value.type) {
    error.value = 'Name and Type are required'
    return
  }
  creating.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/email-templates', createForm.value)
    success.value = 'Template created successfully'
    showCreateModal.value = false
    createForm.value = { name: '', subject: '', body: '', type: '', is_active: true }
    await loadTemplates()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create template'
  } finally {
    creating.value = false
  }
}

async function handleDelete(template) {
  if (!confirm(`Delete template "${template.name}"? This cannot be undone.`)) return
  error.value = ''
  success.value = ''
  try {
    await client.delete(`/admin/email-templates/${template.id}`)
    success.value = 'Template deleted'
    await loadTemplates()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete template'
  }
}

onMounted(() => loadTemplates())
</script>
