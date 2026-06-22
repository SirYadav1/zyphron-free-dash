<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/categories" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Categories</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit Category</h2>
      <p class="text-sm text-text-muted">Modify category details</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="space-y-1 col-span-2">
            <label class="text-label">Name</label>
            <input v-model="form.name" type="text" class="input-field w-full" />
          </div>
          <div class="space-y-1 col-span-2">
            <label class="text-label">Description</label>
            <textarea v-model="form.description" class="input-field w-full" rows="3"></textarea>
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
            <input v-model.number="form.display_order" type="number" class="input-field w-full" />
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
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="handleDelete" :disabled="deleting" class="btn-secondary px-6 py-2 text-red-500 hover:bg-red-500/10 hover:border-red-500/20">
            {{ deleting ? 'Deleting...' : 'Delete Category' }}
          </button>
          <router-link to="/admin/categories" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
const deleting = ref(false)
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

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/categories/${route.params.id}`)
    form.value = {
      name: data.name || '',
      description: data.description || '',
      image_url: data.image_url || '',
      sub_image_url: data.sub_image_url || '',
      display_order: data.display_order || 0,
      is_active: data.is_active ?? 1
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load category'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.put(`/admin/categories/${route.params.id}`, form.value)
    success.value = 'Category updated successfully'
    setTimeout(() => router.push('/admin/categories'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update category'
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm(`Delete category "${form.value.name}"? This will NOT delete the products inside it.`)) return
  deleting.value = true
  try {
    await client.delete(`/admin/categories/${route.params.id}`)
    router.push('/admin/categories')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete category'
  } finally {
    deleting.value = false
  }
}
</script>
