<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/usefullinks" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Links</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit Link</h2>
      <p class="text-sm text-text-muted">Modify useful link details</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="space-y-1">
          <label class="text-label">Title</label>
          <input v-model="form.title" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">URL</label>
          <input v-model="form.link" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Description</label>
          <input v-model="form.description" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Icon (optional)</label>
          <input v-model="form.icon" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Position</label>
          <input v-model="form.position" type="text" class="input-field w-full" />
        </div>

        <div class="flex gap-3 pt-4 border-t border-border">
          <button @click="handleSubmit" :disabled="saving" class="btn-primary px-6 py-2">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link to="/admin/usefullinks" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
  title: '',
  link: '',
  description: '',
  icon: '',
  position: 'sidebar'
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/useful-links/${route.params.id}`)
    const link = data.link || data
    form.value = {
      title: link.title || '',
      link: link.link || '',
      description: link.description || '',
      icon: link.icon || '',
      position: link.position || 'sidebar'
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load link'
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.put(`/admin/useful-links/${route.params.id}`, form.value)
    success.value = 'Link updated successfully'
    setTimeout(() => router.push('/admin/usefullinks'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update link'
  } finally {
    saving.value = false
  }
}
</script>
