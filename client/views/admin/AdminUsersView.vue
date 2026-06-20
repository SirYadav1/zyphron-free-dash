<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary">Manage Users</h2>
        <p class="text-sm text-text-muted mt-1">{{ filteredUsers.length }} of {{ store.users.length }} users</p>
      </div>
      <div class="flex items-center gap-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, email, ID..."
          class="input-field w-64"
        />
        <select v-model="perPage" class="input-field w-28">
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
        </select>
      </div>
    </div>

    <!-- Users Table -->
    <div v-if="paginatedUsers.length > 0" class="bg-base-secondary border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-border bg-base/80">
            <th class="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">User</th>
            <th class="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Email</th>
            <th class="px-5 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider">Roles</th>
            <th class="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">Coins</th>
            <th class="px-5 py-3 text-center text-[11px] font-bold text-text-muted uppercase tracking-wider">Status</th>
            <th class="px-5 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider w-36">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in paginatedUsers"
            :key="user.id"
            class="border-b border-border/40 last:border-b-0 hover:bg-white/[0.03] transition-colors"
          >
            <!-- User -->
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <div
                  :class="user.isBanned ? 'bg-red-500/20 text-red-400' : user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-accent/10 text-accent'"
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                >
                  {{ getInitials(user.username) }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-text-primary truncate">{{ user.username }}</p>
                  <p class="text-[10px] text-text-muted">ID: {{ user.id }}</p>
                </div>
                <div class="w-2 h-2 rounded-full flex-shrink-0" :class="isOnline(user) ? 'bg-emerald-400' : 'bg-gray-500'" :title="isOnline(user) ? 'Online' : 'Offline'"></div>
              </div>
            </td>
            <!-- Email -->
            <td class="px-5 py-3">
              <span class="text-xs text-text-muted">{{ user.email || '—' }}</span>
            </td>
            <!-- Roles -->
            <td class="px-5 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-if="user.isAdmin"
                  class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/15 text-red-400"
                >Admin</span>
                <span
                  v-for="role in getUserRoles(user)"
                  :key="role.name"
                  :class="getRoleBadgeClass(role.name)"
                  class="px-2 py-0.5 rounded text-[10px] font-bold"
                >{{ role.name }}</span>
                <span
                  v-if="!user.isAdmin && (!userRolesMap[user.id] || userRolesMap[user.id].length === 0)"
                  class="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/15 text-gray-400"
                >User</span>
              </div>
            </td>
            <!-- Coins -->
            <td class="px-5 py-3 text-center">
              <span class="text-sm font-bold text-accent">{{ user.coins }}</span>
            </td>
            <!-- Status -->
            <td class="px-5 py-3 text-center">
              <span
                :class="userStatusClass(user)"
                class="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
              >{{ userStatusText(user) }}</span>
            </td>
            <!-- Actions -->
            <td class="px-5 py-3 text-right">
              <div class="flex gap-1.5 justify-end">
                <button
                  @click="openEditModal(user)"
                  class="px-2.5 py-1 text-[10px] font-bold text-accent border border-accent/20 rounded hover:bg-accent/10 transition-colors"
                >Edit</button>
                <button
                  @click="openRolesModal(user)"
                  class="px-2.5 py-1 text-[10px] font-bold text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/10 transition-colors"
                >Roles</button>
                <button
                  @click="handleDelete(user)"
                  class="px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors"
                >✕</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-border bg-base/50">
        <p class="text-[11px] text-text-muted">
          Showing {{ (currentPage - 1) * perPage + 1 }}–{{ Math.min(currentPage * perPage, filteredUsers.length) }} of {{ filteredUsers.length }}
        </p>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage = 1"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-[10px] font-bold rounded border border-border hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >«</button>
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-2 py-1 text-[10px] font-bold rounded border border-border hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >‹</button>
          <template v-for="p in visiblePages" :key="p">
            <span v-if="p === '...'" class="px-2 py-1 text-[10px] text-text-muted">...</span>
            <button
              v-else
              @click="currentPage = p"
              :class="p === currentPage ? 'bg-accent text-white border-accent' : 'border-border hover:bg-white/[0.05]'"
              class="px-2.5 py-1 text-[10px] font-bold rounded border transition-colors"
            >{{ p }}</button>
          </template>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-[10px] font-bold rounded border border-border hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >›</button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="px-2 py-1 text-[10px] font-bold rounded border border-border hover:bg-white/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >»</button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredUsers.length === 0 && !store.loading" class="bg-base-secondary border border-border rounded-xl py-16 text-center">
      <p class="text-text-muted text-lg font-bold mb-1">No Users Found</p>
      <p class="text-sm text-text-muted/60">No users match your search.</p>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-16">
      <div class="w-8 h-8 border-[3px] border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- Edit User Modal -->
    <Teleport to="body">
      <div v-if="showEditModal && editUser" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] pt-[8vh] px-4" @click.self="showEditModal = false">
        <div class="bg-base-secondary border border-border rounded-xl w-full max-w-md shadow-2xl">
          <div class="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-text-primary">Edit {{ editUser.username }}</h3>
              <p class="text-[10px] text-text-muted mt-0.5">ID: {{ editUser.id }}</p>
            </div>
            <button @click="showEditModal = false" class="text-text-muted hover:text-text-primary text-xl leading-none">&times;</button>
          </div>
          <div class="p-5 space-y-4">
            <div v-if="modalError" class="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs font-bold text-red-400">{{ modalError }}</div>
            <div v-if="modalSuccess" class="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-bold text-emerald-400">{{ modalSuccess }}</div>

            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase">Email</label>
              <input v-model="editForm.email" type="email" class="input-field w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase">New Password <span class="text-text-muted/50 normal-case">(leave blank = keep current)</span></label>
              <input v-model="editForm.password" type="password" class="input-field w-full" placeholder="••••••••" />
            </div>
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase">Coins</label>
              <input v-model.number="editForm.coins" type="number" class="input-field w-full" />
            </div>

            <!-- Ban -->
            <div class="space-y-1">
              <label class="text-[11px] font-bold text-text-muted uppercase">Account Status</label>
              <div v-if="!editUser.isBanned" class="flex gap-2">
                <input v-model="editForm.banReason" type="text" class="input-field flex-1 text-xs" placeholder="Ban reason (optional)" />
                <button @click="handleBanUser" :disabled="modalSaving" class="px-3 py-1.5 text-[10px] font-bold text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 disabled:opacity-50 transition-colors">
                  {{ modalSaving ? '...' : 'Ban' }}
                </button>
              </div>
              <button v-else @click="handleUnbanUser" :disabled="modalSaving" class="w-full px-3 py-1.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/10 disabled:opacity-50 transition-colors">
                {{ modalSaving ? '...' : 'Unban User' }}
              </button>
            </div>

            <!-- Admin Toggle -->
            <div class="flex items-center justify-between p-3 bg-base/50 rounded-lg border border-border">
              <div>
                <p class="text-xs font-bold text-text-primary">Admin Privileges</p>
                <p class="text-[10px] text-text-muted">Full panel access</p>
              </div>
              <button @click="handleToggleAdmin" :disabled="modalSaving"
                :class="editUser.isAdmin ? 'text-red-400 border-red-500/20 hover:bg-red-500/10' : 'text-accent border-accent/20 hover:bg-accent/10'"
                class="px-3 py-1.5 text-[10px] font-bold border rounded transition-colors disabled:opacity-50">
                {{ editUser.isAdmin ? 'Revoke' : 'Grant' }}
              </button>
            </div>

            <div class="flex gap-2 pt-2 border-t border-border">
              <button @click="handleSaveEdit" :disabled="modalSaving" class="btn-primary px-5 py-2 text-xs">
                {{ modalSaving ? 'Saving...' : 'Save' }}
              </button>
              <button @click="showEditModal = false" class="btn-secondary px-5 py-2 text-xs">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Roles Modal -->
    <Teleport to="body">
      <div v-if="showRolesModal && rolesUser" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] pt-[8vh] px-4" @click.self="showRolesModal = false">
        <div class="bg-base-secondary border border-border rounded-xl w-full max-w-md shadow-2xl">
          <div class="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-text-primary">Roles — {{ rolesUser.username }}</h3>
              <p class="text-[10px] text-text-muted mt-0.5">Assign or remove roles</p>
            </div>
            <button @click="showRolesModal = false" class="text-text-muted hover:text-text-primary text-xl leading-none">&times;</button>
          </div>
          <div class="p-5 space-y-3">
            <div v-if="rolesModalError" class="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs font-bold text-red-400">{{ rolesModalError }}</div>
            <div v-if="rolesModalSuccess" class="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-bold text-emerald-400">{{ rolesModalSuccess }}</div>

            <div v-if="rolesLoading" class="text-xs text-text-muted text-center py-4">Loading...</div>
            <div v-else-if="allRoles.length === 0" class="text-xs text-text-muted text-center py-4">No roles. <router-link to="/admin/roles" class="text-accent">Create one</router-link></div>
            <div v-else class="space-y-2">
              <button
                v-for="role in allRoles"
                :key="role.id"
                @click="toggleRoleForUser(role)"
                :disabled="roleToggling"
                :class="currentUserRoleIds.includes(role.id) ? 'bg-accent/20 text-accent border-accent/40' : 'bg-base text-text-muted border-border hover:border-border-bright'"
                class="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-50"
              >
                <span>{{ role.name }}</span>
                <span v-if="currentUserRoleIds.includes(role.id)" class="text-accent">✓</span>
                <span v-else class="text-text-muted/40">+</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminStore } from '../../stores/admin'
