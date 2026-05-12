<script setup lang="ts">
import { useAuthStore } from "../entities/auth.store";

const authStore = useAuthStore();
</script>

<template>
  <section>
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="mt-2 text-sm text-slate-400">
      Authenticated workspace foundation. Signed in as
      <span class="text-slate-200">{{ authStore.user?.email }}</span>.
    </p>
  </section>
</template>
