# Журнал изменений

## 2026-05-10 — Changeset 001 (Stage 1: Foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Сформирована базовая структура монорепозитория (`apps`, `docs`, `infra`, `packages`).
- Поднят каркас API на NestJS и базовые модули.
- Добавлены базовые auth endpoint-ы `register/login/me`.
- Добавлены `JwtAuthGuard`, `RolesGuard`, иерархия ролей и `CurrentUser`.
- Подключен Prisma и добавлена первичная schema.

## 2026-05-10 — Changeset 002 (Stage 2: Backend foundation validation)

Область: `C:\Desktop\Projects\Autoservice`

- Подтверждены установка зависимостей, запуск MySQL через Docker и подключение Prisma.
- Применены миграции и seed ролей `CLIENT/MANAGER/ADMIN/SUPER_ADMIN`.
- Добавлен и проверен сценарий создания `SUPER_ADMIN` через env-переменные.
- Выполнен ручной smoke-check auth endpoint-ов и RBAC-поведения.

## 2026-05-10 — Changeset 003 (Stage 3: Auth hardening validation)

Область: `C:\Desktop\Projects\Autoservice`

- Подтвержден и усилен существующий refresh/logout flow без дублирования механизмов.
- Refresh token хранится только как hash (`refreshTokenHash`).
- Проверены token rotation и запрет повторного использования старого refresh token (`401`).
- Проверено, что logout инвалидирует refresh token.
- Выполнен security cleanup документации (без хранения реальных паролей/секретов).

## 2026-05-10 — Changeset 004 (Stage 4: Cars module)

Область: `C:\Desktop\Projects\Autoservice`

- Реализован backend-модуль `cars` с ownership policy.
- Добавлены endpoint-ы:
  - `POST /api/v1/cars`
  - `GET /api/v1/cars/my`
  - `GET /api/v1/cars/:id`
  - `PATCH /api/v1/cars/:id`
  - `DELETE /api/v1/cars/:id`
- Доступ к чужому автомобилю возвращает `404`.

## 2026-05-11 — Changeset 005 (Stage 5: Services module)

Область: `C:\Desktop\Projects\Autoservice`

- Реализован backend-модуль `services`.
- Публичное чтение:
  - `GET /api/v1/services`
  - `GET /api/v1/services/:id`
- Управление услугами только для `ADMIN/SUPER_ADMIN`:
  - `POST /api/v1/services`
  - `PATCH /api/v1/services/:id`
  - `DELETE /api/v1/services/:id`
- Обновлена модель `Service` и соответствующая миграция.

## 2026-05-11 — Changeset 006 (Stage 6: Bookings module)

Область: `C:\Desktop\Projects\Autoservice`

- Реализован базовый backend-модуль `bookings` без schedule engine.
- Добавлены endpoint-ы клиента:
  - `POST /api/v1/bookings`
  - `GET /api/v1/bookings/my`
  - `GET /api/v1/bookings/:id`
  - `PATCH /api/v1/bookings/:id/cancel`
- Добавлены endpoint-ы менеджмента:
  - `GET /api/v1/bookings`
  - `PATCH /api/v1/bookings/:id/status`
- Валидации:
  - booking только для автомобиля владельца токена;
  - услуга должна существовать и быть активной;
  - `userId` определяется только по JWT.
- Добавлены базовые переходы статусов и история смены статусов.

## 2026-05-11 — Changeset 007 (Stage 7: Schedule & time slots foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Добавлена валидация времени бронирования в `bookings`:
  - booking не может быть в прошлом (`400`);
  - booking должен попадать в рабочие часы автомастерской 09:00-20:00 (UTC+3);
  - `endTime` вычисляется backend-ом из `Service.durationMinutes`.
- Добавлен overlap conflict detection через Prisma-запрос:
  - пересечение интервалов (`scheduledAt < newEnd` и `endTime > newStart`) возвращает `409`.
- Для создания booking уточнены доменные ошибки:
  - неактивная услуга -> `409`;
  - чужой автомобиль -> `404`;
  - без токена -> `401`.
- Добавлен endpoint расписания:
  - `GET /api/v1/schedule/available-slots`
  - возвращает свободные интервалы по дате и услуге в рамках базовой логики.
- Обновлена схема `Booking`:
  - добавлено поле `endTime`;
  - добавлен индекс по `scheduledAt/endTime/status`;
  - добавлена миграция `20260511171500_booking_time_window_foundation`.

## 2026-05-11 — Changeset 008 (Stage 8: Booking status history & audit trail)

Область: `C:\Desktop\Projects\Autoservice`

- Усилен audit trail для `bookings` без переписывания модуля:
  - в `BookingStatusHistory` добавлен `changedByUserId` (кто выполнил смену статуса);
  - добавлена миграция `20260511174500_booking_status_history_actor`.
