<template>
  <div class="space-y-10 max-w-4xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/email-templates" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Templates</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">{{ isCreate ? 'Create Email Template' : 'Edit Email Template' }}</h2>
      <p class="text-sm text-text-muted">{{ isCreate ? 'Create a new email template' : 'Modify email template details' }}</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Form -->
      <div class="card-surface p-6 space-y-6">
        <div v-if="loading" class="flex items-center justify-center py-12">
          <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>

        <template v-else>
          <div class="space-y-1">
            <label class="text-label">Template Name</label>
            <input v-model="form.name" type="text" class="input-field w-full" placeholder="e.g. welcome_email" />
            <p class="text-[10px] text-text-muted/60 mt-1">Unique identifier used in code to reference this template</p>
          </div>

          <div class="space-y-1">
            <label class="text-label">Subject</label>
            <input v-model="form.subject" type="text" class="input-field w-full" placeholder="Welcome to our platform!" />
          </div>

          <div class="space-y-1">
            <label class="text-label">Type</label>
            <select v-model="form.type" class="input-field w-full">
              <option value="welcome">Welcome</option>
              <option value="password_reset">Password Reset</option>
              <option value="server_suspended">Server Suspended</option>
              <option value="server_renewed">Server Renewed</option>
              <option value="payment_received">Payment Received</option>
              <option value="ticket_created">Ticket Created</option>
              <option value="ticket_replied">Ticket Replied</option>
              <option value="invoice_generated">Invoice Generated</option>
              <option value="2fa_enabled">2FA Enabled</option>
              <option value="account_banned">Account Banned</option>
              <option value="account_unbanned">Account Unbanned</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-label">Active</label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.is_active" class="w-4 h-4 rounded border-border bg-base text-accent focus:ring-accent" />
              <span class="text-sm text-text-muted">{{ form.is_active ? 'Active' : 'Inactive' }}</span>
            </label>
          </div>

          <div class="space-y-1">
            <label class="text-label">Body (HTML)</label>
            <textarea v-model="form.body" rows="12" class="input-field w-full font-mono text-xs" placeholder="Enter HTML content..."></textarea>
            <p class="text-[10px] text-text-muted/60 mt-1">Use the variable syntax shown in the preview panel for dynamic values</p>
          </div>

          <div v-if="!isCreate" class="flex gap-3 pt-4 border-t border-border">
            <button @click="handleSave" :disabled="saving" class="btn-primary px-6 py-2">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <button @click="handleDelete" :disabled="deleting" class="px-6 py-2 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors">
              {{ deleting ? 'Deleting...' : 'Delete Template' }}
            </button>
            <router-link to="/admin/email-templates" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
          </div>
          <div v-else class="flex gap-3 pt-4 border-t border-border">
            <button @click="handleCreate" :disabled="saving" class="btn-primary px-6 py-2">
              {{ saving ? 'Creating...' : 'Create Template' }}
            </button>
            <router-link to="/admin/email-templates" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
          </div>
        </template>
      </div>

      <!-- Preview -->
      <div class="card-surface p-6 space-y-4">
        <h3 class="text-sm font-bold text-text-primary">Preview</h3>

        <div class="space-y-2">
          <label class="text-label text-xs">Test Variables (JSON)</label>
          <textarea v-model="previewVars" rows="4" class="input-field w-full font-mono text-xs" placeholder='{"first_name": "John", "company_name": "Zyphron"}'></textarea>
        </div>

        <div class="space-y-1">
          <p class="text-label text-xs">Subject Preview</p>
          <div class="p-3 bg-base rounded-md border border-border text-sm text-text-primary">{{ renderedSubject }}</div>
        </div>

        <div class="space-y-1">
          <p class="text-label text-xs">Body Preview</p>
          <div class="p-4 bg-base rounded-md border border-border overflow-auto" style="max-height: 400px;">
            <div class="text-sm text-text-primary" v-html="renderedBody"></div>
          </div>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-400 space-y-1">
          <p class="font-bold">Available Variables</p>
          <p class="text-blue-400/80">Use double curly braces in your template, e.g. <code class="text-blue-300" v-text="sampleVar"></code></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../../api/client'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const success = ref('')
const isCreate = computed(() => route.name === 'AdminEmailTemplateCreate')
const previewVars = ref('{\n  "first_name": "John",\n  "company_name": "Zyphron"\n}')
const sampleVar = '{{first_name}}'

const form = ref({
  name: '',
  subject: '',
  body: '',
  type: 'welcome',
  is_active: true,
})

const renderedSubject = computed(() => {
  try {
    const vars = JSON.parse(previewVars.value)
    let s = form.value.subject
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp('{{\\s*' + k + '\\s*}}', 'g'), v)
    }
    return s
  } catch {
    return form.value.subject
  }
})

const renderedBody = computed(() => {
  try {
    const vars = JSON.parse(previewVars.value)
    let b = form.value.body
    for (const [k, v] of Object.entries(vars)) {
      b = b.replace(new RegExp('{{\\s*' + k + '\\s*}}', 'g'), v)
    }
    return b
  } catch {
    return form.value.body
  }
})

onMounted(async () => {
  if (!isCreate.value) {
    try {
      const { data } = await client.get('/admin/email-templates/' + route.params.id)
      form.value = {
        name: data.name || '',
        subject: data.subject || '',
        body: data.body || '',
        type: data.type || 'welcome',
        is_active: data.is_active !== false,
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to load template'
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
})

async function handleCreate() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/email-templates', form.value)
    success.value = 'Template created successfully'
    setTimeout(() => router.push('/admin/email-templates'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create template'
  } finally {
    saving.value = false
  }
}

async function handleSave() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.patch('/admin/email-templates/' + route.params.id, form.value)
    success.value = 'Template updated successfully'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to save template'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm('Delete this template? This cannot be undone.')) return
  deleting.value = true
  error.value = ''
  success.value = ''
  try {
    await client.delete('/admin/email-templates/' + route.params.id)
    success.value = 'Template deleted'
    setTimeout(() => router.push('/admin/email-templates'), 800)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete template'
  } finally {
    deleting.value = false
  }
}
</script>
