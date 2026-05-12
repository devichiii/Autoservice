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
  successMessage: string;
};

export const useCarsStore = defineStore("cars", {
  state: (): CarsState => ({
    cars: [],
    isLoading: false,
    isCreating: false,
    deletingCarId: null,
    error: "",
    successMessage: ""
  }),
  actions: {
    async fetchCars() {
      this.isLoading = true;
      this.error = "";
      this.successMessage = "";
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
      this.successMessage = "";
      try {
        const response = await apiClient.post<Car>("/cars", payload);
        this.cars = [response.data, ...this.cars];
        this.successMessage = "Автомобиль добавлен.";
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
      this.successMessage = "";
      try {
        await apiClient.delete(`/cars/${carId}`);
        this.cars = this.cars.filter((car) => car.id !== carId);
        this.successMessage = "Автомобиль удален.";
      } catch (error: unknown) {
        this.error = parseApiErrorMessage(
          error,
          "Нельзя удалить автомобиль, потому что по нему есть записи на обслуживание."
        );
      } finally {
        this.deletingCarId = null;
      }
    }
  }
});
