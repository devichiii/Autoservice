# Changes Log

## 2026-05-10 - Changeset 002 (Foundation stabilization: auth + prisma)

Scope: `C:\Desktop\Projects\Autoservice`

- Added Prisma migrations scaffold and initial SQL migration under `apps/api/prisma/migrations`.
- Added role seed script for `CLIENT`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` with idempotent upsert.
- Extended auth flow with `POST /auth/refresh` and `POST /auth/logout`.
- Added refresh token hash persistence on user model (`refreshTokenHash`) with rotation on login/register/refresh.

## 2026-05-10 - Changeset 001 (Stage 1 foundation)

Scope: `C:\Desktop\Projects\Autoservice`

- Added workspace root `package.json` for unified app commands.
- Upgraded API dependencies for `Prisma`, `argon2`, and JWT-ready auth flow.
- Added global Prisma module/service and graceful shutdown hooks.
- Replaced placeholder auth with DTO-based `register`, `login`, and `me`.
- Added `JwtStrategy`, Passport-based `JwtAuthGuard`, and role hierarchy checks.
- Added `UsersService` with role assignment on client registration.
- Added initial production domain schema in `apps/api/prisma/schema.prisma`.
- Extended environment template with `DATABASE_URL`.

## Marking convention

Each major implementation batch is added as a new `Changeset` section with date and scope.
