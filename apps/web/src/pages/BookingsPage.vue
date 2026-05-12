<script setup lang="ts">
import { onMounted, reactive, watch } from "vue";
import { useBookingsStore } from "../entities/bookings.store";
import BookingCreateForm from "../features/bookings/components/BookingCreateForm.vue";
import MyBookingsList from "../features/bookings/components/MyBookingsList.vue";

const bookingsStore = useBookingsStore();

const form = reactive({
  carId: "",
  serviceId: "",
  date: "",
  scheduledAt: "",
  comment: ""
});
const validation = reactive({
  message: ""
});

function resetCreateForm() {
  form.scheduledAt = "";
  form.comment = "";
}

function validateForm() {
  if (!form.carId || !form.serviceId || !form.date || !form.scheduledAt) {
    return "Выберите машину, услугу, дату и слот.";
  }

  return "";
}

async function createBooking() {
  validation.message = validateForm();
  if (validation.message) {
    return;
  }

  try {
    await bookingsStore.createBooking({
      carId: form.carId,
      serviceId: form.serviceId,
      scheduledAt: form.scheduledAt,
      comment: form.comment.trim() || undefined
    });
    resetCreateForm();
    await bookingsStore.fetchSlots(form.date, form.serviceId);
  } catch {
    // Error text is already set in store.
  }
}

async function cancelBooking(bookingId: string) {
  await bookingsStore.cancelBooking(bookingId, "Canceled from web UI.");
  if (form.date && form.serviceId) {
    await bookingsStore.fetchSlots(form.date, form.serviceId);
  }
}

watch(
  () => [form.date, form.serviceId] as const,
  async ([date, serviceId]) => {
    form.scheduledAt = "";
    if (date && serviceId) {
      await bookingsStore.fetchSlots(date, serviceId);
      return;
    }
    bookingsStore.clearSlots();
  }
);

onMounted(async () => {
  await Promise.all([
    bookingsStore.fetchServices(),
    bookingsStore.fetchCars(),
    bookingsStore.fetchMyBookings()
  ]);
});
</script>

<template>
  <section class="space-y-5">
    <div>
      <h1 class="text-2xl font-semibold">Bookings</h1>
      <p class="mt-1 text-sm text-slate-400">
        Полный booking flow: service + date/slots + car -> create -> my bookings -> cancel.
      </p>
    </div>

    <article class="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <h2 class="text-lg font-medium">Услуги</h2>
      <p v-if="bookingsStore.isLoadingServices" class="mt-2 text-sm text-slate-400">
        Загружаем услуги...
      </p>
      <p v-else-if="bookingsStore.services.length === 0" class="mt-2 text-sm text-slate-400">
        Активных услуг нет.
      </p>
      <div v-else class="mt-3 grid gap-2 md:grid-cols-2">
        <article
          v-for="service in bookingsStore.services"
          :key="service.id"
          class="rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm"
        >
          <p class="font-medium">{{ service.title }}</p>
          <p class="text-slate-300">Duration: {{ service.durationMinutes }} min</p>
          <p class="text-slate-300">Price: {{ service.price }}</p>
        </article>
      </div>
    </article>

    <BookingCreateForm
      v-model="form"
      :cars="bookingsStore.cars"
      :services="bookingsStore.services"
      :slots="bookingsStore.slots"
      :is-loading-cars="bookingsStore.isLoadingCars"
      :is-loading-services="bookingsStore.isLoadingServices"
      :is-loading-slots="bookingsStore.isLoadingSlots"
      :is-creating-booking="bookingsStore.isCreatingBooking"
      :cars-error="bookingsStore.carsError"
      :services-error="bookingsStore.servicesError"
      :slots-error="bookingsStore.slotsError"
      :create-error="bookingsStore.createError"
      :validation-error="validation.message"
      @submit="createBooking"
    />

    <MyBookingsList
      :bookings="bookingsStore.myBookings"
      :is-loading="bookingsStore.isLoadingBookings"
      :error="bookingsStore.bookingsError"
      :canceling-booking-id="bookingsStore.cancelingBookingId"
      @cancel="cancelBooking"
    />
  </section>
</template>
