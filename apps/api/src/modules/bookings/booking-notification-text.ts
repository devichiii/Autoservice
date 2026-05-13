import { BookingStatus } from "@prisma/client";

/** Дата/время для текста уведомлений (соответствует бизнес-часам в BookingsService, UTC+3). */
export const BOOKING_NOTICE_TIMEZONE = "Europe/Moscow";

/** Подписи статуса для операторских уведомлений в Telegram/UI. */
const BOOKING_STATUS_RU: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: "ожидает подтверждения",
  [BookingStatus.CONFIRMED]: "подтверждена",
  [BookingStatus.IN_PROGRESS]: "в работе",
  [BookingStatus.COMPLETED]: "завершена",
  [BookingStatus.CANCELED]: "отменена"
};

export function bookingStatusLabelRu(status: BookingStatus): string {
  return BOOKING_STATUS_RU[status] ?? status;
}

function formatWhen(isoLike: Date | string): string {
  const d = typeof isoLike === "string" ? new Date(isoLike) : isoLike;
  return d.toLocaleString("ru-RU", {
    timeZone: BOOKING_NOTICE_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short"
  });
}

export function carLabel(brand: string, model: string): string {
  return `${brand} ${model}`.trim();
}

export type BookingNoticeContext = {
  bookingId: string;
  scheduledAt: Date;
  serviceTitle: string;
  carBrand: string;
  carModel: string;
};

/** Уведомление о создании записи (тип BOOKING_CREATED). */
export function buildBookingCreatedNotice(ctx: BookingNoticeContext): { title: string; message: string } {
  const title = "Новая запись создана";
  const message =
    [`Запись #${ctx.bookingId}`, `Услуга: ${ctx.serviceTitle}`, `Авто: ${carLabel(ctx.carBrand, ctx.carModel)}`, `Дата и время: ${formatWhen(ctx.scheduledAt)}`, `Статус: ${bookingStatusLabelRu(BookingStatus.PENDING)}`, "Дальше: клиент может отслеживать запись в личном кабинете."].join(
      "\n"
    );

  return { title, message };
}

/** Изменение статуса записи или отмена (BOOKING_STATUS_CHANGED). */
export function buildBookingStatusChangedNotice(params: BookingNoticeContext & { fromStatus: BookingStatus; toStatus: BookingStatus }) {
  const isCancel = params.toStatus === BookingStatus.CANCELED;
  const title = isCancel ? "Запись отменена" : "Статус записи изменён";

  const action = isCancel
    ? "Запись отменена."
    : `Переход: ${bookingStatusLabelRu(params.fromStatus)} → ${bookingStatusLabelRu(params.toStatus)}.`;

  const message =
    [
      `Запись #${params.bookingId}`,
      action,
      `Услуга: ${params.serviceTitle}`,
      `Авто: ${carLabel(params.carBrand, params.carModel)}`,
      `Дата и время: ${formatWhen(params.scheduledAt)}`,
      `Текущий статус: ${bookingStatusLabelRu(params.toStatus)}`
    ].join("\n");

  return { title, message };
}
