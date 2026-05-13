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

- `GET /bookings` (`MANAGER+`, все записи)
- `POST /bookings` (JWT; запись текущего пользователя)
- `GET /bookings/my` (JWT; только свои записи)
- `GET /bookings/:id` (своя запись или `MANAGER+`)
- `GET /bookings/:id/history` (своя запись или `MANAGER+`)
- `PATCH /bookings/:id/status` (`MANAGER+`; допустимые переходы валидируются на сервере, при нарушении — `409`)
- `PATCH /bookings/:id/cancel` (JWT; отмена только **своей** записи; при недопустимом статусе — `409`)

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