- При `PATCH /api/v1/bookings/:id/status` и `PATCH /api/v1/bookings/:id/cancel` история теперь сохраняется с инициатором, предыдущим и новым статусом, комментарием.
- Добавлен endpoint истории:
  - `GET /api/v1/bookings/:id/history`
  - `CLIENT` видит только свою историю;
  - `MANAGER/ADMIN/SUPER_ADMIN` видят историю всех записей.
- Уточнены правила переходов статусов:
  - `IN_PROGRESS -> CANCELED` теперь запрещен;
  - недопустимый переход возвращает `409 Conflict`.

## 2026-05-11 — Changeset 009 (Stage 9: Notifications foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Добавлен базовый foundation уведомлений в API (без Telegram, без frontend, без realtime).
- Обновлена модель `Notification`:
  - добавлены поля `type`, `title`, `message`, `isRead`, `readAt`;
  - добавлен enum `NotificationType` (`BOOKING_CREATED`, `BOOKING_STATUS_CHANGED`, `SYSTEM`);
  - добавлена миграция `20260511180500_notifications_foundation`.
- Реализован модуль уведомлений:
  - `GET /api/v1/notifications/me` — список своих уведомлений;
  - `POST /api/v1/notifications/test` — тестовое уведомление (только `ADMIN/SUPER_ADMIN`);
  - `PATCH /api/v1/notifications/:id/read` — пометка своего уведомления как прочитанного.
- Добавлена минимальная интеграция с `bookings`:
  - при создании booking создается уведомление `BOOKING_CREATED`;
  - при смене статуса booking создается уведомление `BOOKING_STATUS_CHANGED`.
- Правила безопасности сохранены:
  - без токена -> `401`;
  - недостаточно прав -> `403`;
  - чужое уведомление при чтении/пометке -> `404`.

## 2026-05-11 — Backend smoke-test (ручная валидация)

Область: `C:\Desktop\Projects\Autoservice`

- Ручной smoke-test backend пройден успешно через Postman + DBeaver:
  - `Auth`
  - `Cars`
  - `Services`
  - `Schedule`
  - `Bookings`
  - `Booking status history`
  - `Notifications`
- В ходе проверки обнаружены и исправлены дефекты:
  - `CarsController` не был подключен в `CarsModule` (роуты `cars` не маппились);
  - `POST /api/v1/cars` возвращал `201`, но не выполнял фактическое сохранение в MySQL.
- Подтверждено, что после исправлений:
  - `POST /api/v1/cars` создает запись в таблице `Car`;
  - `GET /api/v1/cars/my` возвращает созданный автомобиль;
  - ownership policy для `cars` корректно возвращает `404` на чужой ресурс.

## 2026-05-12 — Changeset 010 (Stage 10: Telegram integration foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Добавлен foundation-слой интеграции Telegram поверх backend API (без реализации полноценного Python bot workflow).
- Реализованы internal endpoint-ы:
  - `POST /api/v1/integrations/telegram/test`
  - `POST /api/v1/integrations/telegram/notify`
- Добавлена защита internal endpoint-ов по secret:
  - обязательный заголовок `x-telegram-api-key`;
  - секрет берется из `TELEGRAM_BOT_API_KEY` (env).
- Интеграция выполнена через существующий `NotificationsService`:
  - без дублирования notifications-доменной логики;
  - без прямого доступа Telegram-слоя к БД.
- Обновлены `apps/api/.env.example`, `apps/telegram-bot/.env.example`, `apps/telegram-bot/README.md` и минимальный scaffold `main.py` для тестового вызова integration endpoint.
- Границы stage сохранены:
  - без frontend/payments/analytics/realtime;
  - без переписывания auth/cars/services/bookings/schedule.

## 2026-05-12 — Changeset 011 (Stage 11 prep: Telegram bot health/env stabilization)

Область: `C:\Desktop\Projects\Autoservice`

- Добавлен internal endpoint проверки доступности интеграционного слоя:
  - `GET /api/v1/integrations/telegram/health`
  - endpoint защищен тем же `x-telegram-api-key`, что и `test/notify`.
- Обновлен Python bot scaffold:
  - `/health` переведен на internal endpoint `integrations/telegram/health` (без зависимости от JWT service token);
  - запросы к backend выполняются с `trust_env=False`, чтобы локальные вызовы `127.0.0.1` не ломались из-за глобальных proxy env.
- Уточнена конфигурация Telegram bot:
  - в `README` добавлено требование использовать реальный `User.id` для `TELEGRAM_TEST_USER_ID`;
  - очищен `.env.example` от неиспользуемого `API_BOT_TOKEN`;
  - в `requirements.txt` зафиксирован `aiohttp-socks` для proxy-сценариев.

## 2026-05-12 — Changeset 012 (Stage 11: Telegram pending + delivered flow)

Область: `C:\Desktop\Projects\Autoservice`

