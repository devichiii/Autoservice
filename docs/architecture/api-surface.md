# API Surface (v1)

Base URL: `/api/v1`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

## Cars (CLIENT+)

- `GET /cars`
- `POST /cars`
- `PATCH /cars/:id`
- `DELETE /cars/:id`

## Services (ADMIN+ read/write, CLIENT+ read)

- `GET /services`
- `POST /services`
- `PATCH /services/:id`
- `DELETE /services/:id`

## Schedule

- `GET /schedule/slots`
- `POST /schedule/slots` (ADMIN+)
- `PATCH /schedule/slots/:id` (ADMIN+)
- `POST /schedule/slots/:id/block` (ADMIN+)

## Bookings

- `GET /bookings` (scope by role)
- `POST /bookings` (CLIENT)
- `GET /bookings/:id`
- `PATCH /bookings/:id/status` (MANAGER+)
- `PATCH /bookings/:id/cancel` (CLIENT or MANAGER+ by policy)

## Users and roles (ADMIN+ / SUPER_ADMIN)

- `GET /users`
- `PATCH /users/:id`
- `POST /users/:id/roles` (SUPER_ADMIN)
- `DELETE /users/:id/roles/:roleCode` (SUPER_ADMIN)

## Notifications

- `GET /notifications/me`
- `POST /notifications/test` (ADMIN+)

## Analytics (ADMIN+)

- `GET /analytics/dashboard`
- `GET /analytics/bookings`

## Integrations — Telegram (internal, не для публичного клиента)

Все маршруты под префиксом `/integrations/telegram`. Доступ только с заголовком `x-telegram-api-key`, значение совпадает с env `TELEGRAM_BOT_API_KEY` на backend. Без ключа — `401`.

- `GET /integrations/telegram/health` — проверка, что internal-слой поднят.
- `GET /integrations/telegram/pending?limit=` — очередь уведомлений со статусом доставки `PENDING` (лимит `1..100`, по умолчанию `20`), вместе с краткой информацией о пользователе.
- `PATCH /integrations/telegram/notifications/:id/delivered` — пометить уведомление доставленным (идемпотентно, если уже `DELIVERED`).
- `PATCH /integrations/telegram/notifications/:id/failed` — тело `{ "reason": "..." }`, статус `FAILED` (опционально для отладки; при ошибке Telegram-по умолчанию запись может оставаться в `PENDING`).
- `POST /integrations/telegram/test`, `POST /integrations/telegram/notify` — тестовое создание записей уведомлений (использовать аккуратно).
