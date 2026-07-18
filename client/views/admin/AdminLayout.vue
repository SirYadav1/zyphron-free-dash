<template>
  <div class="min-h-screen bg-base bg-grid font-sans flex">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      ]"
    >
      <div class="p-6 border-b border-border">
        <ZyphronLogo size="sm" />
        <p class="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.2em] mt-2">Admin Panel</p>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        <div v-for="group in navGroups" :key="group.title">
          <p class="px-3 mb-2 text-[9px] font-bold text-text-muted/40 uppercase tracking-[0.15em]">{{ group.title }}</p>
          <div class="space-y-0.5">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="nav-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium"
              :class="isActive(item.path)
                ? 'active text-accent border border-accent/20'
                : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'"
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" :size="18" :stroke-width="2" class="shrink-0" />
              <span class="flex-1">{{ item.label }}</span>
              <span v-if="item.badge" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">{{ item.badge }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- User submenu at bottom -->
      <div class="p-4 border-t border-border">
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-all duration-200 group"
          >
            <div class="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
              <User :size="14" :stroke-width="2.5" class="text-accent" />
            </div>
            <div class="flex-1 text-left min-w-0">
              <p class="text-xs font-bold text-text-primary truncate">{{ authStore.user?.username }}</p>
              <p class="text-[10px] text-accent/60 font-semibold uppercase tracking-wider">Administrator</p>
            </div>
            <ChevronUp v-if="showUserMenu" :size="14" class="text-text-muted transition-transform duration-200" />
            <ChevronDown v-else :size="14" class="text-text-muted transition-transform duration-200" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-show="showUserMenu"
            class="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-xl overflow-hidden shadow-2xl z-50"
            style="animation: scaleIn 0.2s ease-out; transform-origin: bottom;"
          >
            <router-link
              to="/home"
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard :size="15" :stroke-width="2" />
              Back to Dashboard
            </router-link>
            <a
              :href="panelUrl"
              target="_blank"
              class="flex items-center gap-3 px-4 py-3 text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
            >
              <Terminal :size="15" :stroke-width="2" />
              Open Panel
            </a>
            <div class="border-t border-border"></div>
            <button
              @click="handleLogout"
              class="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/5 transition-colors"
            >
              <LogOut :size="15" :stroke-width="2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </aside>

    <main class="flex-1 overflow-auto">
      <div class="p-4 lg:p-8 animate-fade-in">
        <!-- Mobile hamburger button -->
        <button
          @click="sidebarOpen = true"
          class="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-surface/90 backdrop-blur-sm border border-border hover:bg-white/5 transition-all"
        >
          <Menu :size="20" :stroke-width="2" class="text-text-primary" />
        </button>
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import ZyphronLogo from '../../components/ZyphronLogo.vue'
import {
  Home,
  Settings,
  Ticket,
  ShieldBan,
  ShieldCheck,
  Code,
  Users,
  Server,
  LayoutGrid,
  Package,
  ShoppingCart,
  Tag,
  UsersRound,
  BadgePercent,
  Coins,
  Link,
  Mail,
  CreditCard,
  FileText,
  ScrollText,
  ChevronDown,
  ChevronUp,
  User,
  Terminal,
  LogOut,
  LayoutDashboard,
  Menu,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)
const sidebarOpen = ref(false)

const panelUrl = computed(() => {
  return import.meta.env.VITE_PTERODACTYL_PANEL_URL || 'https://your-panel.com'
})

const navGroups = [
  {
    title: 'General',
    items: [
      { path: '/admin/overview', label: 'Overview', icon: Home },
      { path: '/admin/settings', label: 'Settings', icon: Settings },
      { path: '/admin/ticket', label: 'Ticket List', icon: Ticket },
      { path: '/admin/ticket/blacklist', label: 'Ticket Blacklist', icon: ShieldBan },
      { path: '/admin/roles', label: 'Role Management', icon: ShieldCheck },
      { path: '/admin/api', label: 'Application API', icon: Code },
    ]
  },
  {
    title: 'Management',
    items: [
      { path: '/admin/users', label: 'Users', icon: Users },
      { path: '/admin/servers', label: 'Servers', icon: Server },
      { path: '/admin/categories', label: 'Categories', icon: LayoutGrid },
      { path: '/admin/services', label: 'Services', icon: Package },
      { path: '/admin/store', label: 'Store', icon: ShoppingCart },
      { path: '/admin/vouchers', label: 'Vouchers', icon: Tag },
      { path: '/admin/partners', label: 'Partners', icon: UsersRound },
      { path: '/admin/coupons', label: 'Coupons', icon: BadgePercent },
      { path: '/admin/coin-orders', label: 'Coin Orders', icon: Coins },
    ]
  },
  {
    title: 'Other',
    items: [
      { path: '/admin/usefullinks', label: 'Useful Links', icon: Link },
      { path: '/admin/email-templates', label: 'Email Templates', icon: Mail },
    ]
  },
  {
    title: 'Logs',
    items: [
      { path: '/admin/payments', label: 'Payments', icon: CreditCard, badge: '0' },
      { path: '/admin/invoices', label: 'Invoices', icon: FileText },
      { path: '/admin/activitylogs', label: 'Activity Logs', icon: ScrollText },
    ]
  },
]

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/')
}

function handleLogout() {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>
