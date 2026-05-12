import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../entities/auth.store";
import AppLayout from "../widgets/AppLayout.vue";
import BookingsPage from "../pages/BookingsPage.vue";
import CarsPage from "../pages/CarsPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";
import LoginPage from "../pages/LoginPage.vue";
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
          path: "dashboard",
          name: "dashboard",
          component: DashboardPage
        },
        {
          path: "cars",
          name: "cars",
          component: CarsPage
        },
        {
          path: "services",
          name: "services",
          component: ServicesPage
        },
        {
          path: "bookings",
          name: "bookings",
          component: BookingsPage
        }
      ]
    }
  ]
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: "login" };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }
  return true;
});

export default router;
