<script setup lang="ts">
import LoginForm from "../features/auth/LoginForm.vue";
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
    <section class="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h1 class="text-2xl font-semibold">AutoService Platform</h1>
      <p class="mt-2 text-sm text-slate-400">Войдите в систему под своим аккаунтом.</p>
      <LoginForm />
    </section>
  </main>
</template>
