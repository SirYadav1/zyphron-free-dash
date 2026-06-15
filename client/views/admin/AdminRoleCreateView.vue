<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/roles" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Roles</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Create Role</h2>
      <p class="text-sm text-text-muted">Define a new role with permissions.</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>

    <div class="card-surface p-6 space-y-6">
      <div class="space-y-1">
        <label class="text-label">Role Name</label>
        <input v-model="form.name" type="text" class="input-field w-full" placeholder="e.g. moderator" />
      </div>

      <div class="space-y-3 pt-4 border-t border-border">
        <p class="text-label">Permissions</p>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div v-for="perm in availablePermissions" :key="perm" class="flex items-center justify-between bg-base/50 p-3 rounded-lg border border-border">
            <span class="text-sm text-text-primary font-mono">{{ perm }}</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input :checked="form.permissions.includes(perm)" @change="togglePermission(perm)" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-base rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4 border-t border-border">
        <button @click="handleSubmit" :disabled="saving || !form.name" class="btn-primary px-6 py-2">
          {{ saving ? 'Creating...' : 'Create Role' }}
        </button>
        <router-link to="/admin/roles" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
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
const form = ref({
  name: '',
  permissions: []
})

const availablePermissions = [
  'users.view', 'users.create', 'users.edit', 'users.delete',
  'servers.view', 'servers.create', 'servers.edit', 'servers.delete',
  'products.view', 'products.create', 'products.edit', 'products.delete',
  'payments.view',
  'settings.view', 'settings.edit',
  'roles.view', 'roles.edit',
  'tickets.view', 'tickets.edit',
  'vouchers.view', 'vouchers.edit'
]

function togglePermission(perm) {
  const idx = form.value.permissions.indexOf(perm)
  if (idx === -1) {
    form.value.permissions.push(perm)
  } else {
    form.value.permissions.splice(idx, 1)
  }
}

async function handleSubmit() {
  saving.value = true
  error.value = ''
  try {
    await client.post('/admin/roles', form.value)
    router.push('/admin/roles')
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create role'
  } finally {
    saving.value = false
  }
}
</script>
