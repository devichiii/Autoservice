<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "../entities/auth.store";

const authStore = useAuthStore();

const title = computed(() =>
  authStore.role ? `${authStore.role} dashboard` : "Dashboard"
);
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 px-6 py-4">
      <h1 class="text-xl font-semibold">{{ title }}</h1>
      <p class="text-sm text-slate-400">
        Production layout scaffold for bookings, cars, schedule and analytics.
      </p>
    </header>
    <section class="p-6 grid gap-4 md:grid-cols-3">
      <article class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="font-medium">Bookings</h2>
        <p class="mt-2 text-sm text-slate-400">Status pipeline and queue management</p>
      </article>
      <article class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="font-medium">Schedule</h2>
        <p class="mt-2 text-sm text-slate-400">Slot capacity, blocking, and exceptions</p>
      </article>
      <article class="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 class="font-medium">Service metrics</h2>
        <p class="mt-2 text-sm text-slate-400">Operational analytics for admins</p>
      </article>
    </section>
  </main>
</template>
