# AutoService Platform

Production-style monorepo for a local auto repair business web application.

## Stack

- Frontend: Vue 3, Pinia, Vue Router, TailwindCSS, Axios
- Backend: Node.js, NestJS, REST API, JWT, RBAC
- Database: MySQL
- Bot: Python (Telegram), backend integration through REST API

## Repository structure

- `apps/web` - client and admin UI
- `apps/api` - backend API and business logic
- `apps/telegram-bot` - Telegram integration layer
- `packages/shared-types` - shared contracts and enums
- `infra` - Docker, nginx, database setup
- `docs/architecture` - architecture decisions and domain model

## Where architecture is formed

Architecture is defined in:

- `docs/architecture/system-design.md`
- `docs/architecture/domain-model.md`
- `docs/architecture/api-surface.md`
- `docs/architecture/changes-log.md`

Implementation follows these documents from the first commit to keep code and design aligned.

## Quick start (frontend)

```bash
npm install
npm run dev -w @autoservice/web
```

Frontend uses:

`VITE_API_BASE_URL=http://localhost:3000/api/v1`

## Demo seed (local login)

After migrating the API database, run seed to create roles, demo users, services, cars and sample bookings:

```bash
npm run prisma:seed -w @autoservice/api
```

Details and account table: `docs/architecture/demo-seed.md` (Russian).