- Реализован внутренний flow доставки уведомлений Telegram через backend API:
  - `GET /api/v1/integrations/telegram/pending` — получить pending-уведомления;
  - `PATCH /api/v1/integrations/telegram/notifications/:id/delivered` — пометить уведомление доставленным.
- Усилен доменный слой `Notification` под доставку:
  - добавлены `deliveryStatus`, `deliveredAt`, `deliveryError`;
  - добавлена миграция `20260512065500_notification_delivery_flow`.
- Telegram bot обновлен без переноса бизнес-логики:
  - добавлена команда `/pull_pending`;
  - бот читает pending уведомления только через NestJS API;
  - после успешной отправки в Telegram бот вызывает backend endpoint `.../delivered`;
  - ошибки логируются и не останавливают обработку всей пачки.
- Границы stage сохранены:
  - без frontend/payments/websocket;
  - без прямого доступа бота к MySQL;
  - без большого рефактора существующих модулей.

## 2026-05-12 — Changeset 013 (Stage 12: Frontend foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Подготовлен frontend foundation на текущем стеке (`Vue 3 + Pinia + Vue Router + Tailwind + Axios`) без изменения backend API.
- Настроен общий API client для web:
  - `baseURL` берется из `VITE_API_BASE_URL`;
  - `Authorization: Bearer <accessToken>` добавляется автоматически;
  - базовая обработка `401` очищает сессию и возвращает пользователя на `/login`.
- Для локальной работы web -> api включен CORS в backend (`CORS_ORIGIN`, по умолчанию `http://localhost:5173`).
- Реализован `auth` store в Pinia:
  - `login`, `logout`, `me`, `hydrate`;
  - хранение `accessToken`/`refreshToken` в `localStorage`;
  - состояние текущего пользователя и `isAuthenticated`.
- Настроен router с protected route guard:
  - публичный маршрут: `/login`;
  - защищенные маршруты: `/dashboard`, `/cars`, `/services`, `/bookings`.
- Добавлен минимальный dark layout и базовые page foundation-компоненты без overengineering.
- Реализован рабочий login flow:
  - форма email/password;
  - `POST /api/v1/auth/login`;
  - `GET /api/v1/auth/me` после успешного входа;
  - переход на `/dashboard`.
- Границы stage сохранены:
  - без frontend-overbuild, без payments/deploy;
  - без изменений Telegram bot;
  - без изменения backend-контрактов.

## 2026-05-12 — Changeset 014 (Stage 13: Cars UI foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Подключен frontend к существующему Cars API без изменения backend:
  - `GET /api/v1/cars/my`
  - `POST /api/v1/cars`
  - `DELETE /api/v1/cars/:id`
- Реализован Pinia store `cars`:
  - `fetchCars`, `createCar`, `deleteCar`;
  - состояния `loading/error` и состояние удаления конкретной записи.
- Обновлена страница `/cars`:
  - список автомобилей пользователя;
  - форма создания автомобиля;
  - удаление автомобиля;
  - empty-state, loading-state, показ ошибок API/валидации.
- Добавлена минимальная frontend-валидация:
  - обязательные `brand/model/year/vin`;
  - `year` должен быть числом;
  - `vin` не может быть пустым.
- Реактивный UX без перезагрузки страницы:
  - после `create` новая запись сразу добавляется в список;
  - после `delete` запись сразу удаляется из списка.
- Границы stage сохранены:
  - без изменений backend архитектуры/auth;
  - без изменений Telegram bot;
  - без redesign и без тяжелых UI-библиотек.

## 2026-05-12 — Changeset 015 (Stage 14: Bookings UI foundation)

Область: `C:\Desktop\Projects\Autoservice`

- Реализован frontend booking flow без изменения backend API/архитектуры:
  - `GET /api/v1/services`
  - `GET /api/v1/schedule/available-slots`
  - `GET /api/v1/cars/my`
  - `POST /api/v1/bookings`
  - `GET /api/v1/bookings/my`
  - `PATCH /api/v1/bookings/:id/cancel`
- Добавлен API layer для bookings в frontend (`features/bookings/api`), чтобы page-компонент не содержал HTTP-логику.
- Добавлен Pinia store `bookings`:
  - загрузка услуг/машин/слотов/моих записей;
  - создание booking;
  - отмена booking с реактивным обновлением списка.
- Обновлена страница `/bookings`:
  - список активных услуг с `durationMinutes` и `price`;
  - форма выбора услуги, даты, слота и машины;
  - создание записи и показ ошибок/валидации;
  - список моих записей с возможностью отмены.
- Добавлены loading/empty/error состояния на всех шагах flow.
- Обработка бизнес-ошибок backend (включая `400/401/404/409`) выполнена через единый парсер API ошибок и отображение в UI.
- Границы stage сохранены:
  - без редизайна, без тяжелых UI-библиотек;
  - без изменения Telegram bot;
  - без изменения backend контрактов.

## Правило ведения

Каждый stage фиксируется отдельной секцией в хронологическом порядке.
