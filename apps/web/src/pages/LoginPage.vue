<script setup lang="ts">
import { useRouter } from "vue-router";
import { useAuthStore } from "../entities/auth.store";

const authStore = useAuthStore();
const router = useRouter();

function loginAsDemoAdmin() {
  authStore.setSession("demo-token", "ADMIN");
  router.push({ name: "dashboard" });
}
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
    <section class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h1 class="text-2xl font-semibold">AutoService Platform</h1>
      <p class="mt-2 text-sm text-slate-400">Secure login for staff and clients</p>
      <button
        class="mt-6 w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium hover:bg-indigo-400 transition"
        @click="loginAsDemoAdmin"
      >
        Demo sign in
      </button>
    </section>
  </main>
</template>
