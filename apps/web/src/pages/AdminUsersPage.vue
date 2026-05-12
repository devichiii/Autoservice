<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import type { AppRole } from "../entities/auth.types";
import { useAuthStore } from "../entities/auth.store";
import { useUsersStore } from "../entities/users.store";
import UsersTable from "../features/users/components/UsersTable.vue";

const authStore = useAuthStore();
const usersStore = useUsersStore();

const selectedRoleByUserId = reactive<Record<string, AppRole>>({});

const isSuperAdminMode = computed(() =>
  Boolean(authStore.user?.roles.includes("SUPER_ADMIN"))
);
const isAdminMode = computed(() =>
  Boolean(authStore.user?.roles.some((role) => role === "ADMIN" || role === "SUPER_ADMIN"))
);

function ensureRoleSelection(userId: string) {
  if (!selectedRoleByUserId[userId]) {
    selectedRoleByUserId[userId] = "CLIENT";
  }
}

async function addRole(userId: string, roleCode: AppRole) {
  await usersStore.addRole(userId, roleCode);
}

async function removeRole(userId: string, roleCode: AppRole) {
  if (authStore.user?.sub === userId && roleCode === "SUPER_ADMIN") {
    usersStore.actionError = "Нельзя снять роль SUPER_ADMIN у самого себя из UI.";
    return;
  }
  await usersStore.removeRole(userId, roleCode);
}

async function toggleActive(userId: string, isActive: boolean) {
  await usersStore.updateUser(userId, { isActive });
}

onMounted(async () => {
  await usersStore.fetchUsers();
  usersStore.users.forEach((user) => ensureRoleSelection(user.id));
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Admin users & roles</h1>
      <p class="mt-1 text-sm text-slate-400">
        Управление пользователями и ролями. Назначение/удаление ролей доступно только SUPER_ADMIN.
      </p>
    </div>
    <p v-if="usersStore.successMessage" class="text-sm text-emerald-400">
      {{ usersStore.successMessage }}
    </p>

    <UsersTable
      :users="usersStore.users"
      :is-loading="usersStore.isLoading"
      :error="usersStore.error"
      :action-error="usersStore.actionError"
      :is-admin-mode="isAdminMode"
      :is-super-admin-mode="isSuperAdminMode"
      :action-in-progress-key="usersStore.actionInProgressKey"
      :selected-role-by-user-id="selectedRoleByUserId"
      :current-user-id="authStore.user?.sub ?? ''"
      @add-role="addRole"
      @remove-role="removeRole"
      @toggle-active="toggleActive"
    />
  </section>
</template>
