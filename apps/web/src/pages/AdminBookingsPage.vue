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

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Ожидает",
  CONFIRMED: "Подтверждена",
  IN_PROGRESS: "В работе",
  COMPLETED: "Завершена",
  CANCELED: "Отменена"
};

const NEXT_ACTION_LABELS: Partial<Record<BookingStatus, string>> = {
  CONFIRMED: "Подтвердить",
  IN_PROGRESS: "В работу",
  COMPLETED: "Завершить",
  CANCELED: "Отменить"
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function statusLabel(status: BookingStatus) {
  return STATUS_LABELS[status] ?? status;
}

function nextActionLabel(status: BookingStatus) {
  return NEXT_ACTION_LABELS[status] ?? status;
}

const anyStatusUpdateInFlight = computed(() => Boolean(adminBookingsStore.updatingStatusForId));

async function showHistory(bookingId: string) {
  if (anyStatusUpdateInFlight.value) {
    return;
  }
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
        Просмотр всех записей и смена статусов для MANAGER/ADMIN/SUPER_ADMIN. Доступны только допустимые переходы.
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
          <span class="text-slate-400">статус:</span> {{ statusLabel(booking.status) }}
        </p>
        <p class="mt-1 text-xs text-slate-400">
          user: {{ booking.user?.email ?? booking.userId }} | service: {{ booking.service.title }} | at:
          {{ formatDateTime(booking.scheduledAt) }}
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button
            v-for="nextStatus in adminBookingsStore.allowedTransitions(booking.status)"
            :key="`${booking.id}:${nextStatus}`"
            class="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="anyStatusUpdateInFlight"
            @click="updateStatus(booking.id, nextStatus)"
          >
            {{ nextActionLabel(nextStatus) }}
          </button>
          <button
            class="rounded-md border border-indigo-700 px-2 py-1 text-xs text-indigo-200 hover:bg-indigo-900 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="
              anyStatusUpdateInFlight || adminBookingsStore.loadingHistoryForId === booking.id
            "
            @click="showHistory(booking.id)"
          >
            История
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
          {{ statusLabel(item.fromStatus) }} → {{ statusLabel(item.toStatus) }} | {{ formatDateTime(item.changedAt) }}
          <span class="text-slate-500">
            | кто:
            {{
              item.changedByUser
                ? `${item.changedByUser.firstName} ${item.changedByUser.lastName} (${item.changedByUser.email})`
                : item.changedByUserId
            }}
          </span>
          <span v-if="item.reason">| {{ item.reason }}</span>
        </li>
      </ul>
    </article>
  </section>
</template>
