<template>
  <div class="space-y-10">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Users</h2>
        <p class="text-sm text-text-muted">{{ store.users.length }} registered accounts</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="input-field w-64"
        />
      </div>
    </div>

    <!-- Users List -->
    <div v-if="filteredUsers.length > 0" class="card-surface overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border bg-base/50 text-left">
            <th class="px-5 py-3 text-label">User</th>
            <th class="px-5 py-3 text-label">Roles</th>
            <th class="px-5 py-3 text-label text-center">Coins</th>
            <th class="px-5 py-3 text-label text-center">Status</th>
            <th class="px-5 py-3 text-label text-right w-40">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
          >
            <td class="px-5 py-4">
              <div class="flex items-center gap-3">
                <div
                  :class="user.isBanned ? 'bg-red-500/20 text-red-400' : user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-accent/10 text-accent'"
                  class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                >
                  {{ getInitials(user.username) }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-text-primary truncate">{{ user.username }}</p>
                  <p class="text-[11px] text-text-muted truncate">{{ user.email || 'No email' }}</p>
                </div>
                <div class="flex-shrink-0 ml-2" :title="isOnline(user) ? 'Online' : 'Offline'">
                  <div :class="isOnline(user) ? 'bg-emerald-400' : 'bg-gray-500'" class="w-2 h-2 rounded-full"></div>
                </div>
              </div>
            </td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-if="user.isAdmin"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400"
                >Admin</span>
                <span
                  v-for="role in getUserRoles(user)"
                  :key="role.name"
                  :class="getRoleBadgeClass(role.name)"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                >{{ role.name }}</span>
                <span
                  v-if="!user.isAdmin && (!userRolesMap[user.id] || userRolesMap[user.id].length === 0)"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-500/15 text-gray-400"
                >User</span>
              </div>
            </td>
            <td class="px-5 py-4 text-center">
              <span class="text-accent font-bold">{{ user.coins }}</span>
            </td>
            <td class="px-5 py-4 text-center">
              <span
                :class="userStatusClass(user)"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              >{{ userStatusText(user) }}</span>
            </td>
            <td class="px-5 py-4 text-right">
              <div class="flex gap-2 justify-end">
                <button
                  @click="openEditModal(user)"
                  class="px-3 py-1.5 text-[11px] font-bold text-accent border border-accent/20 rounded-lg hover:bg-accent/10 transition-colors"
                >Edit</button>
                <button
                  @click="openRolesModal(user)"
                  class="px-3 py-1.5 text-[11px] font-bold text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/10 transition-colors"
                >Roles</button>
                <button
                  @click="handleDelete(user)"
                  class="px-3 py-1.5 text-[11px] font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                >✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-if="filteredUsers.length === 0 && !store.loading" class="card-surface py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Users Found</p>
      <p class="text-sm text-text-muted/60">No users match your search criteria.</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <div v-if="showEditModal && editUser" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] pt-[5vh] pb-[5vh] px-4 overflow-y-auto" @click.self="showEditModal = false">
        <div class="card-surface w-full max-w-lg max-h-[90vh] overflow-y-auto my-auto shadow-2xl border border-border/50">
          <div class="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-text-primary">Edit {{ editUser.username }}</h3>
              <p class="text-xs text-text-muted mt-1">ID: {{ editUser.id }}</p>
            </div>
            <button @click="showEditModal = false" class="text-text-muted hover:text-text-primary transition-colors text-2xl">×</button>
          </div>
          <div class="p-6 space-y-5">
            <div v-if="modalError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500 flex items-center gap-2"><AlertTriangle :size="14" :stroke-width="2.5" /> {{ modalError }}</div>
            <div v-if="modalSuccess" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent flex items-center gap-2"><CheckCircle :size="14" :stroke-width="2.5" /> {{ modalSuccess }}</div>

            <!-- Change Email -->
            <div class="space-y-1">
              <label class="text-label">Email</label>
              <input v-model="editForm.email" type="email" class="input-field w-full" placeholder="user@example.com" />
            </div>

            <!-- Change Password -->
            <div class="space-y-1">
              <label class="text-label">New Password (leave blank to keep current)</label>
              <input v-model="editForm.password" type="password" class="input-field w-full" placeholder="••••••••" />
            </div>

            <!-- Coins -->
            <div class="space-y-1">
              <label class="text-label">Coins Balance</label>
              <input v-model.number="editForm.coins" type="number" class="input-field w-full" />
            </div>

            <!-- Ban/Unban -->
            <div class="space-y-2">
              <label class="text-label">Account Status</label>
              <div v-if="!editUser.isBanned" class="flex gap-3">
                <input v-model="editForm.banReason" type="text" class="input-field flex-1" placeholder="Ban reason (optional)" />
                <button
                  @click="handleBanUser"
                  :disabled="modalSaving"
                  class="px-4 py-2 text-xs font-bold text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
                >{{ modalSaving ? 'Banning...' : 'Ban' }}</button>
              </div>
              <button
                v-else
                @click="handleUnbanUser"
                :disabled="modalSaving"
                class="w-full px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >{{ modalSaving ? 'Unbanning...' : 'Unban User' }}</button>
            </div>

            <!-- Admin Toggle -->
            <div class="flex items-center justify-between bg-base/50 p-4 rounded-xl border border-border">
              <div>
                <p class="text-sm font-bold text-text-primary">Admin Privileges</p>
                <p class="text-xs text-text-muted mt-0.5">Grants full access to the control panel.</p>
              </div>
              <button
                @click="handleToggleAdmin"
                :disabled="modalSaving"
                :class="editUser.isAdmin ? 'btn-secondary text-red-500 hover:border-red-500/50' : 'btn-primary'"
                class="px-4 py-2 text-xs"
              >{{ editUser.isAdmin ? 'Revoke' : 'Grant' }}</button>
            </div>

            <div class="flex gap-3 pt-4 border-t border-border">
              <button @click="handleSaveEdit" :disabled="modalSaving" class="btn-primary px-6 py-2 text-xs">
                {{ modalSaving ? 'Saving...' : 'Save Changes' }}
              </button>
              <button @click="showEditModal = false" class="btn-secondary px-6 py-2 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Roles Modal -->
    <Teleport to="body">
      <div v-if="showRolesModal && rolesUser" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] pt-[5vh] pb-[5vh] px-4 overflow-y-auto" @click.self="showRolesModal = false">
        <div class="card-surface w-full max-w-md max-h-[90vh] overflow-y-auto my-auto shadow-2xl border border-border/50">
          <div class="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-text-primary">Roles — {{ rolesUser.username }}</h3>
              <p class="text-xs text-text-muted mt-1">Assign or remove roles</p>
            </div>
            <button @click="showRolesModal = false" class="text-text-muted hover:text-text-primary transition-colors text-2xl">×</button>
          </div>
          <div class="p-6 space-y-4">
            <div v-if="rolesModalError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">{{ rolesModalError }}</div>
            <div v-if="rolesModalSuccess" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">{{ rolesModalSuccess }}</div>

            <div v-if="rolesLoading" class="text-xs text-text-muted text-center py-4">Loading roles...</div>
            <div v-else-if="allRoles.length === 0" class="text-xs text-text-muted text-center py-4">No roles defined. <router-link to="/admin/roles" class="text-accent">Create roles</router-link></div>
            <div v-else class="space-y-2">
              <button
                v-for="role in allRoles"
                :key="role.id"
                @click="toggleRoleForUser(role)"
                :disabled="roleToggling"
                :class="currentUserRoleIds.includes(role.id) ? 'bg-accent/20 text-accent border-accent/40' : 'bg-base text-text-muted border-border hover:border-border-bright'"
                class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all"
              >
                <span>{{ role.name }}</span>
                <span v-if="currentUserRoleIds.includes(role.id)" class="text-accent">✓ Assigned</span>
                <span v-else class="text-text-muted/50">Click to assign</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'
