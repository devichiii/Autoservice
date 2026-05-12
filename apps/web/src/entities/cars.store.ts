import { defineStore } from "pinia";
import { apiClient } from "../shared/api-client";
import type { Car, CreateCarPayload } from "./cars.types";

type CarsState = {
  cars: Car[];
  isLoading: boolean;
  isCreating: boolean;
  deletingCarId: string | null;
  error: string;
};

function parseApiError(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const maybeResponse = (error as { response?: { data?: unknown } }).response;
    const data = maybeResponse?.data as
      | { message?: string | string[]; error?: { message?: string | string[] } }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }
    if (typeof data?.message === "string" && data.message.length > 0) {
      return data.message;
    }
    if (Array.isArray(data?.error?.message)) {
      return data.error.message.join(", ");
    }
    if (typeof data?.error?.message === "string" && data.error.message.length > 0) {
      return data.error.message;
    }
  }

  return "Request failed.";
}

export const useCarsStore = defineStore("cars", {
  state: (): CarsState => ({
    cars: [],
    isLoading: false,
    isCreating: false,
    deletingCarId: null,
    error: ""
  }),
  actions: {
    async fetchCars() {
      this.isLoading = true;
      this.error = "";
      try {
        const response = await apiClient.get<Car[]>("/cars/my");
        this.cars = response.data;
      } catch (error: unknown) {
        this.error = parseApiError(error);
      } finally {
        this.isLoading = false;
      }
    },

    async createCar(payload: CreateCarPayload) {
      this.isCreating = true;
      this.error = "";
      try {
        const response = await apiClient.post<Car>("/cars", payload);
        this.cars = [response.data, ...this.cars];
      } catch (error: unknown) {
        this.error = parseApiError(error);
        throw error;
      } finally {
        this.isCreating = false;
      }
    },

    async deleteCar(carId: string) {
      this.deletingCarId = carId;
      this.error = "";
      try {
        await apiClient.delete(`/cars/${carId}`);
        this.cars = this.cars.filter((car) => car.id !== carId);
      } catch (error: unknown) {
        this.error = parseApiError(error);
      } finally {
        this.deletingCarId = null;
      }
    }
  }
});
