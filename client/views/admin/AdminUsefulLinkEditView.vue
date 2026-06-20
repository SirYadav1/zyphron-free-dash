<template>
  <div class="space-y-6 max-w-lg">
    <div>
      <router-link to="/admin/usefullinks" class="text-xs text-accent hover:text-white transition-colors">← Back to Links</router-link>
      <h2 class="text-2xl font-bold text-text-primary mt-2">Edit Link</h2>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400">{{ error }}</div>
    <div v-if="success" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">{{ success }}</div>

    <div class="bg-base-secondary border border-border rounded-xl p-5 space-y-4">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Title</label>
          <input v-model="form.title" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">URL</label>
          <input v-model="form.link" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Description</label>
          <input v-model="form.description" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Icon</label>
          <input v-model="form.icon" type="text" class="input-field w-full" />
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
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link to="/admin/usefullinks" class="px-5 py-2 text-[11px] font-bold text-text-muted border border-border rounded-lg hover:bg-white/[0.05] transition-colors">
            Cancel
          </router-link>
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
const form = ref({ title: '', link: '', description: '', icon: '', position: 'sidebar' })

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
  } catch (err) { error.value = err.response?.data?.message || 'Failed to load' }
  finally { loading.value = false }
})

async function handleSubmit() {
  saving.value = true; error.value = ''; success.value = ''
  try {
    await client.put(`/admin/useful-links/${route.params.id}`, form.value)
    success.value = 'Link updated!'
    setTimeout(() => router.push('/admin/usefullinks'), 800)
  } catch (err) { error.value = err.response?.data?.message || 'Failed' }
  finally { saving.value = false }
}
</script>
