# API App

NestJS REST API for AutoService Platform.

## Priorities

- JWT authentication
- Role-based access control (CLIENT, MANAGER, ADMIN, SUPER_ADMIN)
- Booking lifecycle and status transitions
- Slot and schedule management
- Audit log for privileged actions

## Start (after dependency installation)

- `npm run start:dev`

## Next implementation steps

1. Replace placeholder `JwtAuthGuard` with Passport JWT strategy.
2. Add MySQL ORM layer (Prisma or TypeORM) with migrations.
3. Implement auth flows (`register`, `login`, `refresh`, `logout`).
4. Implement policies for resource ownership (client-specific data).
