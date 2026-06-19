<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/partners" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Partners</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Partner</h2>
      <p class="text-sm text-text-muted">Add a new partner discount</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <label class="text-label">User ID</label>
        <input v-model="form.user_id" type="text" class="input-field w-full" placeholder="Enter user UUID" />
      </div>
      <div class="space-y-1">
        <label class="text-label">Partner Discount (%)</label>
        <input v-model.number="form.partner_discount" type="number" class="input-field w-full" />
      </div>
      <div class="space-y-1">
        <label class="text-label">Registered User Discount (%)</label>
        <input v-model.number="form.registered_user_discount" type="number" class="input-field w-full" />
      </div>

      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create Partner' }}
        </button>
        <router-link to="/admin/partners" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
const form = ref({
  user_id: '',
  partner_discount: 10,
  registered_user_discount: 5
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/partners', form.value)
    success.value = 'Partner created successfully'
    setTimeout(() => router.push('/admin/partners'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create partner'
  } finally {
    saving.value = false
  }
}
</script>
