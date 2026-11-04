<template>
  <div class="min-h-screen bg-base flex overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'sidebar-panel fixed inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto',
        collapsed ? 'lg:w-[68px]' : 'lg:w-60',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      ]"
    >
      <div class="h-16 flex items-center px-5 shrink-0" :class="collapsed ? 'lg:justify-center lg:px-2 lg:[&>div>span]:hidden' : ''">
        <ZyphronLogo size="sm" />
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin" :class="collapsed ? 'lg:px-2' : ''">
        <div v-for="section in navSections" :key="section.title">
          <p class="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-text-muted/50" :class="collapsed ? 'lg:hidden' : ''">
            {{ section.title }}
          </p>
          <div class="space-y-0.5">
            <router-link
              v-for="item in section.items"
              :key="item.path"
              :to="item.path"
              :title="item.label"
              @click="sidebarOpen = false"
              class="nav-item group flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[13px] font-medium"
              :class="[
                collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : '',
                isActive(item.path)
                  ? 'nav-active'
                  : 'text-text-muted border-transparent hover:text-text-primary hover:bg-white/[0.04] hover:border-border'
              ]"
            >
              <span class="w-4 h-4 flex items-center justify-center shrink-0 [&>svg]:w-4 [&>svg]:h-4" v-html="item.icon"></span>
              <span class="flex-1 truncate" :class="collapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
              <span v-if="item.badge" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" :class="[isActive(item.path) ? 'nav-badge-active' : 'bg-accent/15 text-accent', collapsed ? 'lg:hidden' : '']">
                {{ item.badge }}
              </span>
            </router-link>
          </div>
        </div>

        <div v-if="!linksLoading && usefulLinks.length > 0">
          <p class="px-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-text-muted/50" :class="collapsed ? 'lg:hidden' : ''">Links</p>
          <div class="space-y-0.5">
            <a
              v-for="link in usefulLinks"
              :key="link.id"
              :href="link.link"
              target="_blank"
              rel="noopener"
              :title="link.title"
              @click="sidebarOpen = false"
              class="nav-item group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-transparent text-[13px] font-medium text-text-muted hover:text-text-primary hover:bg-white/[0.04] hover:border-border"
              :class="collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : ''"
            >
              <ExternalLink :size="15" :stroke-width="2" class="shrink-0" />
              <span class="flex-1 truncate" :class="collapsed ? 'lg:hidden' : ''">{{ link.title }}</span>
            </a>
          </div>
        </div>
      </nav>

      <div class="p-3">
        <div class="flex items-center justify-between px-3 py-2.5 rounded-lg bg-base/50 border border-border" :class="collapsed ? 'lg:justify-center' : ''">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-text-muted" :class="collapsed ? 'lg:hidden' : ''">Balance</span>
          <span class="flex items-center gap-1.5 text-sm font-semibold text-text-primary tabular-nums">
            <Coins :size="14" class="text-accent" />
            {{ authStore.user?.coins || 0 }}
          </span>
        </div>
      </div>
    </aside>

    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"></div>

    <div class="flex-1 flex flex-col min-w-0 h-screen">
      <header class="h-16 bg-surface/70 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <button @click="toggleCollapse" :title="collapsed ? 'Expand menu' : 'Collapse menu'" class="hidden lg:flex p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors">
            <PanelLeftClose v-if="!collapsed" :size="18" :stroke-width="2" />
            <PanelLeftOpen v-else :size="18" :stroke-width="2" />
          </button>
          <button @click="sidebarOpen = true" aria-label="Toggle menu" class="p-2 -ml-2 text-text-muted hover:text-text-primary lg:hidden transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <p class="text-sm font-semibold text-text-primary truncate">{{ pageTitle }}</p>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-border">
            <Coins :size="13" class="text-accent" />
            <span class="text-xs font-semibold text-text-primary tabular-nums">{{ authStore.user?.coins || 0 }}</span>
          </div>

          <div class="w-px h-5 bg-border"></div>

          <div class="flex items-center gap-2.5">
            <div class="text-right hidden sm:block leading-tight">
              <p class="text-xs font-semibold text-text-primary">{{ authStore.user?.username }}</p>
              <p class="text-[10px] text-text-muted">Member</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold overflow-hidden">
              <img v-if="authStore.user?.profilePhoto" :src="authStore.user.profilePhoto" alt="Profile" class="w-full h-full object-cover" />
              <span v-else>{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
            </div>
            <button @click="handleLogout" aria-label="Logout" class="p-1.5 text-text-muted hover:text-red-400 transition-colors" title="Logout">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto bg-base">
        <div class="app-container py-8">
          <router-view />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useAfkStore } from '../stores/afk'
