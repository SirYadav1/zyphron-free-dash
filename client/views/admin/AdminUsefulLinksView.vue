<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Useful Links</h2>
        <p class="text-sm text-text-muted mt-1">{{ links.length }} saved link{{ links.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="showAddForm = !showAddForm"
        class="px-4 py-2 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2">
        <span v-if="showAddForm">✕ Cancel</span>
        <span v-else>+ Add New Link</span>
      </button>
    </div>

    <!-- Inline Add Form -->
    <div v-if="showAddForm" class="bg-base-secondary border border-accent/30 rounded-xl p-5 space-y-4"
      style="animation: fadeIn 0.3s ease-out;">
      <h3 class="text-sm font-bold text-accent uppercase tracking-wider">New Link</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Title</label>
          <input v-model="newLink.title" type="text" class="input-field w-full" placeholder="e.g. Documentation" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">URL</label>
          <input v-model="newLink.link" type="text" class="input-field w-full" placeholder="https://..." />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Description</label>
          <input v-model="newLink.description" type="text" class="input-field w-full" placeholder="Brief description" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-text-muted uppercase">Position</label>
          <select v-model="newLink.position" class="input-field w-full">
            <option value="sidebar">Sidebar</option>
            <option value="footer">Footer</option>
            <option value="dashboard">Dashboard</option>
          </select>
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button @click="handleCreate" :disabled="creating || !newLink.title || !newLink.link"
          class="px-5 py-2 text-[11px] font-bold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-40 transition-colors">
          {{ creating ? 'Creating...' : 'Create Link' }}
        </button>
      </div>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400">{{ error }}</div>
    <div v-if="successMsg" class="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400">{{ successMsg }}</div>

    <!-- Table -->
    <div v-if="links.length > 0" class="bg-base-secondary border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-base/50">
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Title</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">URL</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Description</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Position</th>
            <th class="px-5 py-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="link in links" :key="link.id">
            <!-- Edit Mode -->
            <tr v-if="editingId === link.id" class="border-b border-accent/30 bg-accent/5">
              <td class="px-5 py-3">
                <input v-model="editForm.title" type="text" class="input-field w-full text-xs py-1.5" />
              </td>
              <td class="px-5 py-3">
                <input v-model="editForm.link" type="text" class="input-field w-full text-xs py-1.5" />
              </td>
              <td class="px-5 py-3">
                <input v-model="editForm.description" type="text" class="input-field w-full text-xs py-1.5" />
              </td>
              <td class="px-5 py-3">
                <select v-model="editForm.position" class="input-field w-full text-xs py-1.5">
                  <option value="sidebar">Sidebar</option>
                  <option value="footer">Footer</option>
                  <option value="dashboard">Dashboard</option>
                </select>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex gap-2 justify-end">
                  <button @click="handleUpdate(link)"
                    :disabled="updating"
                    class="px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/10 transition-colors">
                    {{ updating ? '...' : 'Save' }}
                  </button>
                  <button @click="cancelEdit"
                    class="px-2.5 py-1 text-[10px] font-bold text-text-muted border border-border rounded hover:bg-white/[0.05] transition-colors">
                    Cancel
                  </button>
                </div>
              </td>
            </tr>
            <!-- View Mode -->
            <tr v-else class="border-b border-border/40 last:border-b-0 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <span v-if="link.icon" class="text-accent text-xs">{{ link.icon }}</span>
                  <span class="text-text-primary font-bold text-sm">{{ link.title }}</span>
                </div>
              </td>
              <td class="px-5 py-3 max-w-[250px] truncate">
                <a :href="link.link" target="_blank" class="text-accent text-xs hover:text-white transition-colors">{{ link.link }}</a>
              </td>
              <td class="px-5 py-3">
                <span class="text-text-muted text-xs">{{ link.description || '—' }}</span>
              </td>
              <td class="px-5 py-3">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent">{{ link.position || 'sidebar' }}</span>
              </td>
              <td class="px-5 py-3 text-right">
                <div class="flex gap-2 justify-end">
                  <button @click="startEdit(link)"
                    class="px-2.5 py-1 text-[10px] font-bold text-accent border border-accent/20 rounded hover:bg-accent/10 transition-colors">
                    Edit
                  </button>
                  <button @click="handleDelete(link)"
                    class="px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-base-secondary border border-border rounded-xl py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Links Found</p>
      <p class="text-sm text-text-muted/60">Create your first useful link.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import client from '../../api/client'

const links = ref([])
const showAddForm = ref(false)
const creating = ref(false)
const updating = ref(false)
const editingId = ref(null)
const error = ref('')
const successMsg = ref('')

const newLink = ref({ title: '', link: '', description: '', position: 'sidebar' })
const editForm = ref({ title: '', link: '', description: '', position: 'sidebar' })

onMounted(async () => {
  await fetchLinks()
})

async function fetchLinks() {
  try {
    const { data } = await client.get('/admin/useful-links')
    links.value = Array.isArray(data) ? data : data.links || []
  } catch { /* ignore */ }
}

async function handleCreate() {
  creating.value = true; error.value = ''; successMsg.value = ''
  try {
    await client.post('/admin/useful-links', newLink.value)
    successMsg.value = 'Link created!'
    newLink.value = { title: '', link: '', description: '', position: 'sidebar' }
    showAddForm.value = false
    await fetchLinks()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create'
  } finally {
    creating.value = false
  }
}

function startEdit(link) {
  editingId.value = link.id
  editForm.value = {
    title: link.title || '',
    link: link.link || '',
    description: link.description || '',
    position: link.position || 'sidebar'
  }
  error.value = ''; successMsg.value = ''
}

function cancelEdit() {
  editingId.value = null
  editForm.value = { title: '', link: '', description: '', position: 'sidebar' }
}

async function handleUpdate(link) {
  updating.value = true; error.value = ''; successMsg.value = ''
  try {
    await client.put(`/admin/useful-links/${link.id}`, editForm.value)
    successMsg.value = 'Link updated!'
    editingId.value = null
    await fetchLinks()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update'
  } finally {
    updating.value = false
  }
}

async function handleDelete(link) {
  if (!confirm(`Delete "${link.title}"?`)) return
  try {
    await client.delete(`/admin/useful-links/${link.id}`)
    successMsg.value = 'Link deleted!'
    await fetchLinks()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete'
  }
}
</script>
