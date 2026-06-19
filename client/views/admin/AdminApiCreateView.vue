<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/api" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to API Keys</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create API Key</h2>
      <p class="text-sm text-text-muted">Generate a new API access key</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <label class="text-label">Memo</label>
        <input v-model="form.memo" type="text" class="input-field w-full" placeholder="e.g. My API Key" />
      </div>

      <div class="space-y-1">
        <label class="text-label">Token (optional)</label>
        <input v-model="form.token" type="text" class="input-field w-full font-mono" placeholder="Leave empty to auto-generate" />
        <p class="text-[11px] text-text-muted mt-1">Paste your own token or leave blank to generate one automatically.</p>
      </div>

      <div v-if="newToken" class="p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <p class="text-xs font-bold text-accent mb-2">Your API Key (copy it now, it won't be shown again)</p>
        <div class="flex items-center gap-3">
          <code class="flex-1 p-2 bg-base rounded text-accent font-mono text-sm break-all">{{ newToken }}</code>
          <button @click="copyToken" class="btn-primary px-3 py-1 text-xs">Copy</button>
        </div>
      </div>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import client from '../../api/client'

const router = useRouter()
const saving = ref(false)
const error = ref('')
const success = ref('')
const newToken = ref('')
const form = ref({
  memo: '',
  token: ''
})

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
