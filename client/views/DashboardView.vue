<template>
  <div class="space-y-10">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-bold text-text-primary tracking-tight">Dashboard</h2>
        <p class="text-sm text-text-muted">Welcome back, {{ authStore.user?.username || 'User' }}.</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex items-center gap-2">
        <Plus :size="16" :stroke-width="2.5" />
        Deploy Server
      </router-link>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-surface p-5 space-y-2 card-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Server :size="20" :stroke-width="2" />
          </div>
          <div>
            <p class="text-label">Total Servers</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ animatedStats.servers }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2 card-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle :size="20" :stroke-width="2" />
          </div>
          <div>
            <p class="text-label">Active</p>
            <p class="text-2xl font-bold text-emerald-400 tabular-nums">{{ animatedStats.active }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2 card-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Clock :size="20" :stroke-width="2" />
          </div>
          <div>
            <p class="text-label">Expiring Soon</p>
            <p class="text-2xl font-bold text-yellow-400 tabular-nums">{{ expiringSoonCount }}</p>
          </div>
        </div>
      </div>

      <div class="card-surface p-5 space-y-2 card-hover">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Coins :size="20" :stroke-width="2" />
          </div>
          <div>
            <p class="text-label">Credits</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ animatedStats.credits }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="store.loading" class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="loading-spinner"></div>
      <p class="text-xs font-semibold text-text-muted tracking-widest uppercase">Loading...</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- MOTD Card -->
      <div class="card-surface p-6 lg:col-span-2 card-hover">
        <div class="flex items-center gap-2 mb-4">
          <Megaphone :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Message of the Day</h3>
        </div>
        <p class="text-sm text-text-muted leading-relaxed">Welcome to Zyphron. Configure this message in Settings.</p>
      </div>

      <!-- Useful Links from API -->
      <div class="card-surface p-6 card-hover">
        <div class="flex items-center gap-2 mb-4">
          <Link :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Useful Links</h3>
        </div>
        <div class="space-y-2">
          <!-- Dynamic links from API -->
          <a
            v-for="link in usefulLinks"
            :key="link.id"
            :href="link.link"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary group"
          >
            <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent">
              <ExternalLink :size="12" :stroke-width="2" />
            </span>
            <div class="flex-1 min-w-0">
              <span class="group-hover:text-text-primary transition-colors truncate block">{{ link.title }}</span>
              <span v-if="link.description" class="text-[10px] text-text-muted/60 truncate block">{{ link.description }}</span>
            </div>
          </a>

          <!-- Fallback static links if no API links -->
          <template v-if="usefulLinks.length === 0">
            <a
              :href="serverStats.panelUrl || 'https://console.zyphron.cloud'"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary group"
            >
              <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent">
                <Terminal :size="12" :stroke-width="2" />
              </span>
              <span class="group-hover:text-text-primary transition-colors">Pterodactyl Panel</span>
            </a>
            <a
              href="https://discord.gg/zyphron"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm text-text-muted hover:text-text-primary group"
            >
              <span class="w-6 h-6 rounded bg-accent/10 flex items-center justify-center text-accent">
                <MessageSquare :size="12" :stroke-width="2" />
              </span>
              <span class="group-hover:text-text-primary transition-colors">Discord</span>
            </a>
          </template>
        </div>
      </div>
    </div>

    <!-- Servers List -->
    <div v-if="!store.loading && store.servers.length > 0" class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-text-primary uppercase tracking-widest opacity-50">Your Servers</h3>
        <router-link to="/servers" class="text-xs font-bold text-accent hover:underline">View All</router-link>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="(server, index) in store.servers.slice(0, 4)" :key="server.id"
          class="stagger-item card-surface p-5 group cursor-default"
          :style="{ animationDelay: (index * 0.08) + 's' }"
        >

          <div class="flex items-start justify-between mb-4">
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-text-primary group-hover:text-accent transition-colors truncate">{{ server.serverName }}</h4>
                <a v-if="server.identifier" :href="`${serverStats.panelUrl || 'https://console.zyphron.cloud'}/server/${server.identifier}`" target="_blank" class="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors flex-shrink-0">
                  <ExternalLink :size="14" :stroke-width="2" />
                </a>
              </div>
            </div>
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-base border border-border flex-shrink-0">
              <div :class="statusColorClass(server.status)" class="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]"></div>
              <span class="text-[10px] font-bold uppercase tracking-wider" :class="statusTextClass(server.status)">{{ server.status }}</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div class="space-y-1">
              <p class="text-label opacity-40">CPU</p>
              <p class="text-sm font-bold text-text-primary">{{ server.cpuPercent || 0 }}%</p>
            </div>
            <div class="space-y-1 border-x border-border px-4">
              <p class="text-label opacity-40">RAM</p>
              <p class="text-sm font-bold text-text-primary">{{ server.ramMb || 0 }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
            </div>
            <div class="space-y-1 pl-4">
              <p class="text-label opacity-40">Disk</p>
              <p class="text-sm font-bold text-text-primary">{{ server.diskMb || 0 }} <span class="text-[10px] text-text-muted font-medium">MB</span></p>
            </div>
          </div>

          <div class="pt-4 border-t border-border flex items-center justify-between">
            <span class="text-[11px] font-medium text-text-muted">{{ formatDate(server.createdAt) }}</span>
            <div class="flex items-center gap-4">
              <router-link :to="`/servers/${server.id}/renew`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Renew</router-link>
              <router-link :to="`/servers/${server.id}/settings`" class="text-xs font-bold text-text-muted hover:text-accent transition-colors">Settings</router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!store.loading && store.servers.length === 0" class="card-surface py-16 text-center space-y-6">
      <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-text-muted opacity-40">
        <Server :size="32" :stroke-width="1.5" />
      </div>
      <div class="space-y-2">
        <h3 class="text-lg font-bold text-text-primary">No Servers Yet</h3>
        <p class="text-sm text-text-muted max-w-sm mx-auto">You haven't deployed any servers yet. Create your first server to get started.</p>
      </div>
      <router-link to="/services" class="btn-primary inline-flex">Deploy Your First Server</router-link>
    </div>

    <!-- Partner Program & Activity Logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Partner Program -->
      <div class="card-surface p-6 card-hover">
        <div class="flex items-center gap-2 mb-4">
          <Users :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Partner Program</h3>
        </div>
        <p class="text-xs text-text-muted mb-3">Refer friends and earn commission on their purchases.</p>
        <div class="bg-base/50 rounded-lg p-3 border border-border">
          <p class="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Referral System</p>
          <p class="text-sm text-text-muted">Coming soon — referral links will be generated here.</p>
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-text-muted">
          <span>Referred: <strong class="text-text-primary">0</strong></span>
          <span>Commission: <strong class="text-text-primary">10%</strong></span>
        </div>
      </div>

      <!-- Activity Logs -->
      <div class="card-surface p-6 card-hover">
        <div class="flex items-center gap-2 mb-4">
          <ScrollText :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Activity</h3>
        </div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 text-xs">
            <div class="w-1.5 h-1.5 rounded-full bg-accent/50"></div>
            <span class="text-text-muted">No recent activity</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useServersStore } from '../stores/servers'
