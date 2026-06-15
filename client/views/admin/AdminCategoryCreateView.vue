<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/categories" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Categories</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Category</h2>
      <p class="text-sm text-text-muted">Add a new service category</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1 col-span-2">
          <label class="text-label">Name</label>
          <input v-model="form.name" type="text" class="input-field w-full" placeholder="e.g. Minecraft Servers" />
        </div>
        <div class="space-y-1 col-span-2">
          <label class="text-label">Description</label>
          <textarea v-model="form.description" class="input-field w-full" rows="3" placeholder="Category description for users"></textarea>
        </div>
        <div class="space-y-1 col-span-2">
          <label class="text-label">Image URL</label>
          <input v-model="form.image_url" type="text" class="input-field w-full" placeholder="https://example.com/image.png" />
          <p class="text-[10px] text-text-muted">Large image displayed on the category card</p>
        </div>
        <div class="space-y-1 col-span-2">
          <label class="text-label">Sub Image URL (Badge)</label>
          <input v-model="form.sub_image_url" type="text" class="input-field w-full" placeholder="https://example.com/badge.png" />
          <p class="text-[10px] text-text-muted">Small corner badge image for the category card</p>
        </div>
        <div class="space-y-1">
          <label class="text-label">Display Order</label>
          <input v-model.number="form.display_order" type="number" class="input-field w-full" placeholder="0" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Active</label>
          <select v-model="form.is_active" class="input-field w-full">
            <option :value="1">Yes</option>
            <option :value="0">No</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create Category' }}
        </button>
        <router-link to="/admin/categories" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
  name: '',
  description: '',
  image_url: '',
  sub_image_url: '',
  display_order: 0,
  is_active: 1
})

async function handleSubmit() {
  if (!form.value.name) {
    error.value = 'Category name is required'
    return
  }

  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.post('/admin/categories', form.value)
    success.value = 'Category created successfully'
    setTimeout(() => router.push('/admin/categories'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create category'
  } finally {
    saving.value = false
  }
}
</script>
