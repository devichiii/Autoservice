import { createRouter, createWebHistory } from "vue-router";
import type { AppRole } from "../entities/auth.types";
import { ADMIN_ROUTE_ROLES, APP_ROUTE_PATHS, toChildPath } from "./navigation.config";
import { useAuthStore } from "../entities/auth.store";
import AdminAnalyticsPage from "../pages/AdminAnalyticsPage.vue";
import AdminBookingsPage from "../pages/AdminBookingsPage.vue";
import AdminUsersPage from "../pages/AdminUsersPage.vue";
import AppLayout from "../widgets/AppLayout.vue";
import BookingsPage from "../pages/BookingsPage.vue";
import CarsPage from "../pages/CarsPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import NotificationsPage from "../pages/NotificationsPage.vue";
import ServicesPage from "../pages/ServicesPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { guestOnly: true }
    },
    {
      path: "/",
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          redirect: { name: "dashboard" }
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.dashboard),
          name: "dashboard",
          component: DashboardPage
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.cars),
          name: "cars",
          component: CarsPage
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.services),
          name: "services",
          component: ServicesPage
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.bookings),
          name: "bookings",
          component: BookingsPage
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.notifications),
          name: "notifications",
          component: NotificationsPage
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.adminBookings),
          name: "admin-bookings",
          component: AdminBookingsPage,
          meta: { requiresRoles: ADMIN_ROUTE_ROLES }
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.adminUsers),
          name: "admin-users",
          component: AdminUsersPage,
          meta: { requiresRoles: ADMIN_ROUTE_ROLES }
        },
        {
          path: toChildPath(APP_ROUTE_PATHS.adminAnalytics),
          name: "admin-analytics",
          component: AdminAnalyticsPage,
          meta: { requiresRoles: ADMIN_ROUTE_ROLES }
        }
      ]
    }
  ]
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  const requiredRoles = to.meta.requiresRoles as AppRole[] | undefined;
  if (authStore.accessToken && !authStore.user) {
    await authStore.hydrate();
  }
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }
  if (requiredRoles?.length) {
    const userRoles = authStore.user?.roles ?? [];
    const isAllowed = requiredRoles.some((role) => userRoles.includes(role));
    if (!isAllowed) {
      return { name: "dashboard" };
    }
  }
  return true;
});

export default router;
