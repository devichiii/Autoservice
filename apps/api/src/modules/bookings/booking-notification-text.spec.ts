import { BookingStatus } from "@prisma/client";
import { buildBookingCreatedNotice, buildBookingStatusChangedNotice } from "./booking-notification-text";

describe("booking-notification-text", () => {
  const ctx = {
    bookingId: "bk_test_1",
    scheduledAt: new Date("2026-06-01T10:30:00.000Z"),
    serviceTitle: "Замена масла",
    carBrand: "Toyota",
    carModel: "Camry"
  };

  it("buildBookingCreatedNotice содержит услугу, авто и статус человекочитаемо", () => {
    const { title, message } = buildBookingCreatedNotice(ctx);
    expect(title).toBe("Новая запись создана");
    expect(message).toContain(ctx.bookingId);
    expect(message).toContain(ctx.serviceTitle);
    expect(message).toContain("Toyota");
    expect(message).toContain("Camry");
    expect(message).toContain("ожидает подтверждения");
  });

  it("buildBookingStatusChangedNotice отражает смену статуса человекочитаемо", () => {
    const { title, message } = buildBookingStatusChangedNotice({
      ...ctx,
      fromStatus: BookingStatus.PENDING,
      toStatus: BookingStatus.CONFIRMED
    });
    expect(title).toBe("Статус записи изменён");
    expect(message).toContain("ожидает подтверждения");
    expect(message).toContain("подтверждена");
    expect(message).toContain(ctx.serviceTitle);
  });

  it("отмена даёт заголовок «Запись отменена»", () => {
    const { title, message } = buildBookingStatusChangedNotice({
      ...ctx,
      fromStatus: BookingStatus.CONFIRMED,
      toStatus: BookingStatus.CANCELED
    });
    expect(title).toBe("Запись отменена");
    expect(message).toContain("Текущий статус: отменена");
  });
});
