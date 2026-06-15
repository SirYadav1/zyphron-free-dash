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
        <!-- Profile Photo Section -->
        <div class="relative group shrink-0">
          <div
            class="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/20 flex items-center justify-center cursor-pointer transition-all hover:border-accent/40"
            @click="triggerFileInput"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="handleDrop"
            :class="{ 'ring-2 ring-accent/30 ring-offset-2 ring-offset-surface': dragOver }"
          >
            <img
              v-if="photoPreview || authStore.user.profilePhoto"
              :src="photoPreview || authStore.user.profilePhoto"
              alt="Profile"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-2xl font-bold text-accent">{{ userInitials }}</span>
          </div>
          <!-- Hover overlay -->
          <div
            class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            @click="triggerFileInput"
          >
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            class="hidden"
            @change="handleFileSelect"
          />
          <!-- Upload button -->
          <button
            v-if="selectedFile"
            @click="uploadPhoto"
            :disabled="uploading"
            class="mt-3 w-full btn-primary py-1.5 text-xs"
          >
            {{ uploading ? 'Uploading...' : 'Upload Photo' }}
          </button>
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
const fileInput = ref(null)
const selectedFile = ref(null)
const photoPreview = ref('')
const uploading = ref(false)
const dragOver = ref(false)

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
    // error handled in store
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  processFile(file)
}

function handleDrop(e) {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) return
  processFile(file)
}

function processFile(file) {
  selectedFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

async function uploadPhoto() {
  if (!selectedFile.value) return
  uploading.value = true
  updateError.value = ''
  successMsg.value = ''
  try {
    const formData = new FormData()
    formData.append('photo', selectedFile.value)
    const { data } = await client.post('/auth/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    authStore.user.profilePhoto = data.profilePhoto
    selectedFile.value = null
    photoPreview.value = ''
    successMsg.value = 'Profile photo updated successfully.'
  } catch (err) {
    updateError.value = err.response?.data?.message || 'Failed to upload photo'
  } finally {
    uploading.value = false
  }
}

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