import client from '../../api/client'

const store = useAdminStore()
const searchQuery = ref('')
const perPage = ref(10)
const currentPage = ref(1)

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

const userRolesMap = ref({})
const currentUserRoleIds = computed(() => currentUserRoles.value.map(r => r.id))

// Reset page when search changes
watch(searchQuery, () => { currentPage.value = 1 })

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.users
  const q = searchQuery.value.toLowerCase()
  return store.users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    (u.email && u.email.toLowerCase().includes(q)) ||
    String(u.id).includes(q)
  )
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / perPage.value))

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredUsers.value.slice(start, start + perPage.value)
})

const visiblePages = computed(() => {
  const total = totalPages.value
  const curr = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (curr <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push('...', total)
  } else if (curr >= total - 3) {
    pages.push(1, '...')
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1, '...', curr - 1, curr, curr + 1, '...', total)
  }
  return pages
})

onMounted(async () => {
  await store.fetchUsers()
  await store.fetchRoles()
  allRoles.value = store.roles
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

function getUserRoles(user) { return userRolesMap.value[user.id] || [] }
function getInitials(name) { return name ? name.slice(0, 2).toUpperCase() : '?' }
function isOnline(user) { return user.last_active ? (Date.now() - new Date(user.last_active).getTime() < 5 * 60 * 1000) : false }

function userStatusClass(user) {
  if (user.isBanned) return 'text-red-400 bg-red-500/10'
  if (user.isAdmin) return 'text-purple-400 bg-purple-500/10'
  return 'text-emerald-400 bg-emerald-500/10'
}
function userStatusText(user) {
  if (user.isBanned) return 'Banned'
  if (user.isAdmin) return 'Admin'
  return 'Active'
}

function getRoleBadgeClass(roleName) {
  const n = roleName.toLowerCase()
  if (n === 'admin') return 'bg-red-500/15 text-red-400'
  if (n === 'moderator' || n === 'mod') return 'bg-blue-500/15 text-blue-400'
  if (n === 'support') return 'bg-green-500/15 text-green-400'
  const colors = ['bg-purple-500/15 text-purple-400', 'bg-indigo-500/15 text-indigo-400', 'bg-cyan-500/15 text-cyan-400', 'bg-amber-500/15 text-amber-400']
  return colors[n.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
}

function openEditModal(user) {
  editUser.value = { ...user }
  editForm.value = { email: user.email || '', password: '', coins: user.coins, banReason: '' }
  modalError.value = ''; modalSuccess.value = ''; showEditModal.value = true
}

async function handleSaveEdit() {
  modalSaving.value = true; modalError.value = ''; modalSuccess.value = ''
  try {
    const payload = {}
    if (editForm.value.email) payload.email = editForm.value.email
    if (editForm.value.password) payload.password = editForm.value.password
    payload.coins = editForm.value.coins
    await store.updateUser(editUser.value.id, payload)
    modalSuccess.value = 'Updated!'
    await store.fetchUsers()
  } catch (err) { modalError.value = err.response?.data?.message || 'Failed' }
  finally { modalSaving.value = false }
}

async function handleBanUser() {
  modalSaving.value = true; modalError.value = ''; modalSuccess.value = ''
  try {
    await store.banUser(editUser.value.id, editForm.value.banReason)
    modalSuccess.value = 'User banned'; editUser.value.isBanned = true; await store.fetchUsers()
  } catch (err) { modalError.value = err.response?.data?.message || 'Failed' }
  finally { modalSaving.value = false }
}

async function handleUnbanUser() {
  modalSaving.value = true; modalError.value = ''; modalSuccess.value = ''
  try {
    await store.unbanUser(editUser.value.id)
    modalSuccess.value = 'User unbanned'; editUser.value.isBanned = false; await store.fetchUsers()
  } catch (err) { modalError.value = err.response?.data?.message || 'Failed' }
  finally { modalSaving.value = false }
}

async function handleToggleAdmin() {
  modalSaving.value = true; modalError.value = ''; modalSuccess.value = ''
  try {
    const newStatus = !editUser.value.isAdmin
    await store.updateUser(editUser.value.id, { isAdmin: newStatus })
    modalSuccess.value = newStatus ? 'Admin granted' : 'Admin revoked'; editUser.value.isAdmin = newStatus; await store.fetchUsers()
  } catch (err) { modalError.value = err.response?.data?.message || 'Failed' }
  finally { modalSaving.value = false }
}

async function handleDelete(user) {
  if (!confirm(`Delete "${user.username}"? This is permanent.`)) return
  try { await client.delete(`/admin/users/${user.id}`); await store.fetchUsers() }
  catch (err) { alert(err.response?.data?.message || 'Failed') }
}

function openRolesModal(user) {
  rolesUser.value = user; currentUserRoles.value = userRolesMap.value[user.id] || []
  rolesModalError.value = ''; rolesModalSuccess.value = ''; showRolesModal.value = true
}

async function toggleRoleForUser(role) {
  roleToggling.value = true; rolesModalError.value = ''; rolesModalSuccess.value = ''
  try {
    if (currentUserRoleIds.value.includes(role.id)) {
      await store.unassignRole(rolesUser.value.id, role.id)
      currentUserRoles.value = currentUserRoles.value.filter(r => r.id !== role.id)
      rolesModalSuccess.value = `"${role.name}" removed`
    } else {
      await store.assignRole(rolesUser.value.id, role.id)
      currentUserRoles.value.push(role)
      rolesModalSuccess.value = `"${role.name}" assigned`
    }
    userRolesMap.value[rolesUser.value.id] = [...currentUserRoles.value]
  } catch (err) { rolesModalError.value = err.response?.data?.message || 'Failed' }
  finally { roleToggling.value = false }
}
</script>
