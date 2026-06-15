<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/store" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Store</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit Store Item</h2>
      <p class="text-sm text-text-muted">Modify shop item details</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="space-y-1">
          <label class="text-label">Type</label>
          <select v-model="form.type" class="input-field w-full">
            <option value="credits">Coins</option>
            <option value="server_slots">Server Slots</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-label">Price (₹)</label>
          <input v-model.number="form.price" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Coins Quantity</label>
          <input v-model.number="form.quantity" type="number" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Description</label>
          <textarea v-model="form.description" class="input-field w-full" rows="3"></textarea>
        </div>
        <div class="space-y-1">
          <label class="text-label">Display Name</label>
          <input v-model="form.display" type="text" class="input-field w-full" placeholder="e.g. 1000 Coins Pack" />
        </div>

        <div class="flex gap-3 pt-4 border-t border-border">
          <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link to="/admin/store" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
  type: 'credits',
  price: 0,
  quantity: 1,
  description: '',
  display: ''
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/store/${route.params.id}`)
    const item = data.item || data
    form.value = {
      type: item.type || 'credits',
      price: item.price || 0,
      quantity: item.quantity || 1,
      description: item.description || '',
      display: item.display || ''
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load item'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.put(`/admin/store/${route.params.id}`, form.value)
    success.value = 'Store item updated successfully'
    setTimeout(() => router.push('/admin/store'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update item'
  } finally {
    saving.value = false
  }
}
</script>
