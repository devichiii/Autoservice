<script setup lang="ts">
import type { CarItem, ScheduleSlot, ServiceItem } from "../../../entities/bookings.types";

type BookingFormModel = {
  carId: string;
  serviceId: string;
  date: string;
  scheduledAt: string;
  comment: string;
};

const model = defineModel<BookingFormModel>({ required: true });

defineProps<{
  cars: CarItem[];
  services: ServiceItem[];
  slots: ScheduleSlot[];
  isLoadingCars: boolean;
  isLoadingServices: boolean;
  isLoadingSlots: boolean;
  isCreatingBooking: boolean;
  carsError: string;
  servicesError: string;
  slotsError: string;
  createError: string;
  validationError: string;
}>();
</script>

<template>
  <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
    <h2 class="text-lg font-medium">Создать запись</h2>

    <div class="mt-3 grid gap-3 md:grid-cols-2">
      <label class="block">
        <span class="mb-1 block text-sm text-slate-300">Услуга *</span>
        <select
          v-model="model.serviceId"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          :disabled="isLoadingServices"
        >
          <option value="">Выберите услугу</option>
          <option v-for="service in services" :key="service.id" :value="service.id">
            {{ service.title }} ({{ service.durationMinutes }} мин, {{ service.price }})
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm text-slate-300">Машина *</span>
        <select
          v-model="model.carId"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          :disabled="isLoadingCars"
        >
          <option value="">Выберите машину</option>
          <option v-for="car in cars" :key="car.id" :value="car.id">
            {{ car.brand }} {{ car.model }} (VIN: {{ car.vin ?? "-" }})
          </option>
        </select>
      </label>

      <label class="block">
        <span class="mb-1 block text-sm text-slate-300">Дата *</span>
        <input
          v-model="model.date"
          type="date"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-sm text-slate-300">Доступный слот *</span>
        <select
          v-model="model.scheduledAt"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
          :disabled="isLoadingSlots || slots.length === 0"
        >
          <option value="">
            {{
              isLoadingSlots
                ? "Загрузка слотов..."
                : slots.length === 0
                  ? "Нет доступных слотов"
                  : "Выберите слот"
            }}
          </option>
          <option v-for="slot in slots" :key="slot.startsAt" :value="slot.startsAt">
            {{ new Date(slot.startsAt).toLocaleString() }} - {{ new Date(slot.endsAt).toLocaleTimeString() }}
          </option>
        </select>
      </label>

      <label class="block md:col-span-2">
        <span class="mb-1 block text-sm text-slate-300">Комментарий</span>
        <input
          v-model="model.comment"
          type="text"
          placeholder="Опционально"
          class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400"
        />
      </label>
    </div>

    <p v-if="servicesError" class="mt-2 text-sm text-rose-400">{{ servicesError }}</p>
    <p v-if="carsError" class="mt-2 text-sm text-rose-400">{{ carsError }}</p>
    <p v-if="slotsError" class="mt-2 text-sm text-rose-400">{{ slotsError }}</p>
    <p v-if="validationError" class="mt-2 text-sm text-rose-400">{{ validationError }}</p>
    <p v-if="createError" class="mt-2 text-sm text-rose-400">{{ createError }}</p>

    <button
      class="mt-3 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="isCreatingBooking"
      @click="$emit('submit')"
    >
      {{ isCreatingBooking ? "Создание..." : "Создать бронь" }}
    </button>
  </article>
</template>
