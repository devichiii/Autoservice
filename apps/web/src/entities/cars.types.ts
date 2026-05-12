export type Car = {
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

export type CreateCarPayload = {
  brand: string;
  model: string;
  year: number;
  vin: string;
  plateNumber?: string;
  notes?: string;
};
