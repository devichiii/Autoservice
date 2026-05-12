import { defineStore } from "pinia";
import type { AppRole } from "./auth.types";
import type { UpdateUserPayload, UserItem } from "./users.types";
import { parseApiErrorMessage } from "../shared/api-error";
import {
  addRoleApi,
  fetchUsersApi,
  removeRoleApi,
  updateUserApi
} from "../features/users/api/users.api";

type UsersState = {
  users: UserItem[];
  isLoading: boolean;
  actionInProgressKey: string;
  error: string;
  actionError: string;
  successMessage: string;
};

export const useUsersStore = defineStore("users", {
  state: (): UsersState => ({
    users: [],
    isLoading: false,
    actionInProgressKey: "",
    error: "",
    actionError: "",
    successMessage: ""
  }),
  actions: {
    async fetchUsers() {
      this.isLoading = true;
      this.error = "";
      try {
        this.users = await fetchUsersApi();
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(error, "Не удалось загрузить пользователей.");
      } finally {
        this.isLoading = false;
      }
    },

    async updateUser(userId: string, payload: UpdateUserPayload) {
      if (this.actionInProgressKey) {
        return;
      }
      this.actionInProgressKey = `update:${userId}`;
      this.actionError = "";
      this.successMessage = "";
      try {
        await updateUserApi(userId, payload);
        await this.fetchUsers();
        this.successMessage = "Пользователь обновлен.";
      } catch (error: unknown) {
        this.actionError = parseApiErrorMessage(error, "Не удалось обновить пользователя.");
      } finally {
        this.actionInProgressKey = "";
      }
    },

    async addRole(userId: string, roleCode: AppRole) {
      if (this.actionInProgressKey) {
        return;
      }
      this.actionInProgressKey = `add-role:${userId}:${roleCode}`;
      this.actionError = "";
      this.successMessage = "";
      try {
        await addRoleApi(userId, roleCode);
        await this.fetchUsers();
        this.successMessage = "Роль пользователя обновлена.";
      } catch (error: unknown) {
        this.actionError = parseApiErrorMessage(error, "Не удалось назначить роль.");
      } finally {
        this.actionInProgressKey = "";
      }
    },

    async removeRole(userId: string, roleCode: AppRole) {
      if (this.actionInProgressKey) {
        return;
      }
      this.actionInProgressKey = `remove-role:${userId}:${roleCode}`;
      this.actionError = "";
      this.successMessage = "";
      try {
        await removeRoleApi(userId, roleCode);
        await this.fetchUsers();
        this.successMessage = "Роль пользователя обновлена.";
      } catch (error: unknown) {
        this.actionError = parseApiErrorMessage(error, "Не удалось удалить роль.");
      } finally {
        this.actionInProgressKey = "";
      }
    }
  }
});
