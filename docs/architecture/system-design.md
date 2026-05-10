# System Design

## Goal

Build a production-grade SaaS-style application for an auto service business with role-driven workflows, secure access, and operational visibility.

## High-level architecture

1. `apps/web` consumes REST API from `apps/api`.
2. `apps/telegram-bot` receives Telegram updates and calls `apps/api` endpoints.
3. `apps/api` is the single source of truth for business logic and persistence.
4. MySQL stores users, cars, bookings, schedules, statuses, and audit data.

## Core principles

- Modular backend design per bounded context.
- Thin controllers, business logic in services, persistence in repositories.
- DTO validation on every write endpoint.
- RBAC on route and resource layers.
- Auditability for privileged actions.
- Idempotent and explicit status transitions for bookings.

## Backend module map

- `auth`: registration, login, refresh token, logout.
- `users`: profile and user administration.
- `roles`: role management and assignments.
- `cars`: client car inventory.
- `services`: service catalog and pricing metadata.
- `schedule`: time slots, exceptions, work calendar.
- `bookings`: appointment lifecycle and status machine.
- `notifications`: in-app and external notifications.
- `analytics`: admin metrics.
- `audit-log`: critical action trail.

## Security baseline

- Access and refresh JWT token pair.
- Password hashing (Argon2 or bcrypt with strong cost).
- Role guards + ownership checks for client data.
- Request validation with whitelist and forbidNonWhitelisted.
- Rate limiting for auth and public endpoints.
- Structured exception filter with safe responses.

## Deployment baseline

- Local development with Docker Compose (API + MySQL + optional Redis).
- Environment variables per app with `.env.example`.
- CI with lint, unit tests, integration tests, and build verification.