import { AlertTriangle, CheckCircle } from 'lucide-vue-next'

const store = useAdminStore()
const searchQuery = ref('')

// Edit modal
const showEditModal = ref(false)
const editUser = ref(null)
const editForm = ref({ email: '', password: '', coins: 0, banReason: '' })
const modalError = ref('')
const modalSuccess = ref('')
const modalSaving = ref(false)

// Roles modal
const showRolesModal = ref(false)
const rolesUser = ref(null)
const allRoles = ref([])
const currentUserRoles = ref([])
const rolesLoading = ref(false)
const roleToggling = ref(false)
const rolesModalError = ref('')
const rolesModalSuccess = ref('')

// Store all user roles mapped by user id
const userRolesMap = ref({})

const currentUserRoleIds = computed(() => currentUserRoles.value.map(r => r.id))

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.users
  const q = searchQuery.value.toLowerCase()
  return store.users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    (u.email && u.email.toLowerCase().includes(q)) ||
    String(u.id).includes(q)
  )
})

onMounted(async () => {
  await store.fetchUsers()
  await store.fetchRoles()
  allRoles.value = store.roles
  // Load roles for all users
  await loadAllUserRoles()
})

async function loadAllUserRoles() {
  for (const user of store.users) {
    try {
      const roles = await store.getUserRoles(user.id)
      userRolesMap.value[user.id] = roles
    } catch {
      userRolesMap.value[user.id] = []
    }
  }
}

function getUserRoles(user) {
  return userRolesMap.value[user.id] || []
}

