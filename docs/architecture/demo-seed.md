# Локальные демо-данные (`prisma db seed`)

Скрипт: `apps/api/prisma/seed.ts`.

После выполнения в БД появляются:

- строки ролей `CLIENT`, `MANAGER`, `ADMIN`, `SUPER_ADMIN`;
- четыре **демо-пользователя** с заранее известным паролем (только для локальной среды);
- три **услуги** (активные);
- две **машины** у демо-клиента;
- три **booking** разных статусов и при необходимости строки истории статусов/уведомления.

Команды:

```bash
npm run prisma:seed -w @autoservice/api
```

Полное пересоздание данных в Docker MySQL можно сделать после `migrate` согласно `README`; для перезаполнения только сида достаточно повторить команду выше (идемпотентно по email, title услуги, VIN; демо-записи с меткой `[demo-seed]` пересоздаются).

## Демо-аккаунты

| Email | Роль | Пароль |
|--------|------|--------|
| demo.client@autoservice.local | CLIENT | `Password123!` |
| demo.manager@autoservice.local | MANAGER | `Password123!` |
| demo.admin@autoservice.local | ADMIN | `Password123!` |
| demo.superadmin@autoservice.local | SUPER_ADMIN | `Password123!` |

**Не использовать эти пароли вне локальной машины.**

## Проверки вручную

1. В DBeaver: таблицы `Role`, `User`, `UserRole`, `Service`, `Car`, `Booking`, при необходимости `BookingStatusHistory`, `Notification`.
2. Вход на фронте под `demo.client@autoservice.local` и под админским аккаунтом для `/admin/*`.
