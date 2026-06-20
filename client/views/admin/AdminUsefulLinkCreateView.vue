<template>
  <div class="space-y-6 max-w-lg">
    <div>
      <router-link to="/admin/usefullinks" class="text-xs text-accent hover:text-white transition-colors">← Back to Links</router-link>
      <h2 class="text-2xl font-bold text-text-primary mt-2">Create Link</h2>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400">{{ error }}</div>
    <div v-if="success" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">{{ success }}</div>

    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-text-muted uppercase">Title</label>
        <input v-model="form.title" type="text" class="input-field w-full" placeholder="e.g. Documentation" />
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-text-muted uppercase">URL</label>
        <input v-model="form.link" type="text" class="input-field w-full" placeholder="https://..." />
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-text-muted uppercase">Description</label>
        <input v-model="form.description" type="text" class="input-field w-full" placeholder="Brief description" />
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-text-muted uppercase">Icon</label>
        <input v-model="form.icon" type="text" class="input-field w-full" placeholder="e.g. book-open" />
      </div>
      <div class="space-y-1">
        <label class="text-[10px] font-bold text-text-muted uppercase">Position</label>
        <select v-model="form.position" class="input-field w-full">
          <option value="sidebar">Sidebar</option>
          <option value="footer">Footer</option>
          <option value="dashboard">Dashboard</option>
        </select>
      </div>

      <div class="flex gap-2 pt-3 border-t border-border">
        <button @click="handleSubmit" :disabled="saving" class="px-5 py-2 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
          {{ saving ? 'Creating...' : 'Create Link' }}
        </button>
        <router-link to="/admin/usefullinks" class="px-5 py-2 text-[11px] font-bold text-text-muted border border-border rounded-lg hover:bg-white/[0.05] transition-colors">
          Cancel
        </router-link>
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
const form = ref({ title: '', link: '', description: '', icon: '', position: 'sidebar' })

async function handleSubmit() {
  saving.value = true; error.value = ''; success.value = ''
  try {
    await client.post('/admin/useful-links', form.value)
    success.value = 'Link created!'
    setTimeout(() => router.push('/admin/usefullinks'), 800)
  } catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { saving.value = false }
}
</script>
