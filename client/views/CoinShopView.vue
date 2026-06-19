<template>
  <div class="max-w-4xl mx-auto space-y-10">
    <!-- Header -->
    <div class="space-y-1">
      <h2 class="text-2xl font-bold text-text-primary tracking-tight">Coin Shop</h2>
      <p class="text-sm text-text-muted">Buy coin packages to deploy and manage your servers.</p>
    </div>

    <!-- Current Balance -->
    <div class="card-surface p-6 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p class="text-xs font-bold text-text-muted uppercase tracking-widest">Current Balance</p>
          <p class="text-2xl font-bold text-accent tabular-nums">{{ authStore.user?.coins || 0 }} <span class="text-sm font-medium text-text-muted">coins</span></p>
        </div>
      </div>
      <router-link to="/servers/create" class="btn-primary px-5 py-2 text-sm">
        Deploy Server
      </router-link>
    </div>

    <!-- Feedback -->
    <div v-if="error" class="card-surface p-4 border-red-500/20 bg-red-500/5 text-red-500 text-sm font-bold flex items-center gap-3">
      <span>⚠️</span> {{ error }}
    </div>

    <div v-if="success" class="card-surface p-4 border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-sm font-bold flex items-center gap-3">
      <span>✅</span> {{ success }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      <p class="text-xs font-semibold text-text-muted uppercase tracking-widest">Loading Packages...</p>
    </div>

    <!-- No packages -->
    <div v-else-if="packages.length === 0" class="card-surface p-8 text-center">
      <div class="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <p class="text-text-muted font-medium">No coin packages available yet.</p>
      <p class="text-xs text-text-muted mt-1">Check back later or earn coins through the AFK system.</p>
    </div>

    <!-- Coin Packages Grid -->
    <div v-else class="space-y-4">
      <h3 class="text-label">Available Packages</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="card-surface p-6 flex flex-col transition-all hover:border-accent/30 group"
        >
          <div class="flex-1 space-y-4">
            <!-- Package Icon -->
            <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <!-- Package Details -->
            <div>
              <h4 class="font-bold text-text-primary text-lg">{{ pkg.display }}</h4>
              <p v-if="pkg.description" class="text-sm text-text-muted mt-1">{{ pkg.description }}</p>
            </div>

            <!-- Credits Amount -->
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold text-accent tabular-nums">{{ pkg.quantity }}</span>
              <span class="text-sm font-medium text-text-muted">coins</span>
            </div>

            <!-- Price -->
            <div class="flex items-center gap-2 pt-2 border-t border-border">
              <span class="text-lg font-bold text-text-primary tabular-nums">{{ pkg.price }}</span>
              <span class="text-xs font-bold text-text-muted uppercase">{{ pkg.currency_code }}</span>
            </div>
          </div>

          <!-- Buy Button -->
          <button
            @click="buyPackage(pkg)"
            :disabled="buying"
            class="btn-primary w-full mt-6 py-2.5 text-sm"
          >
            {{ buying ? 'Processing...' : 'Buy Now' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Info Note -->
    <div class="card-surface p-4 border-border bg-white/[0.02]">
      <div class="flex items-start gap-3">
        <div class="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5 shrink-0">
          <svg class="w-3 h-3 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-bold text-text-primary">How Coins Work</p>
          <p class="text-[11px] text-text-muted leading-relaxed">
            Coins are used to deploy and maintain servers on the Zyphron network.
            Each server plan costs a specific number of coins. You can also earn coins
            by using the AFK earning system or purchasing packages here.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'

const authStore = useAuthStore()
const packages = ref([])
const loading = ref(true)
const buying = ref(false)
const error = ref('')
const success = ref('')

onMounted(async () => {
  try {
    const { data } = await client.get('/credits/packages')
    packages.value = data
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load credit packages'
  } finally {
    loading.value = false
  }
})

async function buyPackage(pkg) {
  buying.value = true
  error.value = ''
  success.value = ''
  try {
    const { data } = await client.post('/credits/buy', { packageId: pkg.id })
    success.value = data.message
    await authStore.fetchProfile()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to purchase coins'
  } finally {
    buying.value = false
  }
}
</script>
