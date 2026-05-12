import { apiClient } from "../../../shared/api-client";

export type AdminServiceItem = {
  id: string;
  title: string;
  description: string | null;
  price: string | number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminServicePayload = {
  title: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive?: boolean;
};

export async function listServicesAdmin() {
  const response = await apiClient.get<AdminServiceItem[]>("/services");
  return response.data;
}

export async function createServiceAdmin(payload: AdminServicePayload) {
  const response = await apiClient.post<AdminServiceItem>("/services", payload);
  return response.data;
}

export async function updateServiceAdmin(serviceId: string, payload: Partial<AdminServicePayload>) {
  const response = await apiClient.patch<AdminServiceItem>(`/services/${serviceId}`, payload);
  return response.data;
}

export async function deleteServiceAdmin(serviceId: string) {
  await apiClient.delete(`/services/${serviceId}`);
}
