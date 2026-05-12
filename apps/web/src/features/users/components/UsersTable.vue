<script setup lang="ts">
import type { AppRole } from "../../../entities/auth.types";
import type { UserItem } from "../../../entities/users.types";

defineProps<{
  users: UserItem[];
  isLoading: boolean;
  error: string;
  actionError: string;
  isAdminMode: boolean;
  isSuperAdminMode: boolean;
  actionInProgressKey: string;
  selectedRoleByUserId: Record<string, AppRole>;
  currentUserId: string;
}>();
</script>

<template>
  <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
    <h2 class="text-lg font-medium">Пользователи</h2>

    <p v-if="error" class="mt-2 text-sm text-rose-400">{{ error }}</p>
    <p v-if="actionError" class="mt-2 text-sm text-rose-400">{{ actionError }}</p>
    <p v-if="isLoading" class="mt-2 text-sm text-slate-400">Загружаем пользователей...</p>
    <p v-else-if="users.length === 0" class="mt-2 text-sm text-slate-400">Пользователей пока нет.</p>

    <div v-else class="mt-3 grid gap-3">
      <article
        v-for="user in users"
        :key="user.id"
        class="rounded-lg border border-slate-800 bg-slate-900 p-3"
      >
        <div class="grid gap-2 text-sm md:grid-cols-2">
          <p><span class="text-slate-400">email:</span> {{ user.email }}</p>
          <p><span class="text-slate-400">id:</span> {{ user.id }}</p>
          <p><span class="text-slate-400">firstName:</span> {{ user.firstName }}</p>
          <p><span class="text-slate-400">lastName:</span> {{ user.lastName }}</p>
          <p v-if="typeof user.isActive === 'boolean'">
            <span class="text-slate-400">isActive:</span> {{ user.isActive ? "true" : "false" }}
          </p>
        </div>

        <div class="mt-2">
          <p class="text-xs uppercase tracking-wide text-slate-400">Roles</p>
          <div class="mt-1 flex flex-wrap gap-2">
            <span
              v-for="role in user.roles"
              :key="`${user.id}:${role.code}`"
              class="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200"
            >
              {{ role.code }}
              <button
                v-if="isSuperAdminMode"
                class="ml-2 text-rose-300 hover:text-rose-200 disabled:opacity-60"
                :disabled="
                  actionInProgressKey === `remove-role:${user.id}:${role.code}` ||
                  (currentUserId === user.id && role.code === 'SUPER_ADMIN')
                "
                @click="$emit('remove-role', user.id, role.code)"
              >
                remove
              </button>
            </span>
          </div>
        </div>

        <div v-if="isSuperAdminMode" class="mt-3 flex flex-wrap items-center gap-2">
          <select
            v-model="selectedRoleByUserId[user.id]"
            class="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
          >
            <option value="CLIENT">CLIENT</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <button
            class="rounded-md border border-emerald-700 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950 disabled:opacity-60"
            :disabled="actionInProgressKey === `add-role:${user.id}:${selectedRoleByUserId[user.id]}`"
            @click="$emit('add-role', user.id, selectedRoleByUserId[user.id])"
          >
            Add role
          </button>
        </div>

        <div
          v-if="isAdminMode && typeof user.isActive === 'boolean'"
          class="mt-2 flex items-center gap-2"
        >
          <button
            class="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            :disabled="actionInProgressKey === `update:${user.id}`"
            @click="$emit('toggle-active', user.id, !user.isActive)"
          >
            {{ user.isActive ? "Deactivate" : "Activate" }}
          </button>
        </div>
      </article>
    </div>
  </article>
</template>
