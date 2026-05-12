import { defineStore } from "pinia";
import { apiClient } from "../shared/api-client";
import { parseApiErrorMessage } from "../shared/api-error";
import type { Car, CreateCarPayload } from "./cars.types";

type CarsState = {
  cars: Car[];
  isLoading: boolean;
  isCreating: boolean;
  deletingCarId: string | null;
  error: string;
};

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
        this.error = parseApiErrorMessage(error);
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
        this.error = parseApiErrorMessage(error);
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
        this.error = parseApiErrorMessage(error);
      } finally {
        this.deletingCarId = null;
      }
    }
  }
});
