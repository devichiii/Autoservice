<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  createServiceAdmin,
  deleteServiceAdmin,
  listServicesAdmin,
  updateServiceAdmin,
  type AdminServiceItem
} from "../features/admin-services/api/admin-services.api";
import { parseApiErrorMessage } from "../shared/api-error";

const state = reactive({
  services: [] as AdminServiceItem[],
  isLoading: false,
  isSaving: false,
  deletingServiceId: "",
  editingServiceId: "",
  error: "",
  successMessage: ""
});

const form = reactive({
  title: "",
  description: "",
  price: "",
  durationMinutes: "",
  isActive: true
});
const showValidation = ref(false);

const validationMessage = computed(() => {
  const title = form.title.trim();
  if (!title) {
    return "Название услуги обязательно.";
  }

  const price = Number(form.price);
  if (!Number.isFinite(price) || price <= 0) {
    return "Цена должна быть больше 0.";
  }

  const durationMinutes = Number(form.durationMinutes);
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return "Длительность должна быть целым числом больше 0.";
  }

  return "";
});

const canSubmit = computed(
  () => !state.isSaving && !validationMessage.value && !state.deletingServiceId
);

function resetForm() {
  form.title = "";
  form.description = "";
  form.price = "";
  form.durationMinutes = "";
  form.isActive = true;
  state.editingServiceId = "";
  showValidation.value = false;
}

function fillForm(item: AdminServiceItem) {
  form.title = item.title;
  form.description = item.description ?? "";
  form.price = String(item.price);
  form.durationMinutes = String(item.durationMinutes);
  form.isActive = item.isActive;
  state.editingServiceId = item.id;
}

async function fetchServices() {
  state.isLoading = true;
  state.error = "";
  try {
    state.services = await listServicesAdmin();
  } catch (error: unknown) {
    state.error = parseApiErrorMessage(error, "Не удалось загрузить услуги.");
  } finally {
    state.isLoading = false;
  }
}

async function submitService() {
  showValidation.value = true;

  if (!canSubmit.value) {
    return;
  }

  state.isSaving = true;
  state.error = "";
  state.successMessage = "";

  const payload = {
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    price: Number(form.price),
    durationMinutes: Number(form.durationMinutes),
    isActive: form.isActive
  };

  try {
    if (state.editingServiceId) {
      await updateServiceAdmin(state.editingServiceId, payload);
      state.successMessage = "Услуга обновлена.";
    } else {
      await createServiceAdmin(payload);
      state.successMessage = "Услуга создана.";
    }
    await fetchServices();
    resetForm();
  } catch (error: unknown) {
    state.error = parseApiErrorMessage(error, "Не удалось сохранить услугу.");
  } finally {
    state.isSaving = false;
  }
}

async function removeService(serviceId: string) {
  if (state.deletingServiceId || state.isSaving) {
    return;
  }

  state.deletingServiceId = serviceId;
  state.error = "";
  state.successMessage = "";
  try {
    await deleteServiceAdmin(serviceId);
    state.successMessage = "Услуга удалена.";
    state.services = state.services.filter((item) => item.id !== serviceId);
    if (state.editingServiceId === serviceId) {
      resetForm();
    }
  } catch (error: unknown) {
    state.error = parseApiErrorMessage(
      error,
      "Нельзя удалить услугу, потому что по ней уже есть бронирования."
    );
  } finally {
    state.deletingServiceId = "";
  }
}

onMounted(async () => {
  await fetchServices();
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Admin services</h1>
      <p class="mt-1 text-sm text-slate-400">
        Управление услугами для ADMIN/SUPER_ADMIN.
      </p>
    </div>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">
        {{ state.editingServiceId ? "Редактировать услугу" : "Создать услугу" }}
      </h2>
      <form class="mt-3 grid gap-3 md:grid-cols-2" @submit.prevent="submitService">
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Название *</span>
          <input
            v-model="form.title"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Цена *</span>
          <input
            v-model="form.price"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Длительность (мин) *</span>
          <input
            v-model="form.durationMinutes"
            type="number"
            min="1"
            step="1"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <label class="flex items-center gap-2 pt-6 text-sm text-slate-300">
          <input v-model="form.isActive" type="checkbox" />
          Активна
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm text-slate-300">Описание</span>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <p v-if="showValidation && validationMessage" class="md:col-span-2 text-sm text-rose-400">
          {{ validationMessage }}
        </p>
        <p v-if="state.error" class="md:col-span-2 text-sm text-rose-400">{{ state.error }}</p>
        <p v-if="state.successMessage" class="md:col-span-2 text-sm text-emerald-400">
          {{ state.successMessage }}
        </p>

        <div class="md:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            :disabled="!canSubmit"
            class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ state.isSaving ? "Сохранение..." : state.editingServiceId ? "Сохранить изменения" : "Создать услугу" }}
          </button>
          <button
            v-if="state.editingServiceId"
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
            :disabled="state.isSaving"
            @click="resetForm"
          >
            Отменить редактирование
          </button>
        </div>
      </form>
    </article>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-medium">Список услуг</h2>
        <button
          class="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          :disabled="state.isLoading"
          @click="fetchServices"
        >
          {{ state.isLoading ? "Загрузка..." : "Обновить" }}
        </button>
      </div>

      <p v-if="state.isLoading" class="text-sm text-slate-400">Загружаем услуги...</p>
      <p v-else-if="state.services.length === 0" class="text-sm text-slate-400">Услуг пока нет.</p>

      <div v-else class="grid gap-3">
        <article
          v-for="item in state.services"
          :key="item.id"
          class="rounded-lg border border-slate-800 bg-slate-900 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="text-sm">
              <p class="font-medium">
                {{ item.title }}
                <span class="ml-2 text-xs text-slate-400">({{ item.isActive ? "active" : "inactive" }})</span>
              </p>
              <p class="text-slate-300">Цена: {{ item.price }}</p>
              <p class="text-slate-300">Длительность: {{ item.durationMinutes }} мин</p>
              <p v-if="item.description" class="mt-1 text-slate-400">{{ item.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                :disabled="state.isSaving || state.deletingServiceId === item.id"
                @click="fillForm(item)"
              >
                Редактировать
              </button>
              <button
                class="rounded-md border border-rose-700 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="state.isSaving || state.deletingServiceId === item.id"
                @click="removeService(item.id)"
              >
                {{ state.deletingServiceId === item.id ? "Удаление..." : "Удалить" }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>
