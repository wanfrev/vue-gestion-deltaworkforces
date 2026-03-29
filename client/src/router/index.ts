import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import LoginView from '../views/Login.vue'
import DashboardView from '../views/Dashboard.vue'
import AdminView from '../views/Admin.vue'
import { resolveHomeByRole, ROLES } from '../constants/roles'

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
      meta: { requiresAuth: true, roles: [ROLES.EMPLEADO] },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, roles: [ROLES.ADMIN] },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth === true
  const requiredRoles = Array.isArray(to.meta.roles) ? to.meta.roles : undefined
  const userRole = authStore.user?.rol
  const homeByRole = resolveHomeByRole(userRole)

  if (to.path === '/' && authStore.isAuthenticated) {
    return homeByRole
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return '/'
  }

  if (requiredRoles && (!userRole || !requiredRoles.includes(userRole))) {
    return homeByRole
  }

  return true
})

export default router
