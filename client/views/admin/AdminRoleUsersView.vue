<template>
  <div class="space-y-10">
    <div class="space-y-1">
      <div class="flex items-center gap-3">
        <router-link to="/admin/roles" class="text-sm text-accent hover:text-white transition-colors">&larr; Back to Roles</router-link>
      </div>
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Role Users</h2>
      <p class="text-sm text-text-muted">Users assigned to <span class="text-accent font-bold">{{ roleName }}</span></p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMsg" class="p-3 bg-accent/10 border border-accent/20 rounded-md text-xs font-bold text-accent">
      ✅ {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-xs font-bold text-red-500">
      ⚠️ {{ errorMsg }}
    </div>

    <!-- Add User Section -->
    <div class="card-surface p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-text-primary">Add User to Role</h3>
      </div>
      <div class="flex gap-3">
        <div class="relative flex-1">
          <input
            v-model="addSearchQuery"
            type="text"
            placeholder="Search users by name or email..."
            class="input-field w-full"
            @input="searchUsersToAdd"
            @focus="showDropdown = true"
          />
          <!-- Dropdown for search results -->
          <div
            v-if="showDropdown && filteredUsersToAdd.length > 0"
            class="absolute top-full left-0 right-0 mt-1 bg-base border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            <div
              v-for="user in filteredUsersToAdd"
              :key="user.id"
              @click="selectUserToAdd(user)"
              class="px-4 py-3 hover:bg-white/[0.05] cursor-pointer border-b border-border/30 last:border-0 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-text-primary font-bold text-sm">{{ user.username }}</span>
                  <span class="text-text-muted text-xs ml-2">{{ user.email }}</span>
                </div>
                <button
                  @click.stop="addUserToRole(user)"
                  :disabled="assigning"
                  class="text-xs font-bold text-accent hover:text-white transition-colors px-3 py-1 bg-accent/10 rounded-lg hover:bg-accent/20"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Assigned Users Table -->
    <div class="card-surface overflow-hidden">
      <div class="px-5 py-3 border-b border-border bg-base/50">
        <div class="flex items-center justify-between">
          <span class="text-sm font-bold text-text-primary">Assigned Users ({{ users.length }})</span>
          <input
            v-model="filterQuery"
            type="text"
            placeholder="Filter assigned users..."
            class="input-field w-48 text-xs"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border bg-base/50 text-left">
              <th class="px-5 py-3 text-label">User ID</th>
              <th class="px-5 py-3 text-label">Username</th>
              <th class="px-5 py-3 text-label">Email</th>
              <th class="px-5 py-3 text-label text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filteredUsers" :key="u.id" class="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
              <td class="px-5 py-3 text-text-muted text-xs font-mono">{{ u.id }}</td>
              <td class="px-5 py-3 text-text-primary font-bold text-sm">{{ u.username }}</td>
              <td class="px-5 py-3 text-text-muted text-sm">{{ u.email || '—' }}</td>
              <td class="px-5 py-3 text-right">
                <div class="flex items-center justify-end gap-3">
                  <router-link :to="`/admin/users/${u.id}`" class="text-xs font-bold text-accent hover:text-white transition-colors">View</router-link>
                  <button
                    @click="removeUserFromRole(u)"
                    :disabled="removingUserId === u.id"
                    class="text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {{ removingUserId === u.id ? 'Removing...' : 'Remove' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredUsers.length === 0" class="py-16 text-center">
        <p class="text-text-muted text-lg font-bold mb-1">No Users</p>
        <p class="text-sm text-text-muted/60">{{ filterQuery ? 'No users match your filter.' : 'No users are assigned to this role.' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '../../api/client'
import { useAdminStore } from '../../stores/admin'

const route = useRoute()
const store = useAdminStore()
const roleId = route.params.id

const roleName = ref('')
const users = ref([])
const allUsers = ref([])

// add user search
const addSearchQuery = ref('')
const showDropdown = ref(false)
const assigning = ref(false)

// filter assigned users
const filterQuery = ref('')

// remove user
const removingUserId = ref(null)

// messages
const successMsg = ref('')
const errorMsg = ref('')

const filteredUsersToAdd = computed(() => {
  if (!addSearchQuery.value) return []
  const q = addSearchQuery.value.toLowerCase()
  const assignedIds = users.value.map(u => u.id)
  return allUsers.value.filter(u =>
    !assignedIds.includes(u.id) &&
    (u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q)))
  )
})

const filteredUsers = computed(() => {
  if (!filterQuery.value) return users.value
  const q = filterQuery.value.toLowerCase()
  return users.value.filter(u =>
    u.username.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q))
  )
})

// close dropdown on outside click
function handleClickOutside(e) {
  if (!e.target.closest('.relative')) {
    showDropdown.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside)

  // fetch role name
  try {
    const { data: role } = await client.get(`/admin/roles/${roleId}`)
    roleName.value = role.name || ''
  } catch { /* ignore */ }

  // fetch assigned users
  await fetchAssignedUsers()

  // fetch all users for search
  try {
    await store.fetchUsers()
    allUsers.value = store.users || []
  } catch { /* ignore */ }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

async function fetchAssignedUsers() {
  try {
    const { data } = await client.get(`/admin/roles/${roleId}/users`)
    users.value = Array.isArray(data) ? data : []
  } catch { /* ignore */ }
}

function searchUsersToAdd() {
  showDropdown.value = true
}

function selectUserToAdd(user) {
  addSearchQuery.value = user.username
  showDropdown.value = false
}

async function addUserToRole(user) {
  assigning.value = true
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await store.assignRole(user.id, parseInt(roleId))
    users.value.push(user)
    addSearchQuery.value = ''
    showDropdown.value = false
    successMsg.value = `"${user.username}" added to role "${roleName.value}"`
    setTimeout(() => successMsg.value = '', 3000)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to add user'
    setTimeout(() => errorMsg.value = '', 3000)
  } finally {
    assigning.value = false
  }
}

async function removeUserFromRole(user) {
  removingUserId.value = user.id
  successMsg.value = ''
  errorMsg.value = ''
  try {
    await store.unassignRole(user.id, parseInt(roleId))
    users.value = users.value.filter(u => u.id !== user.id)
    successMsg.value = `"${user.username}" removed from role "${roleName.value}"`
    setTimeout(() => successMsg.value = '', 3000)
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Failed to remove user'
    setTimeout(() => errorMsg.value = '', 3000)
  } finally {
    removingUserId.value = null
  }
}
</script>