import { useAuthStore } from '../stores/auth'
import client from '../api/client'
import {
  Plus,
  Server,
  Coins,
  Clock,
  CheckCircle,
  Megaphone,
  Link,
  Terminal,
  MessageSquare,
  ExternalLink,
  Users,
  ScrollText,
} from 'lucide-vue-next'

const store = useServersStore()
const authStore = useAuthStore()

const serverStats = computed(() => store.stats)
const usefulLinks = ref([])

// Animated counter logic
const animatedStats = reactive({
  servers: 0,
  active: 0,
  credits: 0,
})

function animateCounter(key, target) {
  const duration = 800
  const start = animatedStats[key] || 0
  const diff = target - start
  if (diff === 0) return
  const startTime = performance.now()
  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedStats[key] = Math.round(start + diff * eased)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// Count servers expiring within 3 days
const expiringSoonCount = computed(() => {
  const now = new Date()
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return store.servers.filter(s => {
    if (!s.expiresAt) return false
    const expiry = new Date(s.expiresAt)
    const diff = expiry.getTime() - now.getTime()
    return diff > 0 && diff < threeDays
  }).length
})

onMounted(async () => {
  try {
    await Promise.all([store.fetchServers(), store.fetchStats()])
  } catch {}
  // Fetch useful links from API
  try {
    const { data } = await client.get('/useful-links')
    usefulLinks.value = Array.isArray(data) ? data.filter(l => l.position !== 'sidebar' || !l.position) : []
  } catch {
    // Fallback to static links
  }
})

// Animate when data changes
watch(() => store.stats, (newStats) => {
  if (newStats) {
    animateCounter('servers', newStats.total || 0)
    animateCounter('active', newStats.active || 0)
  }
}, { immediate: true })

watch(() => authStore.user, (user) => {
  if (user) {
    animateCounter('credits', user.coins || 0)
  }
}, { immediate: true })

function statusColorClass(status) {
  return {
    active: 'text-emerald-500 bg-emerald-500',
    suspended: 'text-red-500 bg-red-500',
    expired: 'text-yellow-500 bg-yellow-500',
  }[status] || 'text-white/20 bg-white/20'
}

function statusTextClass(status) {
  return {
    active: 'text-emerald-400',
    suspended: 'text-red-400',
    expired: 'text-yellow-400',
  }[status] || 'text-text-muted'
}

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>
