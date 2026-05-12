# Локальные demo-данные (dev)

Этот документ описывает, как подготовить локальные демонстрационные данные для проекта.

> Важно: данные и пароли ниже предназначены только для локальной разработки/демо.

## 1) Сброс локальной БД

Команда полностью очищает локальную базу данных и пересоздает структуру.

```bash
npm run prisma:migrate:reset -w @autoservice/api -- --force
```

Что делает reset:
- удаляет локальные данные в текущей dev БД;
- заново применяет миграции;
- запускает seed (если настроен).

## 2) Применение миграций (без полного reset)

Если нужно просто подтянуть новые миграции:

```bash
npm run prisma:migrate:dev -w @autoservice/api
```

## 3) Запуск seed отдельно

```bash
npm run prisma:seed -w @autoservice/api
```

Seed выполняется идемпотентно настолько, насколько это разумно для demo-сценария:
- роли и пользователи обновляются/создаются без дублирования;
- машины, услуги и demo booking записи не должны размножаться при повторном запуске.

## 4) Демо-аккаунты (только локально)

- `client@example.com` / `Password123!`
- `client2@example.com` / `Password123!`
- `manager@example.com` / `Password123!`
- `admin@example.com` / `Password123!`
- `superadmin@example.com` / `Password123!`

## 5) Что проверять после seed

- CLIENT видит только свои машины и свои booking.
- ADMIN/SUPER_ADMIN видят admin-разделы и demo-данные.
- `/admin/bookings`, `/admin/users`, `/admin/analytics` не пустые.
