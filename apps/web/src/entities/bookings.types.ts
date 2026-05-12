export type ServiceItem = {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CarItem = {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number | null;
  vin: string | null;
  plateNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleSlot = {
  startsAt: string;
  endsAt: string;
};

export type ScheduleResponse = {
  date: string;
  serviceId: string;
  durationMinutes: number;
  workingHours: {
    startsAt: string;
    endsAt: string;
  };
  slots: ScheduleSlot[];
};

export type BookingStatus = "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED";

export type BookingItem = {
  id: string;
  userId: string;
  carId: string;
  serviceId: string;
  scheduledAt: string;
  endTime: string;
  status: BookingStatus;
  comment: string | null;
  statusComment: string | null;
  createdAt: string;
  updatedAt: string;
  car: CarItem;
  service: ServiceItem;
};

export type CreateBookingPayload = {
  carId: string;
  serviceId: string;
  scheduledAt: string;
  comment?: string;
};
