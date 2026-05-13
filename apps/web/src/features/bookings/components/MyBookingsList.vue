<script setup lang="ts">
import type { BookingStatus } from "../../../entities/bookings.types";

defineProps<{
  bookings: BookingItem[];
  isLoading: boolean;
  error: string;
  cancelingBookingId: string | null;
}>();

const CLIENT_CANCELABLE: BookingStatus[] = ["PENDING", "CONFIRMED"];

function canClientCancel(status: BookingStatus) {
  return CLIENT_CANCELABLE.includes(status);
}
</script>

<template>
  <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
    <h2 class="text-lg font-medium">Мои записи</h2>

    <p v-if="error" class="mt-2 text-sm text-rose-400">{{ error }}</p>
    <p v-if="isLoading" class="mt-2 text-sm text-slate-400">Загружаем записи...</p>
    <p v-else-if="bookings.length === 0" class="mt-2 text-sm text-slate-400">Записей пока нет.</p>

    <div v-else class="mt-3 grid gap-3">
      <article
        v-for="booking in bookings"
        :key="booking.id"
        class="rounded-lg border border-slate-800 bg-slate-900 p-3"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1 text-sm">
            <p class="font-medium">
              {{ booking.service.title }} · {{ booking.car.brand }} {{ booking.car.model }}
            </p>
            <p class="text-slate-300">
              Время: {{ new Date(booking.scheduledAt).toLocaleString() }}
            </p>
            <p class="text-slate-300">Статус: {{ booking.status }}</p>
            <p v-if="booking.comment" class="text-slate-400">Комментарий: {{ booking.comment }}</p>
            <p v-if="booking.statusComment" class="text-slate-400">
              Причина статуса: {{ booking.statusComment }}
            </p>
          </div>

          <button
            class="rounded-md border border-rose-700 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="
              booking.status === 'CANCELED' ||
              !canClientCancel(booking.status) ||
              cancelingBookingId === booking.id
            "
            @click="$emit('cancel', booking.id)"
          >
            {{
              booking.status === "CANCELED"
                ? "Отменено"
                : !canClientCancel(booking.status)
                  ? "Отмена недоступна"
                  : cancelingBookingId === booking.id
                    ? "Отмена..."
                    : "Отменить"
            }}
          </button>
        </div>
      </article>
    </div>
  </article>
</template>
