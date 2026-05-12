<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useCarsStore } from "../entities/cars.store";

const carsStore = useCarsStore();
const validationError = ref("");

const form = reactive({
  brand: "",
  model: "",
  year: "",
  vin: "",
  plateNumber: "",
  notes: ""
});

function resetForm() {
  form.brand = "";
  form.model = "";
  form.year = "";
  form.vin = "";
  form.plateNumber = "";
  form.notes = "";
}

function validateForm(): string | null {
  const brand = form.brand.trim();
  const model = form.model.trim();
  const yearValue = String(form.year ?? "").trim();
  const vin = form.vin.trim();
  const plateNumber = form.plateNumber.trim();

  if (!brand || !model || !yearValue) {
    return "Заполните обязательные поля: марка, модель и год.";
  }

  if (!vin && !plateNumber) {
    return "Укажите VIN или госномер.";
  }

  const parsedYear = Number(yearValue);
  if (!Number.isInteger(parsedYear)) {
    return "Поле year должно быть целым числом.";
  }
  const currentYear = new Date().getFullYear();
  if (parsedYear < 1900 || parsedYear > currentYear + 1) {
    return `Поле year должно быть в диапазоне 1900-${currentYear + 1}.`;
  }

  return null;
}

const canSubmit = computed(() => !validateForm() && !carsStore.isCreating);

async function submit() {
  if (!canSubmit.value) {
    validationError.value = validateForm() ?? "";
    return;
  }

  validationError.value = "";
  const error = validateForm();
  if (error) {
    validationError.value = error;
    return;
  }

  try {
    const yearValue = String(form.year ?? "").trim();
    await carsStore.createCar({
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(yearValue),
      vin: form.vin.trim(),
      plateNumber: form.plateNumber.trim() || undefined,
      notes: form.notes.trim() || undefined
    });
    resetForm();
  } catch {
    // Error is already mapped and stored in carsStore.error.
  }
}

onMounted(async () => {
  await carsStore.fetchCars();
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Cars</h1>
      <p class="mt-1 text-sm text-slate-400">
        Управление автомобилями текущего пользователя через `GET/POST/DELETE /cars`.
      </p>
    </div>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">Добавить автомобиль</h2>
      <form class="mt-3 grid gap-3 md:grid-cols-2" @submit.prevent="submit">
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Brand *</span>
          <input
            v-model="form.brand"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Model *</span>
          <input
            v-model="form.model"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Year *</span>
          <input
            v-model="form.year"
            type="number"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">VIN *</span>
          <input
            v-model="form.vin"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Plate number</span>
          <input
            v-model="form.plateNumber"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm text-slate-300">Notes</span>
          <input
            v-model="form.notes"
            type="text"
            class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          />
        </label>

        <p v-if="validationError" class="md:col-span-2 text-sm text-rose-400">{{ validationError }}</p>
        <p v-if="carsStore.error" class="md:col-span-2 text-sm text-rose-400">{{ carsStore.error }}</p>
        <p v-if="carsStore.successMessage" class="md:col-span-2 text-sm text-emerald-400">
          {{ carsStore.successMessage }}
        </p>

        <div class="md:col-span-2">
          <button
            type="submit"
            :disabled="!canSubmit"
            class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ carsStore.isCreating ? "Создание..." : "Создать машину" }}
          </button>
        </div>
      </form>
    </article>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-medium">Мои машины</h2>
        <button
          class="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          :disabled="carsStore.isLoading"
          @click="carsStore.fetchCars"
        >
          {{ carsStore.isLoading ? "Загрузка..." : "Обновить" }}
        </button>
      </div>

      <p v-if="carsStore.isLoading" class="text-sm text-slate-400">Загружаем список машин...</p>
      <p v-else-if="carsStore.cars.length === 0" class="text-sm text-slate-400">Машин пока нет.</p>

      <div v-else class="grid gap-3">
        <article
          v-for="car in carsStore.cars"
          :key="car.id"
          class="rounded-lg border border-slate-800 bg-slate-900 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 class="font-medium">{{ car.brand }} {{ car.model }} ({{ car.year ?? "-" }})</h3>
              <p class="mt-1 text-sm text-slate-300">VIN: {{ car.vin ?? "-" }}</p>
              <p class="text-sm text-slate-400">Plate: {{ car.plateNumber ?? "-" }}</p>
              <p class="text-sm text-slate-400">Notes: {{ car.notes ?? "-" }}</p>
            </div>

            <button
              class="rounded-md border border-rose-700 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="carsStore.deletingCarId === car.id"
              @click="carsStore.deleteCar(car.id)"
            >
              {{ carsStore.deletingCarId === car.id ? "Удаление..." : "Удалить" }}
            </button>
          </div>
        </article>
      </div>
    </article>
  </section>
</template>
