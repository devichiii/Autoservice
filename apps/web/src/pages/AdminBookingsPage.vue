<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAdminBookingsStore } from "../entities/admin-bookings.store";
import type { BookingStatus } from "../entities/bookings.types";

const adminBookingsStore = useAdminBookingsStore();

const selectedHistory = computed(() =>
  adminBookingsStore.selectedBookingId
    ? adminBookingsStore.historyByBookingId[adminBookingsStore.selectedBookingId] ?? []
    : []
);

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

async function showHistory(bookingId: string) {
  await adminBookingsStore.fetchHistory(bookingId);
}

async function updateStatus(bookingId: string, status: BookingStatus) {
  if (adminBookingsStore.updatingStatusForId) {
    return;
  }
  await adminBookingsStore.changeStatus(bookingId, status);
}

onMounted(async () => {
  await adminBookingsStore.fetchBookings();
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Admin bookings</h1>
      <p class="mt-1 text-sm text-slate-400">
        Просмотр всех записей и смена статусов для ADMIN/SUPER_ADMIN.
      </p>
    </div>

    <p v-if="adminBookingsStore.error" class="text-sm text-rose-400">{{ adminBookingsStore.error }}</p>
    <p v-if="adminBookingsStore.successMessage" class="text-sm text-emerald-400">
      {{ adminBookingsStore.successMessage }}
    </p>
    <p v-if="adminBookingsStore.isLoadingBookings" class="text-sm text-slate-400">
      Загружаем записи...
    </p>

    <article v-else-if="adminBookingsStore.bookings.length" class="rounded-xl border border-slate-800 p-4">
      <div v-for="booking in adminBookingsStore.bookings" :key="booking.id" class="mb-3 rounded-lg border border-slate-800 bg-slate-950 p-3">
        <p class="text-sm">
          <span class="text-slate-400">id:</span> {{ booking.id }} |
          <span class="text-slate-400">status:</span> {{ booking.status }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          user: {{ booking.user?.email ?? booking.userId }} | service: {{ booking.service.title }} | at:
          {{ formatDateTime(booking.scheduledAt) }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="nextStatus in adminBookingsStore.allowedTransitions(booking.status)"
            :key="`${booking.id}:${nextStatus}`"
            class="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-60"
            :disabled="adminBookingsStore.updatingStatusForId === booking.id"
            @click="updateStatus(booking.id, nextStatus)"
          >
            {{ nextStatus }}
          </button>
          <button
            class="rounded-md border border-indigo-700 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-900"
            :disabled="
              adminBookingsStore.updatingStatusForId === booking.id ||
              adminBookingsStore.loadingHistoryForId === booking.id
            "
            @click="showHistory(booking.id)"
          >
            History
          </button>
        </div>
      </div>
    </article>
    <p v-else class="text-sm text-slate-400">Записей пока нет.</p>

    <article v-if="adminBookingsStore.selectedBookingId" class="rounded-xl border border-slate-800 p-4">
      <h2 class="text-lg font-medium">История статусов</h2>
      <p v-if="adminBookingsStore.loadingHistoryForId" class="mt-2 text-sm text-slate-400">
        Загружаем историю...
      </p>
      <p v-else-if="selectedHistory.length === 0" class="mt-2 text-sm text-slate-400">
        История для записи пустая.
      </p>
      <ul v-else class="mt-2 space-y-2">
        <li v-for="item in selectedHistory" :key="item.id" class="rounded-md border border-slate-800 bg-slate-950 p-2 text-xs">
          {{ item.fromStatus }} -> {{ item.toStatus }} | {{ formatDateTime(item.changedAt) }}
          <span v-if="item.reason">| {{ item.reason }}</span>
        </li>
      </ul>
    </article>
  </section>
</template>
