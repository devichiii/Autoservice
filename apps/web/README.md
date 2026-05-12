# Frontend (`apps/web`)

Stage 12: foundation на Vue 3 + Pinia + Vue Router + Tailwind + Axios.

## Что реализовано

- Базовая структура: `app/pages/shared/entities/features/widgets`.
- Общий Axios client (`baseURL` из env, Bearer token, обработка `401`).
- Pinia auth store: `login`, `logout`, `me`, `hydrate`, `isAuthenticated`.
- Router и route guard для protected страниц.
- Минимальный dark layout с навигацией.
- Базовые страницы:
  - `/login`
  - `/dashboard`
  - `/cars`
  - `/services`
  - `/bookings`
- Cars UI foundation:
  - список машин (`GET /cars/my`);
  - создание машины (`POST /cars`);
  - удаление машины (`DELETE /cars/:id`);
  - empty/loading/error состояния.
- Bookings UI foundation:
  - список услуг (`GET /services`);
  - слоты по услуге и дате (`GET /schedule/available-slots`);
  - создание записи (`POST /bookings`);
  - список своих записей (`GET /bookings/my`);
  - отмена записи (`PATCH /bookings/:id/cancel`);
  - реактивное обновление без перезагрузки страницы.

## Локальный запуск

Из корня проекта:

```bash
npm install
npm run dev -w @autoservice/web
```

## Env

Создайте `apps/web/.env` по примеру `apps/web/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```
