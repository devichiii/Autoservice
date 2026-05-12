<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../entities/auth.store";

const authStore = useAuthStore();
const router = useRouter();

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cars", label: "Cars" },
  { to: "/services", label: "Services" },
  { to: "/bookings", label: "Bookings" }
];

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
            {{ link.label }}
          </router-link>
        </nav>
      </aside>

      <section class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <router-view />
      </section>
    </main>
  </div>
</template>
