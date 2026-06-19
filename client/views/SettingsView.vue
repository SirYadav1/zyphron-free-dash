<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Account Settings</h2>
      <p class="text-sm text-text-muted">Manage your security, integrations, and personal preferences.</p>
    </div>

    <!-- Status Messages -->
    <div v-if="discordError" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold animate-pulse flex items-center gap-2">
      <AlertTriangle :size="14" :stroke-width="2.5" /> {{ discordError }}
    </div>
    <div v-if="discordSuccess" class="card-surface p-4 border-accent/20 bg-accent/5 text-accent text-sm font-bold flex items-center gap-2">
      <CheckCircle :size="14" :stroke-width="2.5" /> {{ discordSuccess }}
    </div>

    <div class="space-y-8">
      <!-- Discord Section -->
      <div class="card-surface p-8 space-y-6 overflow-hidden relative group">
        <div class="absolute top-4 right-4 text-text-muted opacity-5 group-hover:opacity-10 transition-opacity">
          <svg class="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"></path>
          </svg>
        </div>

        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">Discord Integration</h3>
          <p class="text-sm text-text-muted">Link your account to verify your identity and manage deployments.</p>
        </div>

        <div v-if="discordLoading" class="flex items-center gap-3 text-text-muted">
          <div class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-semibold tracking-wider uppercase">Authenticating...</span>
        </div>

        <div v-else-if="discordLinked" class="space-y-6">
          <div class="flex items-center gap-4 p-4 bg-base/50 rounded-xl border border-border">
            <div class="w-12 h-12 rounded-full bg-[#5865F2]/10 border border-[#5865F2]/20 flex items-center justify-center">
              <User :size="22" :stroke-width="2" class="text-[#5865F2]" />
            </div>
            <div>
              <p class="text-base font-bold text-text-primary">{{ discordUsername }}</p>
              <p class="text-xs text-accent font-bold tracking-widest uppercase mt-0.5">Connected Account</p>
            </div>
          </div>
          <button @click="handleUnlink" :disabled="unlinking" class="btn-secondary text-red-400 border-red-500/20 hover:bg-red-500/5 hover:border-red-500/40">
            {{ unlinking ? 'Unlinking...' : 'Disconnect Account' }}
          </button>
        </div>

        <div v-else class="space-y-6 pt-2">
          <a :href="`/api/discord/link?token=${jwtToken}`" class="btn-primary inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] border-none text-white px-6">
            Connect Discord
          </a>
          <p class="text-[11px] text-text-muted font-medium">Must be a member of the official Zyphron server. You'll be redirected back after linking.</p>
        </div>
      </div>

      <!-- Profiles Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Profile Section -->
        <div class="card-surface p-8 space-y-8 flex flex-col">
          <h3 class="text-lg font-bold text-text-primary">Personal Profile</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div class="space-y-1">
              <p class="text-label opacity-40">Username</p>
              <p class="text-base font-bold text-text-primary truncate">{{ authStore.user?.username }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Email Address</p>
              <p class="text-base font-bold text-text-primary truncate" :title="authStore.user?.email">{{ authStore.user?.email }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Verification</p>
              <div class="flex items-center gap-2">
                <div :class="authStore.user?.emailVerified ? 'bg-accent' : 'bg-yellow-500'" class="w-1.5 h-1.5 rounded-full shrink-0"></div>
                <span class="text-sm font-bold">{{ authStore.user?.emailVerified ? 'Verified' : 'Pending' }}</span>
              </div>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Credit Balance</p>
              <p class="text-base font-bold text-yellow-500">{{ authStore.user?.coins || 0 }} Credits</p>
            </div>
          </div>
        </div>

        <!-- Pterodactyl Details Section -->
        <div class="card-surface p-8 space-y-8 flex flex-col">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
              Control Panel Details
              <a :href="pteroUrl || 'https://console.zyphron.cloud'" target="_blank" class="text-label hover:text-white transition-colors opacity-60 hover:opacity-100" title="Open Control Panel">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </h3>
            <a v-if="pteroUrl" :href="pteroUrl" target="_blank" class="btn-secondary py-1.5 px-4 text-xs shrink-0 ml-2">
              Open Panel
            </a>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <div class="space-y-1">
              <p class="text-label opacity-40">Panel ID</p>
              <p class="text-base font-bold text-text-primary">{{ authStore.user?.pterodactylUserId || 'N/A' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Username</p>
              <p class="text-base font-bold text-text-primary truncate">{{ authStore.user?.pterodactylUsername || authStore.user?.username || 'N/A' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Email Address</p>
              <p class="text-base font-bold text-text-primary truncate" :title="authStore.user?.email">{{ authStore.user?.email || 'N/A' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-label opacity-40">Password</p>
              <p class="text-base font-bold text-text-primary">••••••••</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="card-surface p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div class="space-y-1">
          <h3 class="text-lg font-bold text-text-primary">Billing & Transactions</h3>
          <p class="text-sm text-text-muted">Review your past purchases, credit additions, and detailed billing history.</p>
        </div>
        <router-link to="/transactions" class="btn-secondary whitespace-nowrap px-8 py-2.5">
          View History
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import { AlertTriangle, CheckCircle, User } from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()

const discordLinked = ref(false)
const discordUsername = ref('')
const discordLoading = ref(true)
const unlinking = ref(false)
const discordError = ref('')
const discordSuccess = ref('')
const pteroUrl = ref('')

const jwtToken = computed(() => sessionStorage.getItem('access_token') || '')  // BUG-H5 FIX

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch {
    // Profile may fail if not authenticated
  }
  try {
    await fetchDiscordStatus()
  } catch {
    // Ignore discord status errors
  }
  try {
    await fetchSettings()
  } catch {
    // Ignore settings errors
  }

  // Handle Discord OAuth callback query params
  const discordParam = route.query.discord
  if (discordParam === 'linked') {
    discordSuccess.value = 'Discord account linked successfully!'
  } else if (discordParam === 'not_in_guild') {
    discordError.value = 'You must join our Discord server before you can link your account.'
  } else if (discordParam === 'error') {
    discordError.value = 'Failed to link Discord account. Please try again. If this persists, contact support.'
  }
})

async function fetchSettings() {
  try {
    const { data } = await client.get('/config')
    pteroUrl.value = data.pterodactylPanelUrl || 'https://panel.zyphron.cloud/'
  } catch { /* ignore */ }
}

async function fetchDiscordStatus() {
  discordLoading.value = true
  try {
    const { data } = await client.get('/discord/status')
    discordLinked.value = data.linked
    discordUsername.value = data.discordUsername
  } catch {
    discordLinked.value = false
  } finally {
    discordLoading.value = false
  }
}

async function handleUnlink() {
  if (!confirm('Are you sure? This will suspend all your servers!')) return
  unlinking.value = true
  discordError.value = ''
  try {
    await client.post('/discord/unlink')
    discordLinked.value = false
    discordUsername.value = ''
    discordSuccess.value = 'Discord unlinked. Your servers have been suspended.'
  } catch (err) {
    discordError.value = err.response?.data?.message || 'Failed to unlink Discord'
  } finally {
    unlinking.value = false
  }
}
</script>
