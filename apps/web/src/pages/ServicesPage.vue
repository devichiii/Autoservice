<script setup lang="ts">
import { onMounted, reactive } from "vue";
import { apiClient } from "../shared/api-client";
import { parseApiErrorMessage } from "../shared/api-error";

type ServiceItem = {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  durationMinutes: number;
};

const state = reactive({
  services: [] as ServiceItem[],
  isLoading: false,
  error: ""
});

async function fetchServices() {
  state.isLoading = true;
  state.error = "";
  try {
    const response = await apiClient.get<ServiceItem[]>("/services");
    state.services = response.data;
  } catch (error: unknown) {
    state.error = parseApiErrorMessage(error, "Не удалось загрузить услуги.");
  } finally {
    state.isLoading = false;
  }
}

onMounted(async () => {
  await fetchServices();
});
</script>

<template>
  <section class="space-y-4">
    <div>
      <h1 class="text-2xl font-semibold">Services</h1>
      <p class="mt-1 text-sm text-slate-400">Список услуг из backend API.</p>
    </div>

    <p v-if="state.error" class="text-sm text-rose-400">{{ state.error }}</p>
    <p v-if="state.isLoading" class="text-sm text-slate-400">Загружаем услуги...</p>
    <p v-else-if="state.services.length === 0" class="text-sm text-slate-400">
      Услуг пока нет.
    </p>

    <div v-else class="grid gap-3 md:grid-cols-2">
      <article
        v-for="service in state.services"
        :key="service.id"
        class="rounded-lg border border-slate-800 bg-slate-950 p-3"
      >
        <p class="font-medium">{{ service.title }}</p>
        <p class="mt-1 text-xs text-slate-400">Duration: {{ service.durationMinutes }} min</p>
        <p class="text-xs text-slate-400">Price: {{ service.price }}</p>
        <p v-if="service.description" class="mt-2 text-sm text-slate-300">{{ service.description }}</p>
      </article>
    </div>
  </section>
</template>
