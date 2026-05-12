# AutoService Platform

AutoService Platform — production-style fullstack проект для локальной автомастерской с клиентскими и административными сценариями.

## Цель проекта

- Показать практический fullstack-подход: от доменной модели и RBAC до UX и demo-окружения.
- Обеспечить воспроизводимый локальный запуск для разработки, демо и портфолио-показа.

## Технологический стек

- Frontend: Vue 3, Pinia, Vue Router, TailwindCSS, Axios.
- Backend: Node.js, NestJS, TypeScript, REST API, JWT, RBAC.
- ORM и БД: Prisma + MySQL.
- Инфраструктура: Docker Compose (локально для MySQL).
- Telegram integration layer: Python + aiogram (через backend API, без прямого доступа к БД).

## Основные возможности

- Аутентификация и сессии: `register/login/me/refresh/logout`.
- Роли и доступ: `CLIENT`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`.
- Клиентские модули: автомобили, услуги, создание/просмотр/отмена записей.
- Админские модули: управление записями, пользователями/ролями, аналитика.
- Уведомления и базовый integration flow для Telegram через backend.
- Demo seed для воспроизводимого локального окружения.

## Роли пользователей

- `CLIENT`: работает со своими машинами и своими booking.
- `MANAGER`: операционные действия с booking по политике доступа.
- `ADMIN`: admin UI (bookings/users/analytics).
- `SUPER_ADMIN`: расширенное администрирование и управление ролями.

## Архитектура (высокий уровень)

- `apps/web` общается только с `apps/api` по REST (`/api/v1`).
- `apps/api` содержит бизнес-логику и доступ к БД через Prisma.
- MySQL запускается локально в Docker.
- `apps/telegram-bot` взаимодействует с backend API и не обращается к БД напрямую.

Подробные документы:

- `docs/architecture/system-design.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/api-surface.md`
- `docs/architecture/changes-log.md`
- `docs/architecture/demo-seed.md`
- `docs/architecture/local-setup.md`

## Структура репозитория

- `apps/api` — backend API и доменная логика.
- `apps/web` — frontend (client/admin интерфейсы).
- `apps/telegram-bot` — Telegram integration слой.
- `infra/docker` — docker-compose для локальной инфраструктуры.
- `docs/architecture` — публичная архитектурная документация.
- `.internal` — внутренние правила/процессы (не коммитится).
- `.learning-notes` — учебные заметки (не коммитится).

## Требования для запуска

- Node.js 20+ и npm.
- Docker Desktop (или совместимый Docker Engine).
- Свободные порты:
  - `3306` для MySQL,
  - `3000` для backend API,
  - `5173` для frontend.

## Локальный запуск (пошагово)

### 1) Установка зависимостей

```bash
npm install
```

### 2) Запуск MySQL через Docker

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

### 3) Подготовка переменных окружения

Создай локальные файлы:

- `apps/api/.env` на основе `apps/api/.env.example`
- `apps/web/.env` на основе `apps/web/.env.example`
- (опционально) `apps/telegram-bot/.env` на основе `apps/telegram-bot/.env.example`

Важно:

- `.env` не коммитится.
- В `.env.example` только шаблонные значения без реальных секретов.

### 4) Prisma migrations

Применить миграции:

```bash
npm run prisma:migrate:dev -w @autoservice/api
```

Сбросить локальную БД (удаляет локальные данные и запускает seed):

```bash
npm run prisma:migrate:reset -w @autoservice/api -- --force
```

### 5) Prisma seed

Запуск seed отдельно:

```bash
npm run prisma:seed -w @autoservice/api
```

Seed нужен для создания воспроизводимых demo/dev данных (роли, пользователи, машины, услуги, booking, базовые уведомления).

### 6) Запуск backend

```bash
npm run start:dev -w @autoservice/api
```

### 7) Запуск frontend

```bash
npm run dev -w @autoservice/web
```

После запуска:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api/v1`

## Demo accounts (только для локального demo/dev)

Эти учетные записи предназначены только для локальной разработки и демонстрации.

| Email | Password | Role | Назначение |
|---|---|---|---|
| `client@example.com` | `Password123!` | `CLIENT` | Базовый клиентский сценарий |
| `client2@example.com` | `Password123!` | `CLIENT` | Проверка data isolation между клиентами |
| `manager@example.com` | `Password123!` | `MANAGER` | Операционный сценарий управления записями |
| `admin@example.com` | `Password123!` | `ADMIN` | Проверка admin routes и модулей |
| `superadmin@example.com` | `Password123!` | `SUPER_ADMIN` | Расширенный админ/RBAC сценарий |

## Основные маршруты web-приложения

- Клиентские:
  - `/dashboard`
  - `/cars`
  - `/services`
  - `/bookings`
  - `/notifications`
- Админские:
  - `/admin/bookings`
  - `/admin/users`
  - `/admin/analytics`

## Короткие demo-сценарии

### CLIENT

1. Логин под `client@example.com`.
2. Проверить список автомобилей (`/cars`).
3. Проверить список услуг (`/services`).
4. Создать booking (`/bookings`).
5. Проверить, что в списке видны только свои booking.
6. Проверить уведомления (`/notifications`).

### ADMIN / SUPER_ADMIN

1. Логин под `admin@example.com` или `superadmin@example.com`.
2. Открыть `/admin/bookings` и проверить наличие demo данных.
3. Изменить статус booking.
4. Открыть `/admin/users` и проверить demo пользователей.
5. Открыть `/admin/analytics` и проверить метрики.

## Как понять, что всё работает

- MySQL контейнер запущен (`docker ps`).
- Миграции и seed завершаются без ошибок.
- Backend отвечает на API-запросы.
- Frontend открывается и позволяет пройти client/admin сценарии.

## Важные ограничения

- Не коммитить: `.env`, `.internal`, `.learning-notes`.
- Не использовать demo credentials вне локальной среды.
- `prisma:migrate:reset` удаляет локальные данные текущей dev БД.
- Telegram bot logic не требуется для базового web/api demo-сценария.

## Roadmap (кратко)

- Улучшение observability и monitoring сценариев.
- Расширение E2E/smoke automation.
- Дальнейшая стабилизация UX и документации для handoff.