import ZyphronLogo from '../components/ZyphronLogo.vue'
import client from '../api/client'
import { ExternalLink, Coins, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const afkStore = useAfkStore()
const sidebarOpen = ref(false)
const usefulLinks = ref([])
const linksLoading = ref(true)
const collapsed = ref(localStorage.getItem('zyphron_sidebar') === '1')

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('zyphron_sidebar', collapsed.value ? '1' : '0')
}

const pageTitle = computed(() => {
  const segment = route.path.split('/').filter(Boolean).pop() || 'home'
  return segment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
})

onMounted(async () => {
  try {
    await authStore.fetchProfile()
  } catch {
    router.push('/login')
  }

  // fetch useful links from API for sidebar
  try {
    const { data } = await client.get('/useful-links')
    usefulLinks.value = Array.isArray(data) ? data.filter(l => l.position === 'sidebar' || !l.position) : []
  } catch {
    usefulLinks.value = []
  } finally {
    linksLoading.value = false
  }

  // session management: pause AFK on tab hide, resume on tab show
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // logout when user navigates away from site entirely
  window.addEventListener('beforeunload', handleBeforeUnload)
})

function handleVisibilityChange() {
  if (document.hidden) {
    afkStore.pauseTick()
  } else {
    afkStore.resumeTick()
  }
}

function handleBeforeUnload() {
  if (afkStore.sessionId && afkStore.tabId) {
    const token = sessionStorage.getItem('access_token')
    if (token) {
      navigator.sendBeacon('/api/afk/stop', new Blob([JSON.stringify({
        sessionId: afkStore.sessionId,
        tabId: afkStore.tabId,
      })], { type: 'application/json' }))
    }
    afkStore.stopHeartbeat()
    afkStore.stopTick()
  }
}

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const navSections = computed(() => {
  const sections = [
    {
      title: t('nav.general'),
      items: [
        {
          path: '/home',
          label: t('nav.dashboard'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>'
        },
        {
          path: '/services',
          label: t('nav.services'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>'
        },
        {
          path: '/servers',
          label: t('nav.servers'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"/></svg>'
        },
        {
          path: '/ticket',
          label: t('nav.tickets'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>'
        },
      ]
    },
    {
      title: t('nav.earning'),
      items: [
        {
          path: '/afk',
          label: t('nav.earnCredits'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>'
        },
        {
          path: '/store',
          label: t('nav.buyCoins'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        },
        {
          path: '/store/pending',
          label: t('nav.pendingPayments'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        },
        {
          path: '/store/successful',
          label: t('nav.successfulPayments'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
        },
        {
          path: '/transactions',
          label: t('nav.transactions'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>'
        },
        {
          path: '/invoices',
          label: t('nav.invoices'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>'
        }
      ]
    },
    {
      title: t('nav.account'),
      items: [
        {
          path: '/profile',
          label: t('nav.profile'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
        },
        {
          path: '/preferences',
          label: t('nav.preferences'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>'
        },
        {
          path: '/settings',
          label: t('nav.settings'),
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>'
        },
        {
          path: '/2fa',
          label: 'Two-Factor Auth',
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>'
        },
      ]
    }
  ]

  if (authStore.isAdmin) {
    sections.push({
      title: 'Administration',
      items: [
        {
          path: '/admin/overview',
          label: 'Admin Panel',
          icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>'
        },
      ]
    })
  }

  return sections
})

function isActive(path) {
  const p = route.path
  if (p === path) return true
  if (!p.startsWith(path + '/')) return false
  // deeper nested route wins: /store/successful must not also highlight /store
  const all = navSections.value.flatMap(s => s.items.map(i => i.path))
  return !all.some(o => o !== path && o.length > path.length && (p === o || p.startsWith(o + '/')))
}

function handleLogout() {
  afkStore.stopSession()
  authStore.logout()
  router.push('/login')
}
</script>
