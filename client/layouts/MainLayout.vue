<template>
  <div class="min-h-screen bg-base flex overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      ]"
    >
      <!-- Sidebar Logo -->
      <div class="h-16 flex items-center px-6 border-b border-border shrink-0">
        <ZyphronLogo size="sm" />
      </div>
      <div class="h-px bg-gradient-to-r from-accent/20 via-accent/5 to-transparent"></div>

      <!-- Sidebar Content -->
      <nav class="flex-1 overflow-y-auto p-4 space-y-5 mt-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div 
          v-for="section in navSections" 
          :key="section.title"
          :class="[
            'py-2 px-1 rounded-xl transition-all',
            section.title === 'Earning' 
              ? 'bg-gradient-to-b from-accent/[0.04] to-transparent border border-accent/10'
              : ''
          ]"
        >
          <!-- Section Header with Gradient Divider -->
          <div class="flex items-center gap-3 px-2 mb-3">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            <span 
              :class="[
                'text-[9px] font-bold uppercase tracking-[0.2em]',
                section.title === 'Earning' ? 'text-accent/40' : 'text-text-muted/40'
              ]"
            >{{ section.title }}</span>
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>

          <div class="space-y-0.5">
            <router-link
              v-for="item in section.items"
              :key="item.path"
              :to="item.path"
              @click="sidebarOpen = false"
              :class="[
                'nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative',
                isActive(item.path)
                  ? 'bg-gradient-to-r from-accent/15 to-accent/5 text-accent'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.04]'
              ]"
            >
              <!-- Active indicator bar -->
              <div 
                v-if="isActive(item.path)" 
                class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"
              ></div>
              
              <!-- Icon with subtle background -->
              <span 
                :class="[
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 [&>svg]:w-4 [&>svg]:h-4',
                  isActive(item.path) ? 'bg-accent/15' : 'bg-white/[0.03] group-hover:bg-white/[0.06]'
                ]" 
                v-html="item.icon"
              ></span>
              
              <span class="flex-1">{{ item.label }}</span>
              
              <span 
                v-if="item.badge" 
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent"
              >{{ item.badge }}</span>
            </router-link>
          </div>
        </div>

        <!-- Useful Links Section -->
        <div v-if="!linksLoading && usefulLinks.length > 0" class="py-2 px-1 rounded-xl">
          <div class="flex items-center gap-3 px-2 mb-3">
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
            <span class="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted/40">Quick Links</span>
            <div class="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>
          <div class="space-y-0.5">
            <a
              v-for="link in usefulLinks"
              :key="link.id"
              :href="link.link"
              target="_blank"
              rel="noopener"
              @click="sidebarOpen = false"
              class="nav-item group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative text-text-muted hover:text-text-primary hover:bg-white/[0.04]"
            >
              <span class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 bg-white/[0.03] group-hover:bg-white/[0.06]">
                <ExternalLink :size="16" :stroke-width="2" />
              </span>
              <span class="flex-1 truncate">{{ link.title }}</span>
            </a>
          </div>
        </div>
      </nav>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-border">
        <div class="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-4 border border-accent/15">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Coins :size="20" class="text-accent" />
            </div>
            <div>
              <p class="text-[10px] font-bold text-accent/60 uppercase tracking-widest">Balance</p>
              <p class="text-lg font-bold text-accent tabular-nums">{{ authStore.user?.coins || 0 }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Mobile Overlay -->
    <div v-if="sidebarOpen" @click="sidebarOpen = false" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"></div>

    <!-- Main View -->
    <div class="flex-1 flex flex-col min-w-0 h-screen">
      <!-- Top Navigation Bar -->
      <header class="h-14 lg:h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div class="flex items-center gap-4 flex-1">
          <button @click="sidebarOpen = true" class="p-2 -ml-2 text-text-muted hover:text-text-primary lg:hidden transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          
          <!-- Search Bar -->
          <div class="max-w-md w-full relative group hidden md:block">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none group-focus-within:text-accent transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Search resources..." 
              class="w-full bg-base/50 border border-border rounded-md py-1.5 pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/30 transition-all"
            >
          </div>
        </div>

        <!-- Top Nav Actions -->
        <div class="flex items-center gap-4">
          <!-- Credits Display -->
          <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-accent/5 border border-accent/10">
            <Coins :size="14" class="text-accent" />
            <span class="text-xs font-bold text-accent">{{ authStore.user?.coins || 0 }}</span>
          </div>

          <div class="w-px h-6 bg-border mx-2"></div>

          <!-- User Profile Dropdown -->
          <div class="flex items-center gap-3 pl-2">
            <div class="text-right hidden sm:block">
              <p class="text-xs font-semibold text-text-primary leading-none">{{ authStore.user?.username }}</p>
              <p class="text-[10px] font-medium text-text-muted mt-1">{{ authStore.user?.email?.split('@')[0] }}</p>
            </div>
            <div class="w-8 h-8 rounded-full bg-accent/20 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold ring-2 ring-surface overflow-hidden">
              <img v-if="authStore.user?.profilePhoto" :src="authStore.user.profilePhoto" alt="Profile" class="w-full h-full object-cover" />
              <span v-else>{{ authStore.user?.username?.charAt(0).toUpperCase() }}</span>
            </div>
            <button @click="handleLogout" class="p-1.5 text-text-muted hover:text-red-400 transition-colors" title="Logout">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto bg-base">
        <div class="app-container py-10">
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
import { ExternalLink, Coins } from 'lucide-vue-next'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const afkStore = useAfkStore()
const sidebarOpen = ref(false)
const usefulLinks = ref([])
const linksLoading = ref(true)

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
  return route.path === path || route.path.startsWith(path + '/')
}

function handleLogout() {
  afkStore.stopSession()
  authStore.logout()
  router.push('/login')
}
</script>
