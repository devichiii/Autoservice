<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { useAuthStore } from "../entities/auth.store";
import { useNotificationsStore } from "../entities/notifications.store";
import type { NotificationType } from "../entities/notifications.types";

const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

const isAdminMode = computed(() =>
  Boolean(authStore.user?.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN"))
);

const testForm = reactive<{
  title: string;
  message: string;
  type: NotificationType;
}>({
  title: "Тестовое уведомление",
  message: "Проверка Notifications UI foundation.",
  type: "SYSTEM"
});

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

onMounted(async () => {
  await notificationsStore.fetchNotifications();
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Notifications</h1>
      <p class="mt-1 text-sm text-slate-400">
        Базовый UI уведомлений без realtime/WebSocket. Непрочитанных: {{ notificationsStore.unreadCount }}.
      </p>
    </div>

    <article v-if="isAdminMode" class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">Test notification (ADMIN/SUPER_ADMIN)</h2>
      <div class="mt-3 grid gap-3 md:grid-cols-2">
        <label class="text-sm">
          <span class="mb-1 block text-slate-400">Title</span>
          <input
            v-model="testForm.title"
            type="text"
            class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </label>
        <label class="text-sm">
          <span class="mb-1 block text-slate-400">Type</span>
          <select
            v-model="testForm.type"
            class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <option value="SYSTEM">SYSTEM</option>
            <option value="BOOKING_CREATED">BOOKING_CREATED</option>
            <option value="BOOKING_STATUS_CHANGED">BOOKING_STATUS_CHANGED</option>
          </select>
        </label>
      </div>
      <label class="mt-3 block text-sm">
        <span class="mb-1 block text-slate-400">Message</span>
        <textarea
          v-model="testForm.message"
          rows="3"
          class="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
        />
      </label>
      <button
        class="mt-3 rounded-md border border-indigo-600 px-3 py-2 text-sm hover:bg-indigo-900 disabled:opacity-60"
        :disabled="notificationsStore.isCreatingTest"
        @click="notificationsStore.createTest(testForm)"
      >
        {{ notificationsStore.isCreatingTest ? "Sending..." : "Send test notification" }}
      </button>
    </article>

    <p v-if="notificationsStore.error" class="text-sm text-rose-400">{{ notificationsStore.error }}</p>
    <p v-if="notificationsStore.actionError" class="text-sm text-rose-400">
      {{ notificationsStore.actionError }}
    </p>
    <p v-if="notificationsStore.successMessage" class="text-sm text-emerald-400">
      {{ notificationsStore.successMessage }}
    </p>
    <p v-if="notificationsStore.isLoading" class="text-sm text-slate-400">Загружаем уведомления...</p>
    <p v-else-if="notificationsStore.notifications.length === 0" class="text-sm text-slate-400">
      Уведомлений пока нет.
    </p>

    <article v-else class="space-y-3">
      <article
        v-for="item in notificationsStore.notifications"
        :key="item.id"
        class="rounded-xl border border-slate-800 bg-slate-950 p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p class="text-xs text-slate-400">{{ item.type }} · {{ formatDateTime(item.createdAt) }}</p>
            <h2 class="mt-1 text-base font-medium">{{ item.title }}</h2>
          </div>
          <span
            class="rounded-md border px-2 py-1 text-xs"
            :class="
              item.isRead
                ? 'border-emerald-800 text-emerald-300'
                : 'border-amber-800 text-amber-300'
            "
          >
            {{ item.isRead ? "Read" : "Unread" }}
          </span>
        </div>
        <p class="mt-2 text-sm text-slate-200">{{ item.message }}</p>
        <div class="mt-3">
          <button
            class="rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-60"
            :disabled="item.isRead || notificationsStore.markingNotificationId === item.id"
            @click="notificationsStore.markAsRead(item.id)"
          >
            {{
              item.isRead
                ? "Already read"
                : notificationsStore.markingNotificationId === item.id
                  ? "Marking..."
                  : "Mark as read"
            }}
          </button>
          <p v-if="item.readAt" class="mt-1 text-xs text-slate-500">
            Read at: {{ formatDateTime(item.readAt) }}
          </p>
        </div>
      </article>
    </article>
  </section>
</template>
