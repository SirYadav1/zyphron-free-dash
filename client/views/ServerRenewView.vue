<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Renewal Info...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card-surface p-6 border-red-500/20 bg-red-500/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Error</p>
        <p class="text-xs text-text-muted mt-0.5">{{ error }}</p>
      </div>
    </div>

    <!-- Success -->
    <div v-else-if="success" class="card-surface p-6 border-accent/20 bg-accent/5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-bold text-text-primary">Renewal Successful!</p>
        <p class="text-xs text-text-muted mt-0.5">{{ success }}</p>
      </div>
      <router-link to="/servers" class="ml-auto btn-primary px-4 py-2 text-xs font-bold">
        Back to Servers
      </router-link>
    </div>

    <!-- Renewal Form -->
    <template v-else-if="renewalInfo">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <h2 class="text-2xl font-bold text-text-primary tracking-tight">Renew Server</h2>
          <p class="text-sm text-text-muted">Extend the lease for <span class="text-text-primary font-bold">{{ renewalInfo.server.serverName }}</span></p>
        </div>
        <div :class="statusClass" class="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border">
          {{ renewalInfo.server.status }}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <!-- Main Info -->
        <div class="space-y-6">
          <!-- Server Status Card -->
          <div class="card-surface p-8 space-y-6">
            <h3 class="text-label">Server Details</h3>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Server Name</span>
                <span class="text-sm font-bold text-text-primary">{{ renewalInfo.server.serverName }}</span>
              </div>
              <div class="h-px bg-border"></div>

              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Current Status</span>
                <span :class="statusTextClass" class="text-xs font-bold uppercase tracking-wider">{{ renewalInfo.server.status }}</span>
              </div>
              <div class="h-px bg-border"></div>

              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Expires At</span>
                <span class="text-sm font-bold text-text-primary tabular-nums">{{ formatDate(renewalInfo.server.expiresAt) }}</span>
              </div>
              <div class="h-px bg-border"></div>

              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Days Remaining</span>
                <span :class="renewalInfo.daysRemaining !== null && renewalInfo.daysRemaining <= 2 ? 'text-red-400' : 'text-text-primary'" class="text-sm font-bold tabular-nums">
                  {{ renewalInfo.daysRemaining !== null ? renewalInfo.daysRemaining + ' days' : 'Expired' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Renewal Warning -->
          <div v-if="renewalInfo.isExpiringSoon || renewalInfo.server.isSuspended" 
            class="card-surface p-6 border-yellow-500/20 bg-yellow-500/5">
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 flex-shrink-0 mt-0.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm font-bold text-yellow-500">
                  {{ renewalInfo.server.isSuspended ? 'Server Suspended' : 'Expiring Soon' }}
                </p>
                <p class="text-xs text-text-muted mt-1">
                  {{ renewalInfo.server.isSuspended 
                    ? 'Your server has been suspended due to expiry. Renew now to restore access.'
                    : 'Your server is expiring soon. Renew now to avoid suspension.' 
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar - Renewal Action -->
        <div class="space-y-6">
          <div class="card-surface p-6 space-y-6">
            <p class="text-label opacity-50">Renewal Details</p>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-text-muted">Your Balance</span>
                <span class="text-base font-bold text-yellow-500 tabular-nums">{{ renewalInfo.userCoins }} credits</span>
              </div>
              <div class="h-px bg-border"></div>

              <div class="space-y-4 pt-2">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Renewal Term</p>
                    <p class="text-xs font-bold text-text-primary">{{ renewalInfo.renewalDays }} Days</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-40">Cost</p>
                    <p class="text-xs font-bold text-accent tabular-nums">{{ renewalInfo.renewalPrice }} credits</p>
                  </div>
                </div>
                <button
                  @click="handleRenew"
                  :disabled="loading || !renewalInfo.canRenew"
                  class="btn-primary w-full py-2.5 text-[11px] font-bold uppercase tracking-widest"
                >
                  {{ loading ? 'Processing...' : renewalInfo.canRenew ? 'Renew Now' : 'Insufficient Credits' }}
                </button>
              </div>
            </div>
          </div>

          <div class="card-surface p-6 space-y-4">
            <p class="text-label opacity-50">How It Works</p>
            <div class="space-y-3 text-[11px] text-text-muted">
              <div class="flex items-start gap-2">
                <span class="text-accent font-bold">1.</span>
                <span>Pay {{ renewalInfo.renewalPrice }} credits to extend by {{ renewalInfo.renewalDays }} days</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-accent font-bold">2.</span>
                <span>Your server will remain active or be restored if suspended</span>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-accent font-bold">3.</span>
                <span>Expiry date extends from current expiry (or today if already expired)</span>
              </div>
            </div>
          </div>

          <router-link to="/servers" class="block text-center text-xs font-bold text-text-muted hover:text-accent transition-colors py-2">
            ← Back to Servers
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import client from '../api/client'

const route = useRoute()
const router = useRouter()
const serverId = computed(() => parseInt(route.params.id))

const renewalInfo = ref(null)
const loading = ref(true)
const error = ref(null)
const success = ref(null)

const statusClass = computed(() => {
  const s = renewalInfo.value?.server?.status
  return s === 'active' ? 'border-accent/20 text-accent bg-accent/5' :
         s === 'suspended' ? 'border-yellow-500/20 text-yellow-500 bg-yellow-500/5' :
         'border-red-500/20 text-red-500 bg-red-500/5'
})

const statusTextClass = computed(() => {
  const s = renewalInfo.value?.server?.status
  return s === 'active' ? 'text-accent' :
         s === 'suspended' ? 'text-yellow-500' :
         'text-red-400'
})

onMounted(async () => {
  try {
    const { data } = await client.get(`/servers/${serverId.value}/renewal-info`)
    renewalInfo.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load renewal information'
  } finally {
    loading.value = false
  }
})

async function handleRenew() {
  if (!renewalInfo.value?.canRenew) return

  loading.value = true
  error.value = null
  success.value = null

  try {
    const { data } = await client.post(`/servers/${serverId.value}/renew`)
    success.value = data.message
    renewalInfo.value.userCoins = data.remainingCoins
    renewalInfo.value.server.expiresAt = data.newExpiresAt
    renewalInfo.value.server.status = 'active'
    renewalInfo.value.server.isSuspended = false
  } catch (err) {
    error.value = err.response?.data?.message || 'Renewal failed'
  } finally {
    loading.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
