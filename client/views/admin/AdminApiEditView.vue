<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/api" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to API Keys</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit API Key</h2>
      <p class="text-sm text-text-muted">Modify API key memo</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="space-y-1">
          <label class="text-label">Memo</label>
          <input v-model="form.memo" type="text" class="input-field w-full" />
        </div>

        <div class="flex gap-3 pt-4 border-t border-border">
          <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link to="/admin/api" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../../api/client'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const form = ref({
  memo: ''
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/api/${route.params.id}`)
    const k = data.key || data
    form.value = {
      memo: k.memo || ''
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load API key'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.put(`/admin/api/${route.params.id}`, form.value)
    success.value = 'API key updated successfully'
    setTimeout(() => router.push('/admin/api'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update API key'
  } finally {
    saving.value = false
  }
}
</script>
