# Локальный запуск и demo flow

Краткий публичный guide для локального запуска AutoService Platform.

## 1) Установка зависимостей

```bash
npm install
```

## 2) Запуск MySQL

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

## 3) Подготовка `.env`

Создать локальные файлы:

- `apps/api/.env` из `apps/api/.env.example`
- `apps/web/.env` из `apps/web/.env.example`
- (опционально) `apps/telegram-bot/.env` из `apps/telegram-bot/.env.example`

Важно: `.env` не коммитить.

## 4) Prisma: миграции и seed

Применить миграции:

```bash
npm run prisma:migrate:dev -w @autoservice/api
```

Сбросить dev БД (удаляет локальные данные, затем запускает seed):

```bash
npm run prisma:migrate:reset -w @autoservice/api -- --force
```

Запустить seed отдельно:

```bash
npm run prisma:seed -w @autoservice/api
```

## 5) Запуск приложений

Backend:

```bash
npm run start:dev -w @autoservice/api
```

Frontend:

```bash
npm run dev -w @autoservice/web
```

## 6) Проверка demo-сценария

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/v1`

Проверить:

- клиентские маршруты: `/dashboard`, `/cars`, `/services`, `/bookings`, `/notifications`;
- админские маршруты: `/admin/bookings`, `/admin/users`, `/admin/analytics`.

Демо-аккаунты и детали seed описаны в `README.md` и `docs/architecture/demo-seed.md`.
