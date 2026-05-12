<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { APP_ROUTE_PATHS, SIDEBAR_NAV_LINKS, type SidebarNavLink } from "../app/navigation.config";
import { useAuthStore } from "../entities/auth.store";
import { useNotificationsStore } from "../entities/notifications.store";

const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const router = useRouter();

const links = computed(() => {
  const userRoles = authStore.user?.roles ?? [];
  return SIDEBAR_NAV_LINKS.filter((link: SidebarNavLink) =>
    !link.requiresRoles || link.requiresRoles.some((role) => userRoles.includes(role))
  );
});

const unreadCount = computed(() => notificationsStore.unreadCount);

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await notificationsStore.fetchNotifications();
  }
});

async function logout() {
  await authStore.logout();
  router.push({ name: "login" });
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-900/80">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div>
          <p class="text-sm text-slate-400">AutoService Platform</p>
          <p class="text-xs text-slate-500">{{ authStore.user?.email }}</p>
        </div>
        <button
          class="rounded-md border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
          @click="logout"
        >
          Logout
        </button>
      </div>
    </header>

    <main class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-6 md:grid-cols-[220px,1fr]">
      <aside class="rounded-xl border border-slate-800 bg-slate-900 p-3">
        <nav class="flex flex-col gap-2">
          <router-link
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
            active-class="bg-indigo-600 text-white hover:bg-indigo-600"
          >
            <span class="flex items-center justify-between gap-2">
              <span>{{ link.label }}</span>
              <span
                v-if="link.to === APP_ROUTE_PATHS.notifications && unreadCount > 0"
                class="rounded-full border border-amber-700 px-1.5 py-0.5 text-[10px] text-amber-300"
              >
                {{ unreadCount }}
              </span>
            </span>
          </router-link>
        </nav>
      </aside>

      <section class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <router-view />
      </section>
    </main>
  </div>
</template>
