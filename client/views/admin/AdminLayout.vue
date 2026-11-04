<template>
  <div class="min-h-screen bg-base admin-bg font-sans flex">
    <!-- Mobile overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'sidebar-panel fixed inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 lg:static lg:inset-auto',
        collapsed ? 'lg:w-[68px]' : 'lg:w-60',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      ]"
    >
      <div class="px-5 py-4 shrink-0" :class="collapsed ? 'lg:px-2 lg:[&>div>span]:hidden' : ''">
        <div class="flex items-center justify-between" :class="collapsed ? 'lg:flex-col lg:gap-2' : ''">
          <ZyphronLogo size="sm" />
          <button @click="toggleCollapse" :title="collapsed ? 'Expand menu' : 'Collapse menu'" class="hidden lg:flex p-1.5 rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <PanelLeftClose v-if="!collapsed" :size="16" :stroke-width="2" />
            <PanelLeftOpen v-else :size="16" :stroke-width="2" />
          </button>
        </div>
        <p class="text-[10px] font-semibold text-accent/70 uppercase tracking-[0.2em] mt-1.5" :class="collapsed ? 'lg:hidden' : ''">Admin Panel</p>
      </div>

      <nav class="flex-1 px-3 py-4 space-y-6 overflow-y-auto scrollbar-thin" :class="collapsed ? 'lg:px-2' : ''">
        <div v-for="group in navGroups" :key="group.title">
          <p class="px-3 mb-2 text-[9px] font-semibold text-text-muted/50 uppercase tracking-[0.18em]">{{ group.title }}</p>
          <div class="space-y-0.5">
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              :title="item.label"
              class="nav-item flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[13px] font-medium"
              :class="[
                collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : '',
                isActive(item.path)
                  ? 'nav-active'
                  : 'text-text-muted border-transparent hover:text-text-primary hover:bg-white/[0.04] hover:border-border'
              ]"
              @click="sidebarOpen = false"
            >
              <component :is="item.icon" :size="16" :stroke-width="2" class="shrink-0" />
              <span class="flex-1" :class="collapsed ? 'lg:hidden' : ''">{{ item.label }}</span>
              <span v-if="item.badge" class="text-[10px] font-bold px-1.5 py-0.5 rounded-full" :class="[isActive(item.path) ? 'nav-badge-active' : 'bg-accent/20 text-accent', collapsed ? 'lg:hidden' : '']">{{ item.badge }}</span>
            </router-link>
          </div>
        </div>
      </nav>

      <!-- User submenu at bottom -->
      <div class="p-3">
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-transparent hover:border-border hover:bg-white/[0.04] transition-all duration-200 group"
            :class="collapsed ? 'lg:justify-center lg:px-2 lg:gap-0' : ''"
          >
            <div class="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
              <User :size="14" :stroke-width="2.5" class="text-accent" />
            </div>
            <div class="flex-1 text-left min-w-0" :class="collapsed ? 'lg:hidden' : ''">
              <p class="text-xs font-bold text-text-primary truncate">{{ authStore.user?.username }}</p>
              <p class="text-[10px] text-accent/60 font-semibold uppercase tracking-wider">Administrator</p>
            </div>
            <ChevronUp v-if="showUserMenu" :size="14" class="text-text-muted transition-transform duration-200" :class="collapsed ? 'lg:hidden' : ''" />
            <ChevronDown v-else :size="14" class="text-text-muted transition-transform duration-200" :class="collapsed ? 'lg:hidden' : ''" />
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
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)
const sidebarOpen = ref(false)
const collapsed = ref(localStorage.getItem('zyphron_sidebar') === '1')

function toggleCollapse() {
  collapsed.value = !collapsed.value
  localStorage.setItem('zyphron_sidebar', collapsed.value ? '1' : '0')
}

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
  const p = route.path
  if (p === path) return true
  if (!p.startsWith(path + '/')) return false
  // deeper nested route wins: /admin/ticket/blacklist must not also highlight /admin/ticket
  const all = navGroups.flatMap(g => g.items.map(i => i.path))
  return !all.some(o => o !== path && o.length > path.length && (p === o || p.startsWith(o + '/')))
}

function handleLogout() {
  authStore.logout()
  showUserMenu.value = false
  router.push('/login')
}
</script>
