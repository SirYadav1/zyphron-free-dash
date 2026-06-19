<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Profile</h2>
      <p class="text-sm text-text-muted">Manage your personal information and account details.</p>
    </div>

    <div v-if="authStore.loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading Profile...</p>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMsg" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold">
      {{ successMsg }}
    </div>
    <div v-if="updateError" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold">
      {{ updateError }}
    </div>

    <template v-if="authStore.user">
      <!-- Avatar & Overview -->
      <div class="card-surface p-8 flex flex-col sm:flex-row items-center sm:items-start gap-8">
        <div class="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-2xl font-bold text-accent shrink-0">
          {{ userInitials }}
        </div>
        <div class="flex-1 text-center sm:text-left space-y-1">
          <h3 class="text-xl font-bold text-text-primary">{{ authStore.user.username }}</h3>
          <p class="text-sm text-text-muted">{{ authStore.user.email }}</p>
          <div class="flex items-center justify-center sm:justify-start gap-4 mt-4">
            <div class="flex items-center gap-2">
              <div :class="authStore.user.emailVerified ? 'bg-accent' : 'bg-yellow-500'" class="w-1.5 h-1.5 rounded-full"></div>
              <span class="text-xs font-bold">{{ authStore.user.emailVerified ? 'Verified' : 'Pending' }}</span>
            </div>
            <div class="text-yellow-500 text-sm font-bold tabular-nums">{{ authStore.user.coins || 0 }} Credits</div>
          </div>
        </div>
      </div>

      <!-- Edit Profile Form -->
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">Edit Profile</h3>
          <p class="text-sm text-text-muted">Update your personal information.</p>
        </div>

        <div class="space-y-1.5">
          <label for="username" class="text-label">Username</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="input-field"
            maxlength="50"
            placeholder="Your username"
          />
        </div>

        <div class="space-y-1.5">
          <label for="email" class="text-label">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="input-field"
            maxlength="255"
            placeholder="your@email.com"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="space-y-1.5">
            <label for="first_name" class="text-label">First Name</label>
            <input
              id="first_name"
              v-model="form.first_name"
              type="text"
              class="input-field"
              maxlength="50"
              placeholder="First name"
            />
          </div>
          <div class="space-y-1.5">
            <label for="last_name" class="text-label">Last Name</label>
            <input
              id="last_name"
              v-model="form.last_name"
              type="text"
              class="input-field"
              maxlength="50"
              placeholder="Last name"
            />
          </div>
        </div>

        <div class="pt-4 border-t border-border flex justify-end">
          <button @click="handleUpdate" :disabled="saving" class="btn-primary px-8">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Account Details -->
      <div class="card-surface p-8 space-y-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">Account Details</h3>
          <p class="text-sm text-text-muted">Read-only information about your account.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="space-y-1">
            <p class="text-label opacity-40">User ID</p>
            <p class="text-sm font-bold text-text-primary font-mono">{{ authStore.user.id }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-label opacity-40">Role</p>
            <p class="text-sm font-bold text-text-primary">{{ authStore.user.isAdmin ? 'Administrator' : 'User' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-label opacity-40">Created At</p>
            <p class="text-sm font-bold text-text-primary">{{ formatDate(authStore.user.createdAt || authStore.user.created_at) }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-label opacity-40">Credit Balance</p>
            <p class="text-sm font-bold text-yellow-500 tabular-nums">{{ authStore.user.coins || 0 }} Credits</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'

const authStore = useAuthStore()

const saving = ref(false)
const updateError = ref('')
const successMsg = ref('')

const form = reactive({
  username: '',
  email: '',
  first_name: '',
  last_name: '',
})

const userInitials = computed(() => {
  const first = authStore.user?.first_name
  const last = authStore.user?.last_name
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase()
  if (first) return first.charAt(0).toUpperCase()
  const name = authStore.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

onMounted(async () => {
  try {
    await authStore.fetchProfile()
    if (authStore.user) {
      form.username = authStore.user.username || ''
      form.email = authStore.user.email || ''
      form.first_name = authStore.user.first_name || ''
      form.last_name = authStore.user.last_name || ''
    }
  } catch {
    // Error handled in store
  }
})

async function handleUpdate() {
  if (!form.username.trim() || !form.email.trim()) return
  saving.value = true
  updateError.value = ''
  successMsg.value = ''
  try {
    const { data } = await client.put('/auth/me', {
      username: form.username.trim(),
      email: form.email.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
    })
    authStore.user = data
    successMsg.value = 'Profile updated successfully.'
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Failed to update profile'
  } finally {
    saving.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
