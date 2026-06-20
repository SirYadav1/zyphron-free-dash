<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Manage Users</h2>
        <p class="text-sm text-text-muted mt-1">{{ filteredUsers.length }} of {{ store.users.length }} users</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, email, ID..."
            class="input-field pl-9 pr-4 py-2 w-64"
          />
        </div>
        <select v-model="perPage" class="input-field w-28 py-2">
          <option :value="10">10 / page</option>
          <option :value="25">25 / page</option>
          <option :value="50">50 / page</option>
          <option :value="100">100 / page</option>
        </select>
        <router-link to="/admin/users/create" class="btn-primary inline-flex items-center gap-2 py-2 px-4">
          <Plus :size="16" :stroke-width="2" /> Create New
        </router-link>
      </div>
    </div>

    <!-- Users Table -->
    <div v-if="paginatedUsers.length > 0" class="bg-[#1e293b] border border-border rounded-xl overflow-hidden">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr class="border-b border-border bg-[#0f172a]">
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">ID</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Email</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Client Name</th>
            <th class="px-5 py-3 text-left text-[10px] font-bold text-text-muted uppercase tracking-wider">Username</th>
            <th class="px-5 py-3 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider">2FA</th>
            <th class="px-5 py-3 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider">Servers</th>
            <th class="px-5 py-3 text-right text-[10px] font-bold text-text-muted uppercase tracking-wider w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(user, idx) in paginatedUsers"
            :key="user.id"
            class="border-b border-border/30 last:border-b-0 transition-colors"
            :class="idx % 2 === 0 ? 'bg-[#1e293b]' : 'bg-[#1a2537]'"
          >
            <!-- ID -->
            <td class="px-5 py-3">
              <span class="text-xs text-text-muted font-mono">{{ (currentPage - 1) * perPage + idx + 1 }}</span>
            </td>
            <!-- Email with star for admin -->
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <Star
                  v-if="user.isAdmin"
                  :size="14"
                  class="text-yellow-400 flex-shrink-0"
                  fill="currentColor"
                />
                <span class="text-xs text-text-muted truncate max-w-[200px] block">{{ user.email || '—' }}</span>
              </div>
            </td>
            <!-- Client Name -->
            <td class="px-5 py-3">
              <span class="text-xs text-text-primary">
                {{ getClientName(user) }}
              </span>
            </td>
            <!-- Username -->
            <td class="px-5 py-3">
              <div class="flex items-center gap-2">
                <div
                  :class="user.isBanned ? 'bg-red-500/20 text-red-400' : user.isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-accent/10 text-accent'"
                  class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                >
                  {{ getInitials(user.username) }}
                </div>
                <div class="min-w-0">
                  <span class="text-xs text-text-primary font-semibold block truncate">{{ user.username }}</span>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span v-if="user.isAdmin" class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/15 text-red-400">Admin</span>
                    <span v-for="role in getUserRoles(user)" :key="role.name"
                      :class="getRoleBadgeClass(role.name)"
                      class="px-1.5 py-0.5 rounded text-[8px] font-bold"
                    >{{ role.name }}</span>
                  </div>
                </div>
              </div>
            </td>
            <!-- 2FA -->
            <td class="px-5 py-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <ShieldCheck v-if="user.twoFactorEnabled" :size="14" class="text-emerald-400" />
                <ShieldOff v-else :size="14" class="text-red-400/60" />
                <span class="text-[10px] font-bold" :class="user.twoFactorEnabled ? 'text-emerald-400' : 'text-red-400/60'">
                  {{ user.twoFactorEnabled ? 'On' : 'Off' }}
                </span>
              </div>
            </td>
            <!-- Servers Owned -->
            <td class="px-5 py-3 text-center">
              <span class="text-xs font-bold text-text-primary">{{ user.serverCount || 0 }}</span>
            </td>
            <!-- Actions -->
            <td class="px-5 py-3 text-right">
              <div class="flex gap-1.5 justify-end">
                <router-link
                  :to="`/admin/users/${user.id}/edit`"
                  class="px-2.5 py-1 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 rounded hover:bg-emerald-500/10 transition-colors inline-flex items-center gap-1"
                >
                  <Edit3 :size="12" /> Edit
                </router-link>
                <button
                  @click="handleDelete(user)"
                  class="px-2.5 py-1 text-[10px] font-bold text-red-400 border border-red-500/20 rounded hover:bg-red-500/10 transition-colors"
                  title="Delete User"
                >
                  <Trash2 :size="12" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-border bg-[#0f172a]">
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
    <div v-if="filteredUsers.length === 0 && !store.loading" class="bg-[#1e293b] border border-border rounded-xl py-16 text-center">
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
        <div class="bg-[#1e293b] border border-border rounded-xl w-full max-w-md shadow-2xl">
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
            <div class="flex items-center justify-between p-3 bg-[#0f172a]/50 rounded-lg border border-border">
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
        <div class="bg-[#1e293b] border border-border rounded-xl w-full max-w-md shadow-2xl">
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
                :class="currentUserRoleIds.includes(role.id) ? 'bg-accent/20 text-accent border-accent/40' : 'bg-[#0f172a] text-text-muted border-border hover:border-border-bright'"
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
import {
  Search,
  Plus,
  Star,
  ShieldCheck,
  ShieldOff,
  Power,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-vue-next'

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
    String(u.id).includes(q) ||
    (u.first_name && u.first_name.toLowerCase().includes(q)) ||
    (u.last_name && u.last_name.toLowerCase().includes(q))
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
function getClientName(user) {
  const parts = []
  if (user.last_name) parts.push(user.last_name)
  if (user.first_name) parts.push(user.first_name)
  if (parts.length === 0) return '—'
  return parts.join(', ')
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
