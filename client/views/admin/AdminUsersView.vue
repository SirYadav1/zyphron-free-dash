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

    <div class="card-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">ID</th>
              <th class="px-5 py-3 text-label">Username</th>
              <th class="px-5 py-3 text-label">Email</th>
              <th class="px-5 py-3 text-label">Verified</th>
              <th class="px-5 py-3 text-label">Discord</th>
              <th class="px-5 py-3 text-label">Servers</th>
              <th class="px-5 py-3 text-label">Coins</th>
              <th class="px-5 py-3 text-label">Status</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in filteredUsers"
              :key="user.id"
              class="border-b border-border/50 hover:bg-white/[0.02] transition-colors"
            >
              <td class="px-5 py-3 text-text-muted text-xs">{{ user.id }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center gap-2">
                  <span class="text-text-primary font-bold text-sm">{{ user.username }}</span>
                  <span v-if="user.isAdmin" class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider">Admin</span>
                </div>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ user.email }}</td>
              <td class="px-5 py-3">
                <span :class="user.emailVerified ? 'text-accent' : 'text-yellow-500'" class="text-xs font-bold">
                  {{ user.emailVerified ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="px-5 py-3">
                <span :class="user.discordId ? 'text-indigo-400' : 'text-text-muted/40'" class="text-xs font-bold">
                  {{ user.discordId ? 'Linked' : '—' }}
                </span>
              </td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ user.serverCount }}</td>
              <td class="px-5 py-3 text-accent font-bold">{{ user.coins }}</td>
              <td class="px-5 py-3">
                <span :class="userStatusClass(user)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {{ userStatusText(user) }}
                </span>
              </td>
              <td class="px-5 py-3 text-right">
                <button
                  @click="openDetail(user)"
                  class="text-xs font-bold text-accent hover:text-white transition-colors"
                >
                  Manage
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredUsers.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Users Found</p>
        <p class="text-sm text-text-muted/60">No users match your search criteria.</p>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showDetail && selectedUser" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-[9999] pt-[5vh] pb-[5vh] px-4 overflow-y-auto" @click.self="showDetail = false">
      <div class="card-surface w-full max-w-2xl max-h-[90vh] overflow-y-auto my-auto shadow-2xl border border-border/50">
        <div class="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 class="text-xl font-bold text-text-primary">{{ selectedUser.username }}</h3>
            <p class="text-xs text-text-muted mt-1">ID: {{ selectedUser.id }} • {{ selectedUser.email }}</p>
          </div>
          <button @click="showDetail = false" class="text-text-muted hover:text-text-primary transition-colors text-2xl">×</button>
        </div>

        <div class="p-6 space-y-6">
          <div v-if="detailError" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">
            ⚠️ {{ detailError }}
          </div>
          <div v-if="detailSuccess" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">
            ✅ {{ detailSuccess }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-base/50 border border-border rounded-xl p-4">
              <span class="text-label block mb-1">IP Address</span>
              <span class="text-text-primary text-sm">{{ selectedUser.ipAddress || '—' }}</span>
            </div>
            <div class="bg-base/50 border border-border rounded-xl p-4">
              <span class="text-label block mb-1">Pterodactyl ID</span>
              <span class="text-text-primary text-sm">{{ selectedUser.pterodactylUserId || '—' }}</span>
            </div>
            <div class="bg-base/50 border border-border rounded-xl p-4">
              <span class="text-label block mb-1">Discord</span>
              <span class="text-text-primary text-sm">{{ selectedUser.discordUsername || 'Not linked' }}</span>
            </div>
            <div class="bg-base/50 border border-border rounded-xl p-4">
              <span class="text-label block mb-1">Created</span>
              <span class="text-text-primary text-sm">{{ formatDate(selectedUser.createdAt) }}</span>
            </div>
          </div>

          <div class="space-y-4 border-t border-border pt-6">
            <div class="space-y-3">
              <p class="text-label">Adjust Coins</p>
              <div class="flex items-center gap-3">
                <input v-model.number="editCoins" type="number" class="input-field flex-1" />
                <button
                  @click="handleUpdateCoins"
                  :disabled="updating"
                  class="btn-primary px-6 py-2"
                >
                  Update
                </button>
              </div>
            </div>

            <div class="space-y-3 pt-4 border-t border-border mt-4">
              <p class="text-label">Administrative Access</p>
              <div class="flex items-center justify-between bg-base/50 p-4 rounded-xl border border-border">
                <div>
                  <p class="text-sm font-bold text-text-primary">Admin Privileges</p>
                  <p class="text-xs text-text-muted mt-0.5">Grants full access to the control panel.</p>
                </div>
                <button
                  @click="handleToggleAdmin"
                  :disabled="updatingAdmin"
                  :class="selectedUser.isAdmin ? 'btn-secondary text-red-500 hover:border-red-500/50' : 'btn-primary'"
                  class="px-6 py-2 text-xs"
                >
                  {{ updatingAdmin ? 'Processing...' : selectedUser.isAdmin ? 'Revoke Admin' : 'Grant Admin' }}
                </button>
              </div>
            </div>

            <div class="flex gap-3 pt-4 border-t border-border mt-4">
              <button
                v-if="!selectedUser.isBanned"
                @click="handleBan"
                :disabled="banning"
                class="btn-secondary text-red-500 border-red-500/20 hover:bg-red-500/10 px-6 py-2"
              >
                {{ banning ? 'Banning...' : 'Ban User' }}
              </button>
              <button
                v-else
                @click="handleUnban"
                :disabled="unbanning"
                class="btn-secondary px-6 py-2"
              >
                {{ unbanning ? 'Unbanning...' : 'Unban User' }}
              </button>
            </div>

            <div v-if="userServers.length > 0" class="space-y-3 pt-4 border-t border-border mt-4">
              <p class="text-label">Servers ({{ userServers.length }})</p>
              <div class="overflow-x-auto">
                <table class="w-full text-xs">
                  <thead>
                    <tr class="border-b border-border text-left">
                      <th class="pb-2 pr-3 text-label">Name</th>
                      <th class="pb-2 pr-3 text-label">Type</th>
                      <th class="pb-2 pr-3 text-label">RAM</th>
                      <th class="pb-2 pr-3 text-label">CPU</th>
                      <th class="pb-2 pr-3 text-label">Disk</th>
                      <th class="pb-2 pr-3 text-label">Status</th>
                      <th class="pb-2 pr-3 text-label">Inactive</th>
                      <th class="pb-2 text-label">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="s in userServers" :key="s.id" class="border-b border-border/30">
                      <td class="py-2 pr-3 text-text-primary font-medium">{{ s.serverName }}</td>
                      <td class="py-2 pr-3">
                        <span :class="s.isFree ? 'text-accent' : 'text-purple-400'" class="font-bold text-[10px] uppercase">{{ s.isFree ? 'Free' : 'Paid' }}</span>
                      </td>
                      <td class="py-2 pr-3 text-text-muted">{{ s.ramMb || '—' }} MB</td>
                      <td class="py-2 pr-3 text-text-muted">{{ s.cpuPercent || '—' }}%</td>
                      <td class="py-2 pr-3 text-text-muted">{{ s.diskMb || '—' }} MB</td>
                      <td class="py-2 pr-3">
                        <span :class="s.status === 'active' ? 'text-emerald-400' : s.status === 'suspended' ? 'text-yellow-400' : 'text-red-400'" class="font-bold">{{ s.status }}</span>
                      </td>
                      <td class="py-2 pr-3 text-text-muted" :class="{ 'text-red-400 font-bold': s.inactiveDays >= 7 }">
                        {{ s.inactiveDays > 0 ? `${s.inactiveDays}d` : s.inactiveHours > 0 ? `${s.inactiveHours}h` : 'active' }}
                      </td>
                      <td class="py-2 text-text-muted">{{ formatDate(s.expiresAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="space-y-3 pt-4 border-t border-border mt-4">
              <p class="text-label">Roles</p>
              <div v-if="rolesLoading" class="text-xs text-text-muted">Loading roles...</div>
              <div v-else-if="roles.length === 0" class="text-xs text-text-muted">No roles defined. <router-link to="/admin/roles" class="text-accent">Create roles</router-link></div>
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="role in roles"
                  :key="role.id"
                  @click="toggleRole(role)"
                  :disabled="roleToggling"
                  :class="userRoleIds.includes(role.id) ? 'bg-accent/20 text-accent border-accent/40' : 'bg-base text-text-muted border-border hover:border-border-bright'"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                >
                  {{ role.name }}
                  <span v-if="userRoleIds.includes(role.id)" class="ml-1">✓</span>
                </button>
              </div>
            </div>

            <div v-if="showBanReason" class="flex gap-3">
              <input
                v-model="banReason"
                placeholder="Ban reason (optional)"
                class="input-field flex-1"
              />
              <button
                @click="confirmBan"
                :disabled="banning"
                class="btn-primary bg-red-500 hover:bg-red-600 px-6 py-2 shadow-none"
              >
                Confirm
              </button>
              <button
                @click="showBanReason = false"
                class="btn-secondary px-6 py-2"
              >
                Cancel
              </button>
            </div>
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

const store = useAdminStore()
const showDetail = ref(false)
const selectedUser = ref(null)
const userServers = ref([])
const editCoins = ref(0)
const updating = ref(false)
const updatingAdmin = ref(false)
const banning = ref(false)
const unbanning = ref(false)
const detailError = ref('')
const detailSuccess = ref('')
const showBanReason = ref(false)
const banReason = ref('')
const searchQuery = ref('')
const roles = ref([])
const userRoles = ref([])
const rolesLoading = ref(false)
const roleToggling = ref(false)

const userRoleIds = computed(() => userRoles.value.map(r => r.id))

const filteredUsers = computed(() => {
  if (!searchQuery.value) return store.users
  const q = searchQuery.value.toLowerCase()
  return store.users.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q) ||
    String(u.id).includes(q)
  )
})

onMounted(() => {
  store.fetchUsers()
  store.fetchRoles().then(() => {
    roles.value = store.roles
  })
})

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

async function openDetail(user) {
  selectedUser.value = user
  editCoins.value = user.coins
  showDetail.value = true
  detailError.value = ''
  detailSuccess.value = ''
  showBanReason.value = false
  banReason.value = ''
  userServers.value = []
  userRoles.value = []
  try {
    const detail = await store.fetchUserDetail(user.id)
    userServers.value = (detail.servers || []).map(s => ({ ...s, isFree: true }))
  } catch {
    detailError.value = 'Failed to load user servers'
  }
  try {
    userRoles.value = await store.getUserRoles(user.id)
  } catch {
    // roles unavailable
  }
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
}

async function handleUpdateCoins() {
  updating.value = true
  detailError.value = ''
  detailSuccess.value = ''
  try {
    await store.updateUser(selectedUser.value.id, { coins: parseInt(editCoins.value) })
    detailSuccess.value = 'Coins updated'
    selectedUser.value.coins = parseInt(editCoins.value)
    await store.fetchUsers()
  } catch (err) {
    detailError.value = err.response?.data?.message || 'Failed to update'
  } finally {
    updating.value = false
  }
}

async function handleToggleAdmin() {
  updatingAdmin.value = true
  detailError.value = ''
  detailSuccess.value = ''
  try {
    const newStatus = !selectedUser.value.isAdmin
    await store.updateUser(selectedUser.value.id, { isAdmin: newStatus })
    detailSuccess.value = newStatus ? 'Admin privileges granted' : 'Admin privileges revoked'
    selectedUser.value.isAdmin = newStatus
    await store.fetchUsers()
  } catch (err) {
    detailError.value = err.response?.data?.message || 'Failed to update admin status'
  } finally {
    updatingAdmin.value = false
  }
}

function handleBan() {
  showBanReason.value = true
}

async function confirmBan() {
  banning.value = true
  detailError.value = ''
  detailSuccess.value = ''
  try {
    const result = await store.banUser(selectedUser.value.id, banReason.value)
    detailSuccess.value = result.message
    selectedUser.value.isBanned = true
    await store.fetchUsers()
  } catch (err) {
    detailError.value = err.response?.data?.message || 'Failed to ban'
  } finally {
    banning.value = false
    showBanReason.value = false
    banReason.value = ''
  }
}

async function handleUnban() {
  unbanning.value = true
  detailError.value = ''
  detailSuccess.value = ''
  try {
    const result = await store.unbanUser(selectedUser.value.id)
    detailSuccess.value = result.message
    selectedUser.value.isBanned = false
    await store.fetchUsers()
  } catch (err) {
    detailError.value = err.response?.data?.message || 'Failed to unban'
  } finally {
    unbanning.value = false
  }
}

async function toggleRole(role) {
  roleToggling.value = true
  detailError.value = ''
  detailSuccess.value = ''
  try {
    const hasRole = userRoleIds.value.includes(role.id)
    if (hasRole) {
      await store.unassignRole(selectedUser.value.id, role.id)
      userRoles.value = userRoles.value.filter(r => r.id !== role.id)
      detailSuccess.value = `Role "${role.name}" removed`
    } else {
      await store.assignRole(selectedUser.value.id, role.id)
      userRoles.value.push(role)
      detailSuccess.value = `Role "${role.name}" assigned`
    }
  } catch (err) {
    detailError.value = err.response?.data?.message || 'Failed to update role'
  } finally {
    roleToggling.value = false
  }
}
</script>
