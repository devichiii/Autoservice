# Implementation Roadmap

## Stage 1 - Foundation

- Setup monorepo standards, linting, formatting, and CI skeleton.
- Add MySQL integration and migration tool selection (Prisma or TypeORM).
- Implement auth and RBAC foundation with production-grade guards and policies.

## Stage 2 - Client workflow

- Car management for CLIENT role.
- Booking creation with slot reservation and conflict protection.
- Client dashboard for upcoming and past appointments.

## Stage 3 - Operations workflow

- MANAGER queue with status transitions and reason tracking.
- ADMIN service catalog and schedule management.
- Notification pipeline (in-app + Telegram dispatch).

## Stage 4 - Governance and analytics

- SUPER_ADMIN role assignment and system settings.
- Audit logs and privileged action tracking.
- Analytics endpoints and dashboard widgets.

## Stage 5 - Hardening

- E2E tests for critical booking scenarios.
- Rate limiting, token rotation, and security headers.
- Observability: request logs, errors, and business metrics.
