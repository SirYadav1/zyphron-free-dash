<template>
  <div class="space-y-10 max-w-3xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/api" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to API Keys</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create API Key</h2>
      <p class="text-sm text-text-muted">Generate a new API access key with permissions</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <!-- Basic Info -->
      <div class="space-y-1">
        <label class="text-label">Memo</label>
        <input v-model="form.memo" type="text" class="input-field w-full" placeholder="e.g. My API Key" />
      </div>

      <div class="space-y-1">
        <label class="text-label">Token (optional)</label>
        <input v-model="form.token" type="text" class="input-field w-full font-mono" placeholder="Leave empty to auto-generate" />
        <p class="text-[11px] text-text-muted mt-1">Paste your own token or leave blank to generate one automatically.</p>
      </div>

      <!-- Permissions -->
      <div class="space-y-3">
        <label class="text-label">Permissions</label>
        <p class="text-[11px] text-text-muted">Select what this API key can access</p>
        
        <div class="space-y-4">
          <div v-for="(perm, resource) in permissions" :key="resource" class="border border-border rounded-lg p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  :id="`perm-${resource}`"
                  :checked="isAllSelected(resource)"
                  @change="toggleAll(resource)"
                  class="rounded border-border text-accent focus:ring-accent"
                />
                <label :for="`perm-${resource}`" class="text-sm font-bold text-text-primary">{{ perm.label }}</label>
              </div>
              <span class="text-[10px] text-text-muted">
                {{ getSelectedCount(resource) }}/{{ perm.actions.length }} selected
              </span>
            </div>
            <div class="flex flex-wrap gap-2 ml-6">
              <label 
                v-for="action in perm.actions" 
                :key="`${resource}:${action}`"
                class="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer hover:text-text-primary"
              >
                <input 
                  type="checkbox" 
                  :value="`${resource}:${action}`"
                  v-model="form.permissions"
                  class="rounded border-border text-accent focus:ring-accent"
                />
                {{ action }}
              </label>
            </div>
          </div>
        </div>

        <!-- Quick Select -->
        <div class="flex gap-2 pt-2">
          <button @click="selectAll" class="text-[11px] text-accent hover:text-accent/80">Select All</button>
          <span class="text-text-muted">|</span>
          <button @click="selectReadOnly" class="text-[11px] text-accent hover:text-accent/80">Read Only</button>
          <span class="text-text-muted">|</span>
          <button @click="selectWriteOnly" class="text-[11px] text-accent hover:text-accent/80">Write Only</button>
          <span class="text-text-muted">|</span>
          <button @click="clearAll" class="text-[11px] text-red-400 hover:text-red-300">Clear All</button>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="border-t border-border pt-4 space-y-4">
        <h3 class="text-sm font-bold text-text-primary">Advanced Settings</h3>
        
        <div class="space-y-1">
          <label class="text-label">IP Whitelist (optional)</label>
          <input v-model="form.ip_whitelist" type="text" class="input-field w-full" placeholder="192.168.1.1, 10.0.0.1 (comma separated, empty = allow all)" />
        </div>

        <div class="space-y-1">
          <label class="text-label">Rate Limit (requests per minute)</label>
          <input v-model.number="form.rate_limit" type="number" class="input-field w-32" min="1" max="1000" />
        </div>
      </div>

      <!-- Preview -->
      <div class="bg-base/50 rounded-lg p-4 space-y-2">
        <h4 class="text-xs font-bold text-text-muted uppercase">Preview</h4>
        <div class="text-xs text-text-secondary">
          <p><span class="text-text-primary">Memo:</span> {{ form.memo || 'Not set' }}</p>
          <p><span class="text-text-primary">Permissions:</span> {{ form.permissions.length }} selected</p>
          <p><span class="text-text-primary">IP Whitelist:</span> {{ form.ip_whitelist || 'All IPs' }}</p>
          <p><span class="text-text-primary">Rate Limit:</span> {{ form.rate_limit }} req/min</p>
        </div>
      </div>

      <!-- New Token Display -->
      <div v-if="newToken" class="p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <p class="text-xs font-bold text-accent mb-2">Your API Key (copy it now, it won't be shown again)</p>
        <div class="flex items-center gap-3">
          <code class="flex-1 p-2 bg-base rounded text-accent font-mono text-sm break-all">{{ newToken }}</code>
          <button @click="copyToken" class="btn-primary px-3 py-1 text-xs">Copy</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create API Key' }}
        </button>
        <router-link to="/admin/api" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import client from '../../api/client'

const router = useRouter()
const saving = ref(false)
const error = ref('')
const success = ref('')
const newToken = ref('')
const permissions = ref({})
const form = ref({
  memo: '',
  token: '',
  permissions: [],
  ip_whitelist: '',
  rate_limit: 60
})

onMounted(async () => {
  try {
    const { data } = await client.get('/admin/api/permissions/list')
    permissions.value = data
  } catch (err) {
    console.error('Failed to load permissions:', err)
  }
})

function isAllSelected(resource) {
  const actions = permissions.value[resource]?.actions || []
  return actions.every(action => form.value.permissions.includes(`${resource}:${action}`))
}

function toggleAll(resource) {
  const actions = permissions.value[resource]?.actions || []
  if (isAllSelected(resource)) {
    form.value.permissions = form.value.permissions.filter(p => !p.startsWith(`${resource}:`))
  } else {
    const newPerms = actions.map(action => `${resource}:${action}`)
    form.value.permissions = [...new Set([...form.value.permissions, ...newPerms])]
  }
}

function getSelectedCount(resource) {
  return form.value.permissions.filter(p => p.startsWith(`${resource}:`)).length
}

function selectAll() {
  const allPerms = []
  for (const [resource, perm] of Object.entries(permissions.value)) {
    for (const action of perm.actions) {
      allPerms.push(`${resource}:${action}`)
    }
  }
  form.value.permissions = allPerms
}

function selectReadOnly() {
  const readPerms = []
  for (const [resource, perm] of Object.entries(permissions.value)) {
    if (perm.actions.includes('read')) {
      readPerms.push(`${resource}:read`)
    }
  }
  form.value.permissions = readPerms
}

function selectWriteOnly() {
  const writePerms = []
  for (const [resource, perm] of Object.entries(permissions.value)) {
    if (perm.actions.includes('write')) {
      writePerms.push(`${resource}:write`)
    }
  }
  form.value.permissions = writePerms
}

function clearAll() {
  form.value.permissions = []
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  newToken.value = ''
  try {
    const { data } = await client.post('/admin/api', form.value)
    newToken.value = data.token || ''
    success.value = 'API key created'
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create API key'
  } finally {
    saving.value = false
  }
}

async function copyToken() {
  try {
    await navigator.clipboard.writeText(newToken.value)
  } catch { /* ignore */ }
}
</script>
