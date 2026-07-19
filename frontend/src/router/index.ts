import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login',    component: () => import('@/views/LoginView.vue'),    meta: { public: true } },
  { path: '/register', component: () => import('@/views/RegisterView.vue'), meta: { public: true } },
  {
    path: '/', component: () => import('@/components/layout/AppLayout.vue'),
    children: [
      { path: '',           redirect: '/dashboard' },
      { path: 'dashboard',  component: () => import('@/views/DashboardView.vue') },
      { path: 'invoices',   component: () => import('@/views/InvoicesView.vue') },
      { path: 'invoices/new',     component: () => import('@/views/InvoiceFormView.vue') },
      { path: 'invoices/:id/edit', component: () => import('@/views/InvoiceFormView.vue') },
      { path: 'invoices/:id',     component: () => import('@/views/InvoiceDetailView.vue') },
      { path: 'expenses',  component: () => import('@/views/ExpensesView.vue') },
      { path: 'income',    component: () => import('@/views/IncomeView.vue') },
      { path: 'clients',   component: () => import('@/views/ClientsView.vue') },
      { path: 'gst',       component: () => import('@/views/GSTReportView.vue') },
      { path: 'estimates', component: () => import('@/views/EstimatesView.vue') },
      { path: 'profile',   component: () => import('@/views/ProfileView.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// Auth guard
router.beforeEach((to) => {
  const token = localStorage.getItem('ff_token')
  if (!to.meta.public && !token) return '/login'
  if (to.meta.public && token) return '/dashboard'
})

export default router
