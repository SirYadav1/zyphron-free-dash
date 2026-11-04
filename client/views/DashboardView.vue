<template>
  <div class="space-y-8">
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

    <!-- Stats Strip -->
    <div class="card-surface p-5 card-hover">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-y-5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Server :size="20" :stroke-width="2" />
          </div>
          <div class="min-w-0">
            <p class="text-label">Total Servers</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ animatedStats.servers }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:border-l lg:border-border lg:pl-6">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle :size="20" :stroke-width="2" />
          </div>
          <div class="min-w-0">
            <p class="text-label">Active</p>
            <p class="text-2xl font-bold text-emerald-500 tabular-nums">{{ animatedStats.active }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:border-l lg:border-border lg:pl-6">
          <div class="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-600 shrink-0">
            <Clock :size="20" :stroke-width="2" />
          </div>
          <div class="min-w-0">
            <p class="text-label">Expiring Soon</p>
            <p class="text-2xl font-bold text-yellow-600 tabular-nums">{{ expiringSoonCount }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 lg:border-l lg:border-border lg:pl-6">
          <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
            <Coins :size="20" :stroke-width="2" />
          </div>
          <div class="min-w-0">
            <p class="text-label">Credits</p>
            <p class="text-2xl font-bold text-text-primary tabular-nums">{{ animatedStats.credits }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeleton loading -->
    <div v-if="store.loading" class="space-y-8" aria-busy="true" aria-live="polite">
      <div class="card-surface p-5">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-y-5">
          <div v-for="i in 4" :key="i" class="flex items-center gap-3" :class="i > 1 ? 'lg:border-l lg:border-border lg:pl-6' : ''">
            <div class="skeleton w-10 h-10 !rounded-lg shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="skeleton h-3 w-16"></div>
              <div class="skeleton h-6 w-12"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card-surface p-6 lg:col-span-2 space-y-3">
          <div class="skeleton h-4 w-32"></div>
          <div class="skeleton h-3 w-full"></div>
          <div class="skeleton h-3 w-4/5"></div>
        </div>
        <div class="card-surface p-6 space-y-3">
          <div class="skeleton h-4 w-28"></div>
          <div class="skeleton h-9 w-full"></div>
          <div class="skeleton h-9 w-full"></div>
          <div class="skeleton h-9 w-3/4"></div>
        </div>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- MOTD Card -->
      <div v-if="motdEnabled && motdMessage" class="card-surface p-6 lg:col-span-2 card-hover border-accent/20 bg-accent/5">
        <div class="flex items-center gap-2 mb-4">
          <Megaphone :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-accent uppercase tracking-wider">Message of the Day</h3>
        </div>
        <p class="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">{{ motdMessage }}</p>
      </div>

      <!-- Useful Links from API -->
      <div class="card-surface p-6 card-hover">
        <div class="flex items-center gap-2 mb-4">
          <Link :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Useful Links</h3>
        </div>
        <div class="space-y-2">
          <!-- Dynamic links from API -->
          <template v-if="!linksLoading">
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
          </template>

          <!-- Fallback static links if no API links -->
          <template v-if="!linksLoading && usefulLinks.length === 0">
            <a
              :href="serverStats.panelUrl || 'https://your-panel.com'"
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

    <!-- Coin Flow Sparkline (last 14 days) -->
    <div v-if="!coinFlowLoading" class="card-surface p-6 card-hover">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div class="flex items-center gap-2">
          <TrendingUp :size="16" :stroke-width="2" class="text-accent" />
          <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Coin Flow — Last 14 Days</h3>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Net</span>
          <span class="text-lg font-bold tabular-nums" :class="net14 >= 0 ? 'text-emerald-500' : 'text-red-500'">
            {{ net14 >= 0 ? '+' : '' }}{{ net14.toLocaleString('en-IN') }}
          </span>
        </div>
      </div>

      <svg v-if="sparkPath" viewBox="0 0 700 160" preserveAspectRatio="none" class="w-full h-36" role="img" aria-label="Coin flow chart for the last 14 days">
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#2563eb" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
          </linearGradient>
        </defs>
        <!-- zero baseline -->
        <line
          x1="0"
          :y1="sparkPath.zeroY"
          x2="700"
          :y2="sparkPath.zeroY"
          stroke="rgba(100,116,139,0.35)"
          stroke-width="1"
          stroke-dasharray="4 4"
        />
        <path :d="sparkPath.area" fill="url(#sparkFill)" />
        <path :d="sparkPath.line" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      </svg>

      <!-- day labels -->
      <div v-if="sparkPath" class="flex justify-between mt-2 px-0.5">
        <span class="text-[9px] font-semibold text-text-muted/60 uppercase">{{ dayLabel(coinFlow[0]?.date) }}</span>
        <span class="text-[9px] font-semibold text-text-muted/60 uppercase">Today</span>
      </div>

      <div v-else class="py-10 text-center">
        <p class="text-xs text-text-muted">No coin activity in the last 14 days. Earn coins from AFK, vouchers, and daily logins.</p>
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
                <a v-if="server.identifier" :href="`${serverStats.panelUrl || 'https://your-panel.com'}/server/${server.identifier}`" target="_blank" class="p-1 rounded bg-white/5 hover:bg-white/10 text-text-muted hover:text-accent transition-colors flex-shrink-0">
                  <ExternalLink :size="14" :stroke-width="2" />
                </a>
              </div>
            </div>
            <div class="flex items-center gap-2 px-2.5 py-1 rounded-full bg-base border border-border flex-shrink-0">
              <div :class="statusColorClass(server.status)" class="w-1.5 h-1.5 rounded-full"></div>
              <span class="text-[10px] font-bold uppercase tracking-wider" :class="statusTextClass(server.status)">{{ server.status }}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
            <span class="text-[11px] font-medium text-text-muted">{{ formatDate(server.created_at || server.createdAt) }}</span>
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

      <!-- Activity Logs (real transactions) -->
      <div class="card-surface p-6 card-hover">
        <div class="flex items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <ScrollText :size="16" :stroke-width="2" class="text-accent" />
            <h3 class="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Activity</h3>
          </div>
          <router-link v-if="recentTxs.length > 0" to="/transactions" class="text-[11px] font-bold text-accent hover:underline">View all</router-link>
        </div>
        <div v-if="recentTxs.length > 0" class="space-y-1">
          <div v-for="tx in recentTxs" :key="tx.id" class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors">
            <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" :class="txIconClass(tx)">
              <component :is="txIcon(tx)" :size="14" :stroke-width="2" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-text-primary truncate">{{ tx.description || txLabel(tx.type) }}</p>
              <p class="text-[10px] text-text-muted/70">{{ formatDate(tx.createdAt) }}</p>
            </div>
            <span class="text-xs font-bold tabular-nums shrink-0" :class="(tx.amount || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'">
              {{ (tx.amount || 0) >= 0 ? '+' : '' }}{{ (tx.amount || 0).toLocaleString('en-IN') }}
            </span>
          </div>
        </div>
        <div v-else class="py-8 text-center">
          <p class="text-xs text-text-muted">No recent activity yet. Server actions and coin changes will show up here.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
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
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Gift,
} from 'lucide-vue-next'

const store = useServersStore()
const authStore = useAuthStore()

const serverStats = computed(() => store.stats)
const usefulLinks = ref([])
const linksLoading = ref(true)
const motdMessage = ref('')
const motdEnabled = ref(false)

// coin flow widget
const recentTxs = ref([])
const coinFlow = ref([])
const coinFlowLoading = ref(true)

async function loadCoinData() {
  try {
    const { data } = await client.get('/transactions')
    const txs = Array.isArray(data) ? data : []
    recentTxs.value = txs.slice(0, 6)

    // bucket the last 14 days by calendar day, summing signed amounts
    const days = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(d.toISOString().slice(0, 10))
    }
    const byDay = Object.fromEntries(days.map((d) => [d, 0]))
    for (const tx of txs) {
      const key = (tx.createdAt || '').slice(0, 10)
      if (key in byDay) byDay[key] += Number(tx.amount) || 0
    }
    coinFlow.value = days.map((d) => ({ date: d, net: byDay[d] }))
  } catch {
    // widget stays empty silently — dashboard must not break on API error
  } finally {
    coinFlowLoading.value = false
  }
}

const net14 = computed(() => coinFlow.value.reduce((s, d) => s + d.net, 0))

// pure-SVG sparkline: line + area path over a 700x160 box
const sparkPath = computed(() => {
  if (!coinFlow.value.length) return null
  const vals = coinFlow.value.map((d) => d.net)
  if (vals.every((v) => v === 0)) return null
  const max = Math.max(...vals, 0)
  const min = Math.min(...vals, 0)
  const range = max - min || 1
  const W = 700
  const H = 160
  const PAD = 10
  const pts = vals.map((v, i) => {
    const x = PAD + (i * (W - PAD * 2)) / (vals.length - 1 || 1)
    const y = PAD + (1 - (v - min) / range) * (H - PAD * 2)
    return [x, y]
  })
  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(1)},${H} Z`
  const zeroY = PAD + (1 - (0 - min) / range) * (H - PAD * 2)
  return { line, area, zeroY }
})

function dayLabel(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// transaction type → display label
function txLabel(type) {
  const map = {
    earn: 'AFK earning',
    daily_bonus: 'Daily login bonus',
    discord_link: 'Discord link bonus',
    voucher_redeem: 'Voucher redeemed',
    server_create: 'Server deployed',
    renewal: 'Server renewed',
    store_purchase: 'Store purchase',
    coin_order: 'Coin order approved',
  }
  return map[type] || (type || 'Transaction').replace(/_/g, ' ')
}

// transaction type → icon chip classes (blue/emerald earn, red spend)
function txIconClass(tx) {
  const earnTypes = ['earn', 'daily_bonus', 'discord_link', 'voucher_redeem', 'coin_order', 'admin_grant']
  if (earnTypes.includes(tx.type)) return 'bg-emerald-500/10 text-emerald-500'
  if ((tx.amount || 0) >= 0) return 'bg-emerald-500/10 text-emerald-500'
  return 'bg-red-500/10 text-red-500'
}

function txIcon(tx) {
  if (tx.type === 'server_create' || tx.type === 'renewal') return Server
  if (tx.type === 'store_purchase') return ShoppingBag
  if (tx.type === 'daily_bonus' || tx.type === 'voucher_redeem') return Gift
  if ((tx.amount || 0) < 0) return TrendingDown
  return Coins
}

// animated counter logic
const animatedStats = reactive({
  servers: 0,
  active: 0,
  credits: 0,
})

let rafId = null

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
    if (progress < 1) {
      rafId = requestAnimationFrame(step)
    }
  }
  rafId = requestAnimationFrame(step)
}

// count servers expiring within 3 days
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
  // fire all the fetches at once
  const fetches = [
    store.fetchServers().catch(() => {}),
    store.fetchStats().catch(() => {}),
    loadCoinData(),
    client.get('/useful-links').then(({ data }) => {
      usefulLinks.value = Array.isArray(data) ? data.filter(l => l.position !== 'sidebar' || !l.position) : []
    }).catch(() => {}),
    client.get('/admin/settings').then(({ data }) => {
      if (data.motd_message) motdMessage.value = data.motd_message
      if (data.motd_enabled) motdEnabled.value = data.motd_enabled === 'true'
    }).catch(() => {}),
  ]
  await Promise.allSettled(fetches)
  linksLoading.value = false
})

onUnmounted(() => {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})

// animate when data changes
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
  }[status] || 'text-text-muted bg-text-muted/40'
}

function statusTextClass(status) {
  return {
    active: 'text-emerald-400',
    suspended: 'text-red-400',
    expired: 'text-yellow-400',
  }[status] || 'text-text-muted'
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
