<template>
  <div class="space-y-10 max-w-2xl">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/users" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Users</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Edit User</h2>
      <p class="text-sm text-text-muted">Modify user account details and permissions</p>
    </div>

    <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ error }}</div>
    <div v-if="success" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ success }}</div>

    <div class="bg-[#1e293b] border border-border rounded-xl overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>

      <template v-else>
        <!-- Identity Section -->
        <div class="border-b border-border">
          <div class="px-6 py-4 border-b border-border bg-[#0f172a]/50">
            <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <User :size="16" class="text-accent" /> Identity
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                <input v-model="form.email" type="email" class="input-field w-full" placeholder="user@example.com" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Username</label>
                <input v-model="form.username" type="text" class="input-field w-full" placeholder="username" />
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Client First Name</label>
                <input v-model="form.first_name" type="text" class="input-field w-full" placeholder="First name" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Client Last Name</label>
                <input v-model="form.last_name" type="text" class="input-field w-full" placeholder="Last name" />
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Default Language</label>
              <select v-model="form.language" class="input-field py-2 w-full">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="pt">Português</option>
                <option value="ru">Русский</option>
                <option value="zh">中文</option>
                <option value="ja">日本語</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Password Section -->
        <div class="border-b border-border">
          <div class="px-6 py-4 border-b border-border bg-[#0f172a]/50">
            <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <Lock :size="16" class="text-accent" /> Password
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">New Password</label>
              <div class="relative">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input-field w-full pr-10"
                  placeholder="Enter new password..."
                />
                <button @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  <Eye v-if="!showPassword" :size="14" :stroke-width="2" />
                  <EyeOff v-else :size="14" :stroke-width="2" />
                </button>
              </div>
              <p class="text-[10px] text-text-muted mt-1">Leave blank to keep the same password.</p>
            </div>
          </div>
        </div>

        <!-- Permissions Section -->
        <div class="border-b border-border">
          <div class="px-6 py-4 border-b border-border bg-[#0f172a]/50">
            <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
              <Shield :size="16" class="text-accent" /> Permissions
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Administrator</label>
              <select v-model="form.isAdmin" class="input-field py-2 w-full">
                <option :value="false">No</option>
                <option :value="true">Yes</option>
              </select>
              <p class="text-[10px] text-text-muted mt-1">Grants full access to the control panel.</p>
            </div>

            <!-- Roles -->
            <div v-if="allRoles.length > 0" class="space-y-3 pt-3 border-t border-border">
              <p class="text-[11px] font-bold text-text-muted uppercase tracking-wider">Assigned Roles</p>
              <div class="space-y-2">
                <div v-for="r in allRoles" :key="r.id" class="flex items-center justify-between bg-[#0f172a]/50 p-3 rounded-lg border border-border">
                  <span class="text-sm text-text-primary font-bold">{{ r.name }}</span>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input :checked="userRoles.includes(r.id)" @change="toggleRole(r.id)" type="checkbox" class="sr-only peer" />
                    <div class="w-11 h-6 bg-base rounded-full peer peer-checked:bg-accent after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Delete User Section -->
        <div>
          <div class="px-6 py-4 border-b border-red-500/20 bg-red-500/5">
            <h3 class="text-sm font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle :size="16" /> Delete User
            </h3>
          </div>
          <div class="p-6 space-y-3">
            <p class="text-xs text-text-muted">Once you delete a user, there is no going back. Please be certain.</p>
            <button
              @click="handleDeleteUser"
              :disabled="deleting"
              class="px-4 py-2 text-[11px] font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <span v-if="deleting" class="flex items-center gap-2">
                <div class="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </span>
              <span v-else class="flex items-center gap-2">
                <Trash2 :size="14" /> Delete User
              </span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Save / Cancel -->
    <div class="flex gap-3">
      <button @click="handleSave" :disabled="saving" class="btn-primary px-6 py-2">
        {{ saving ? 'Saving...' : 'Save Changes' }}
      </button>
      <router-link to="/admin/users" class="btn-secondary px-6 py-2 text-center">Cancel</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../../api/client'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Trash2,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const allRoles = ref([])
const userRoles = ref([])
const form = ref({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  language: 'en',
  password: '',
  coins: 0,
  isAdmin: false,
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/admin/users/${route.params.id}`)
    form.value = {
      username: data.username || '',
      email: data.email || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      language: data.language || 'en',
      coins: data.coins || 0,
      isAdmin: !!data.isAdmin,
    }
    // load roles
    try {
      const { data: roles } = await client.get('/admin/roles')
      allRoles.value = Array.isArray(roles) ? roles : roles.roles || []
      // load user's assigned roles
      const { data: userRoleData } = await client.get(`/admin/roles/user/${route.params.id}`)
      userRoles.value = (Array.isArray(userRoleData) ? userRoleData : userRoleData.roles || []).map(r => r.id)
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
    const payload = { ...form.value }
    if (!payload.password) delete payload.password
    await client.put(`/admin/users/${route.params.id}`, payload)
    success.value = 'User updated successfully'
    setTimeout(() => router.push('/admin/users'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update user'
  } finally {
    saving.value = false
  }
}

async function handleDeleteUser() {
  if (!confirm(`Are you sure you want to delete this user? This action cannot be undone.`)) return
  deleting.value = true
  try {
    await client.delete(`/admin/users/${route.params.id}`)
    success.value = 'User deleted'
    setTimeout(() => router.push('/admin/users'), 1000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to delete user'
    deleting.value = false
  }
}
</script>
