import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import LoginView from '../views/Login.vue'
import DashboardView from '../views/Dashboard.vue'
import AdminView from '../views/Admin.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, role: 'admin' },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth === true
  const requiredRole = typeof to.meta.role === 'string' ? to.meta.role : undefined

  if (to.path === '/' && authStore.isAuthenticated) {
    return '/dashboard'
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }

  if (requiredRole && authStore.user?.rol !== requiredRole) {
    return '/dashboard'
  }

  return true
})

export default router
