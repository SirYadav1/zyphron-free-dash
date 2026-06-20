<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/coupons" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Coupons</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Coupon</h2>
      <p class="text-sm text-text-muted">Generate a new coupon code</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <label class="text-label">Code</label>
        <input v-model="form.code" type="text" class="input-field w-full" placeholder="e.g. SAVE20" />
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-label">Value</label>
          <input v-model.number="form.value" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Type</label>
          <select v-model="form.type" class="input-field w-full">
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
      </div>
      <div class="space-y-1">
        <label class="text-label">Max Uses</label>
        <input v-model.number="form.max_uses" type="number" class="input-field w-full" placeholder="0 for unlimited" />
      </div>
      <div class="space-y-1">
        <label class="text-label">Expires At</label>
        <input v-model="form.expires_at" type="date" class="input-field w-full" />
      </div>

      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create Coupon' }}
        </button>
        <router-link to="/admin/coupons" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
  code: '',
  value: 0,
  type: 'percentage',
  max_uses: 0,
  expires_at: ''
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/coupons', form.value)
    success.value = 'Coupon created successfully'
    setTimeout(() => router.push('/admin/coupons'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create coupon'
  } finally {
    saving.value = false
  }
}
</script>
