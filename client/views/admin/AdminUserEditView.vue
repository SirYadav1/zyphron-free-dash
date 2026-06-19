<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link :to="`/admin/users/${route.params.id}`" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to User</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit User</h2>
      <p class="text-sm text-text-muted">Modify user account details</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="card-surface p-6 space-y-6">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <div class="space-y-1">
          <label class="text-label">Username</label>
          <input v-model="form.username" type="text" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Email</label>
          <input v-model="form.email" type="email" class="input-field w-full" />
        </div>
        <div class="space-y-1">
          <label class="text-label">Coins</label>
          <input v-model.number="form.coins" type="number" min="0" class="input-field w-full" />
        </div>
        <div class="flex items-center justify-between bg-base/50 p-4 rounded-xl border border-border">
          <div>
            <p class="text-sm font-bold text-text-primary">Admin Privileges</p>
            <p class="text-xs text-text-muted mt-0.5">Grants full access to the control panel.</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.isAdmin" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-base rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        <div class="space-y-3 pt-4 border-t border-border">
          <p class="text-label">Assigned Roles</p>
          <div v-if="allRoles.length === 0" class="text-xs text-text-muted/40">No roles defined yet.</div>
          <div v-else class="space-y-2">
            <div v-for="r in allRoles" :key="r.id" class="flex items-center justify-between bg-base/50 p-3 rounded-lg border border-border">
              <span class="text-sm text-text-primary font-bold">{{ r.name }}</span>
              <label class="relative inline-flex items-center cursor-pointer">
                <input :checked="userRoles.includes(r.id)" @change="toggleRole(r.id)" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-base rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-border">
          <button @click="handleSave" :disabled="saving" class="btn-primary px-6 py-2">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link :to="`/admin/users/${route.params.id}`" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
const allRoles = ref([])
const userRoles = ref([])
const form = ref({
  username: '',
  email: '',
  coins: 0,
  isAdmin: false
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/users/${route.params.id}`)
    form.value = {
      username: data.username || '',
      email: data.email || '',
      coins: data.coins || 0,
      isAdmin: !!data.isAdmin
    }
    try {
      const { data: roles } = await client.get('/admin/roles')
      allRoles.value = Array.isArray(roles) ? roles : roles.roles || []
    } catch { /* ignore */ }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load user'
  } finally {
    loading.value = false
  }
})

async function toggleRole(roleId) {
  const idx = userRoles.value.indexOf(roleId)
  try {
    if (idx === -1) {
      await client.post(`/admin/roles/${roleId}/assign`, { user_id: route.params.id })
      userRoles.value.push(roleId)
    } else {
      await client.delete(`/admin/roles/${roleId}/assign/${route.params.id}`)
      userRoles.value.splice(idx, 1)
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update role'
  }
}

async function handleSave() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await client.put(`/admin/users/${route.params.id}`, form.value)
    success.value = 'User updated successfully'
    setTimeout(() => router.push(`/admin/users/${route.params.id}`), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update user'
  } finally {
    saving.value = false
  }
}
</script>
