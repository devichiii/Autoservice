<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useAnalyticsStore } from "../entities/analytics.store";
import type { AnalyticsMetric, BookingsAnalytics, DashboardAnalytics } from "../entities/analytics.types";

const analyticsStore = useAnalyticsStore();

function getNumberByKeys(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
}

function buildMetrics(dashboard: DashboardAnalytics | null): AnalyticsMetric[] {
  if (!dashboard) {
    return [];
  }

  const source = dashboard as Record<string, unknown>;
  return [
    {
      key: "totalBookings",
      label: "Total bookings",
      value: getNumberByKeys(source, ["totalBookings", "bookingsTotal", "total"])
    },
    {
      key: "pendingBookings",
      label: "Pending bookings",
      value: getNumberByKeys(source, ["pendingBookings", "pending"])
    },
    {
      key: "confirmedBookings",
      label: "Confirmed bookings",
      value: getNumberByKeys(source, ["confirmedBookings", "confirmed"])
    },
    {
      key: "completedBookings",
      label: "Completed bookings",
      value: getNumberByKeys(source, ["completedBookings", "completed"])
    },
    {
      key: "canceledBookings",
      label: "Canceled bookings",
      value: getNumberByKeys(source, ["canceledBookings", "cancelledBookings", "canceled", "cancelled"])
    },
    {
      key: "totalUsers",
      label: "Total users",
      value: getNumberByKeys(source, ["totalUsers", "usersTotal"])
    },
    {
      key: "totalServices",
      label: "Total services",
      value: getNumberByKeys(source, ["totalServices", "servicesTotal"])
    }
  ].filter((item) => item.value !== null);
}

const dashboardMetrics = computed(() => buildMetrics(analyticsStore.dashboard));

const bookingStatusSummary = computed(() => {
  const source = analyticsStore.bookings as Record<string, unknown> | null;
  if (!source) {
    return [] as Array<{ label: string; value: number }>;
  }

  const statuses =
    (source.statuses as Record<string, unknown> | undefined) ??
    (source.byStatus as Record<string, unknown> | undefined) ??
    source;

  return Object.entries(statuses)
    .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
    .map(([status, value]) => ({
      label: status,
      value: value as number
    }));
});

onMounted(async () => {
  await Promise.all([
    analyticsStore.fetchDashboardAnalytics(),
    analyticsStore.fetchBookingsAnalytics()
  ]);
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Admin analytics</h1>
      <p class="mt-1 text-sm text-slate-400">
        Базовая admin analytics foundation без графиков и BI-панели.
      </p>
    </div>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">Dashboard metrics</h2>
      <p v-if="analyticsStore.dashboardError" class="mt-2 text-sm text-rose-400">
        {{ analyticsStore.dashboardError }}
      </p>
      <p v-else-if="analyticsStore.isLoadingDashboard" class="mt-2 text-sm text-slate-400">
        Загружаем dashboard analytics...
      </p>
      <p v-else-if="dashboardMetrics.length === 0" class="mt-2 text-sm text-slate-400">
        Метрики не получены или endpoint вернул пустой набор.
      </p>
      <div v-else class="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="metric in dashboardMetrics"
          :key="metric.key"
          class="rounded-lg border border-slate-800 bg-slate-900 p-3"
        >
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ metric.label }}</p>
          <p class="mt-1 text-xl font-semibold">{{ metric.value }}</p>
        </article>
      </div>
    </article>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">Bookings analytics</h2>
      <p v-if="analyticsStore.bookingsError" class="mt-2 text-sm text-rose-400">
        {{ analyticsStore.bookingsError }}
      </p>
      <p v-else-if="analyticsStore.isLoadingBookings" class="mt-2 text-sm text-slate-400">
        Загружаем bookings analytics...
      </p>
      <p v-else-if="bookingStatusSummary.length === 0" class="mt-2 text-sm text-slate-400">
        Сводка по статусам отсутствует в ответе endpoint.
      </p>
      <div v-else class="mt-3 grid gap-3 md:grid-cols-2">
        <article
          v-for="item in bookingStatusSummary"
          :key="item.label"
          class="rounded-lg border border-slate-800 bg-slate-900 p-3"
        >
          <p class="text-xs uppercase tracking-wide text-slate-400">{{ item.label }}</p>
          <p class="mt-1 text-lg font-semibold">{{ item.value }}</p>
        </article>
      </div>
    </article>
  </section>
</template>
