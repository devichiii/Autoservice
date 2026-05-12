<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../entities/auth.store";
import { parseApiErrorMessage } from "../../shared/api-error";

const authStore = useAuthStore();
const router = useRouter();

const form = reactive({
  email: "",
  password: ""
});
const isLoading = ref(false);
const errorMessage = ref("");
const canSubmit = computed(
  () => !isLoading.value && Boolean(form.email.trim()) && Boolean(form.password.trim())
);

async function submit() {
  if (!canSubmit.value) {
    return;
  }

  errorMessage.value = "";
  const email = form.email.trim();
  const password = form.password.trim();
  if (!email || !password) {
    errorMessage.value = "Введите email и пароль.";
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login({ email, password });
    router.push({ name: "dashboard" });
  } catch (error: unknown) {
    errorMessage.value = parseApiErrorMessage(error, "Не удалось выполнить вход.");
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
      :disabled="!canSubmit"
      class="w-full rounded-lg bg-indigo-500 px-4 py-2 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {{ isLoading ? "Вход..." : "Войти" }}
    </button>
  </form>
</template>