function getInitials(name) {
  if (!name) return '?'
  return name.slice(0, 2).toUpperCase()
}

function isOnline(user) {
  if (user.last_active) {
    const diff = Date.now() - new Date(user.last_active).getTime()
    return diff < 5 * 60 * 1000 // within 5 minutes
  }
  return false
}

function userStatusClass(user) {
  if (user.isBanned) return 'text-red-500 bg-red-500/10'
  if (user.isAdmin) return 'text-purple-400 bg-purple-500/10'
  return 'text-accent bg-accent/10'
}

function userStatusText(user) {
  if (user.isBanned) return 'Banned'
  if (user.isAdmin) return 'Admin'
  return 'Active'
}

function getRoleBadgeClass(roleName) {
  const name = roleName.toLowerCase()
  if (name === 'admin') return 'bg-red-500/15 text-red-400'
  if (name === 'moderator' || name === 'mod') return 'bg-blue-500/15 text-blue-400'
  if (name === 'support') return 'bg-green-500/15 text-green-400'
  if (name === 'user') return 'bg-gray-500/15 text-gray-400'
  // Default colors for other roles
  const colors = [
    'bg-purple-500/15 text-purple-400',
    'bg-indigo-500/15 text-indigo-400',
    'bg-cyan-500/15 text-cyan-400',
    'bg-amber-500/15 text-amber-400',
  ]
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function openEditModal(user) {
  editUser.value = { ...user }
  editForm.value = {
    email: user.email || '',
    password: '',
    coins: user.coins,
    banReason: '',
  }
  modalError.value = ''
  modalSuccess.value = ''
  showEditModal.value = true
}

async function handleSaveEdit() {
  modalSaving.value = true
  modalError.value = ''
  modalSuccess.value = ''
  try {
    const payload = {}
    if (editForm.value.email) payload.email = editForm.value.email
    if (editForm.value.password) payload.password = editForm.value.password
    payload.coins = editForm.value.coins

    await store.updateUser(editUser.value.id, payload)
    modalSuccess.value = 'User updated successfully'
    await store.fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to update user'
  } finally {
    modalSaving.value = false
  }
}

async function handleBanUser() {
  modalSaving.value = true
  modalError.value = ''
  modalSuccess.value = ''
  try {
    await store.banUser(editUser.value.id, editForm.value.banReason)
    modalSuccess.value = 'User banned'
    editUser.value.isBanned = true
    await store.fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to ban user'
  } finally {
    modalSaving.value = false
  }
}

async function handleUnbanUser() {
  modalSaving.value = true
  modalError.value = ''
  modalSuccess.value = ''
  try {
    await store.unbanUser(editUser.value.id)
    modalSuccess.value = 'User unbanned'
    editUser.value.isBanned = false
    await store.fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to unban user'
  } finally {
    modalSaving.value = false
  }
}

async function handleToggleAdmin() {
  modalSaving.value = true
  modalError.value = ''
  modalSuccess.value = ''
  try {
    const newStatus = !editUser.value.isAdmin
    await store.updateUser(editUser.value.id, { isAdmin: newStatus })
    modalSuccess.value = newStatus ? 'Admin privileges granted' : 'Admin privileges revoked'
    editUser.value.isAdmin = newStatus
    await store.fetchUsers()
  } catch (err) {
    modalError.value = err.response?.data?.message || 'Failed to update admin status'
  } finally {
    modalSaving.value = false
  }
}

async function handleDelete(user) {
  if (!confirm(`DELETE user "${user.username}"? This will permanently remove them from the database.`)) return
  try {
    await client.delete(`/admin/users/${user.id}`)
    await store.fetchUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete user')
  }
}

function openRolesModal(user) {
  rolesUser.value = user
  currentUserRoles.value = userRolesMap.value[user.id] || []
  rolesModalError.value = ''
  rolesModalSuccess.value = ''
  showRolesModal.value = true
}

async function toggleRoleForUser(role) {
  roleToggling.value = true
  rolesModalError.value = ''
  rolesModalSuccess.value = ''
  try {
    const hasRole = currentUserRoleIds.value.includes(role.id)
    if (hasRole) {
      await store.unassignRole(rolesUser.value.id, role.id)
      currentUserRoles.value = currentUserRoles.value.filter(r => r.id !== role.id)
      rolesModalSuccess.value = `Role "${role.name}" removed`
    } else {
      await store.assignRole(rolesUser.value.id, role.id)
      currentUserRoles.value.push(role)
      rolesModalSuccess.value = `Role "${role.name}" assigned`
    }
    // Update the map
    userRolesMap.value[rolesUser.value.id] = [...currentUserRoles.value]
  } catch (err) {
    rolesModalError.value = err.response?.data?.message || 'Failed to update role'
  } finally {
    roleToggling.value = false
  }
}
</script>
