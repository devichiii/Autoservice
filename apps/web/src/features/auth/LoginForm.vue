<script setup lang="ts">
import axios from "axios";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../entities/auth.store";

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  email: "",
  password: ""
});
const isLoading = ref(false);
const errorMessage = ref("");

function resolveApiErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Login failed.";
  }

  const payload = error.response?.data as
    | { message?: string | string[]; error?: { message?: string | string[] } }
    | undefined;

  const direct = payload?.message;
  if (Array.isArray(direct)) {
    return direct.join(", ");
  }
  if (typeof direct === "string" && direct.length > 0) {
    return direct;
  }

  const nested = payload?.error?.message;
  if (Array.isArray(nested)) {
    return nested.join(", ");
  }
  if (typeof nested === "string" && nested.length > 0) {
    return nested;
  }

  return "Login failed.";
}

async function submit() {
  errorMessage.value = "";
  isLoading.value = true;
  try {
    await authStore.login(form);
    router.push({ name: "dashboard" });
  } catch (error: unknown) {
    errorMessage.value = resolveApiErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <form class="mt-6 space-y-4" @submit.prevent="submit">
    <label class="block">
      <span class="mb-1 block text-sm text-slate-300">Email</span>
      <input
        v-model="form.email"
        type="email"
        required
        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>

    <label class="block">
      <span class="mb-1 block text-sm text-slate-300">Password</span>
      <input
        v-model="form.password"
        type="password"
        required
        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-indigo-400"
      />
    </label>

    <p v-if="errorMessage" class="text-sm text-rose-400">{{ errorMessage }}</p>

    <button
      type="submit"
      :disabled="isLoading"
      class="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ isLoading ? "Signing in..." : "Sign in" }}
    </button>
  </form>
</template>
