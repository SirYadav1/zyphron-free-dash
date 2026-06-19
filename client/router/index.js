import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { guest: true },
  },
  {
    path: '/verify',
    name: 'VerifyPending',
    component: () => import('../views/VerifyPendingView.vue'),
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: () => import('../views/VerifyEmailView.vue'),
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'home', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'servers', name: 'Servers', component: () => import('../views/ServersView.vue') },
      { path: 'servers/create', name: 'CreateServer', component: () => import('../views/CreateServerView.vue') },
      { path: 'servers/:id/settings', name: 'ServerSettings', component: () => import('../views/ServerSettingsView.vue') },
      { path: 'servers/:id/renew', name: 'ServerRenew', component: () => import('../views/ServerRenewView.vue') },
      { path: 'store', name: 'Store', component: () => import('../views/CoinShopView.vue') },
      { path: 'store/:serverId', name: 'StoreUpgrade', component: () => import('../views/StoreView.vue') },
      { path: 'ticket', name: 'Tickets', component: () => import('../views/TicketsView.vue') },
      { path: 'ticket/create', name: 'TicketCreate', component: () => import('../views/TicketCreateView.vue') },
      { path: 'ticket/:id', name: 'TicketShow', component: () => import('../views/TicketShowView.vue') },
      { path: 'profile', name: 'Profile', component: () => import('../views/ProfileView.vue') },
      { path: 'preferences', name: 'Preferences', component: () => import('../views/PreferencesView.vue') },
      { path: 'settings', name: 'Settings', component: () => import('../views/SettingsView.vue') },
      { path: 'afk', name: 'Afk', component: () => import('../views/AfkView.vue') },
      { path: '2fa', name: 'TwoFactor', component: () => import('../views/TwoFactorView.vue') },
      { path: 'transactions', name: 'Transactions', component: () => import('../views/TransactionsView.vue') },
      { path: 'invoices', name: 'Invoices', component: () => import('../views/InvoicesView.vue') },
      { path: 'services', name: 'Services', component: () => import('../views/ServicesView.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      { path: 'overview', name: 'AdminOverview', component: () => import('../views/admin/AdminDashboardView.vue') },
      { path: '', redirect: '/admin/overview' },
      { path: 'users', name: 'AdminUsers', component: () => import('../views/admin/AdminUsersView.vue') },
      { path: 'users/:id', name: 'AdminUserShow', component: () => import('../views/admin/AdminUserShowView.vue') },
      { path: 'users/:id/edit', name: 'AdminUserEdit', component: () => import('../views/admin/AdminUserEditView.vue') },
      { path: 'servers', name: 'AdminServers', component: () => import('../views/admin/AdminServersView.vue') },
      { path: 'servers/:id/edit', name: 'AdminServerEdit', component: () => import('../views/admin/AdminServerEditView.vue') },
      { path: 'services', name: 'AdminServices', component: () => import('../views/admin/AdminProductsView.vue') },
      { path: 'services/create', name: 'AdminServiceCreate', component: () => import('../views/admin/AdminProductCreateView.vue') },
      { path: 'services/:id/edit', name: 'AdminServiceEdit', component: () => import('../views/admin/AdminProductEditView.vue') },
      { path: 'categories', name: 'AdminCategories', component: () => import('../views/admin/AdminCategoriesView.vue') },
      { path: 'categories/create', name: 'AdminCategoryCreate', component: () => import('../views/admin/AdminCategoryCreateView.vue') },
      { path: 'categories/:id/edit', name: 'AdminCategoryEdit', component: () => import('../views/admin/AdminCategoryEditView.vue') },
      { path: 'store', name: 'AdminStore', component: () => import('../views/admin/AdminStoreView.vue') },
      { path: 'store/create', name: 'AdminStoreCreate', component: () => import('../views/admin/AdminStoreCreateView.vue') },
      { path: 'store/:id/edit', name: 'AdminStoreEdit', component: () => import('../views/admin/AdminStoreEditView.vue') },
      { path: 'vouchers', name: 'AdminVouchers', component: () => import('../views/admin/AdminVouchersView.vue') },
      { path: 'vouchers/create', name: 'AdminVoucherCreate', component: () => import('../views/admin/AdminVoucherCreateView.vue') },
      { path: 'vouchers/:id/edit', name: 'AdminVoucherEdit', component: () => import('../views/admin/AdminVoucherEditView.vue') },
      { path: 'vouchers/:id/users', name: 'AdminVoucherUsers', component: () => import('../views/admin/AdminVoucherUsersView.vue') },
      { path: 'partners', name: 'AdminPartners', component: () => import('../views/admin/AdminPartnersView.vue') },
      { path: 'partners/create', name: 'AdminPartnerCreate', component: () => import('../views/admin/AdminPartnerCreateView.vue') },
      { path: 'partners/:id/edit', name: 'AdminPartnerEdit', component: () => import('../views/admin/AdminPartnerEditView.vue') },
      { path: 'partners/:id/users', name: 'AdminPartnerUsers', component: () => import('../views/admin/AdminPartnerUsersView.vue') },
      { path: 'coupons', name: 'AdminCoupons', component: () => import('../views/admin/AdminCouponsView.vue') },
      { path: 'coupons/create', name: 'AdminCouponCreate', component: () => import('../views/admin/AdminCouponCreateView.vue') },
      { path: 'coupons/:id/edit', name: 'AdminCouponEdit', component: () => import('../views/admin/AdminCouponEditView.vue') },
      { path: 'payments', name: 'AdminPayments', component: () => import('../views/admin/AdminPaymentsView.vue') },
      { path: 'invoices', name: 'AdminInvoices', component: () => import('../views/admin/AdminInvoicesView.vue') },
      { path: 'roles', name: 'AdminRoles', component: () => import('../views/admin/AdminRolesView.vue') },
      { path: 'roles/create', name: 'AdminRoleCreate', component: () => import('../views/admin/AdminRoleCreateView.vue') },
      { path: 'roles/:id/edit', name: 'AdminRoleEdit', component: () => import('../views/admin/AdminRoleEditView.vue') },
      { path: 'roles/:id/users', name: 'AdminRoleUsers', component: () => import('../views/admin/AdminRoleUsersView.vue') },
      { path: 'settings', name: 'AdminSettings', component: () => import('../views/admin/AdminSettingsView.vue') },
      { path: 'api', name: 'AdminApi', component: () => import('../views/admin/AdminApiView.vue') },
      { path: 'api/create', name: 'AdminApiCreate', component: () => import('../views/admin/AdminApiCreateView.vue') },
      { path: 'api/:id/edit', name: 'AdminApiEdit', component: () => import('../views/admin/AdminApiEditView.vue') },
      { path: 'ticket', name: 'AdminTickets', component: () => import('../views/admin/AdminTicketsView.vue') },
      { path: 'ticket/:id', name: 'AdminTicketShow', component: () => import('../views/admin/AdminTicketShowView.vue') },
      { path: 'ticket/blacklist', name: 'AdminTicketBlacklist', component: () => import('../views/admin/AdminTicketBlacklistView.vue') },
      { path: 'activitylogs', name: 'AdminActivityLogs', component: () => import('../views/admin/AdminActivityLogsView.vue') },
      { path: 'usefullinks', name: 'AdminUsefulLinks', component: () => import('../views/admin/AdminUsefulLinksView.vue') },
      { path: 'usefullinks/create', name: 'AdminUsefulLinkCreate', component: () => import('../views/admin/AdminUsefulLinkCreateView.vue') },
      { path: 'usefullinks/:id/edit', name: 'AdminUsefulLinkEdit', component: () => import('../views/admin/AdminUsefulLinkEditView.vue') },
      { path: 'email-templates', name: 'AdminEmailTemplates', component: () => import('../views/admin/AdminEmailTemplatesView.vue') },
      { path: 'email-templates/create', name: 'AdminEmailTemplateCreate', component: () => import('../views/admin/AdminEmailTemplateEditView.vue') },
      { path: 'email-templates/:id/edit', name: 'AdminEmailTemplateEdit', component: () => import('../views/admin/AdminEmailTemplateEditView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const token = sessionStorage.getItem('access_token')

  if (to.meta.requiresAuth && !token) {
    return next('/login')
  }

  if (to.meta.guest && token) {
    return next('/home')
  }

  if (to.meta.requiresAuth && token) {
    const authStore = useAuthStore()
    if (!authStore.user) {
      try {
        await authStore.fetchProfile()
      } catch {
        sessionStorage.removeItem('access_token')
        return next('/login')
      }
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return next('/home')
    }
  }

  next()
})

export default router
