# Dogfood Hackathon Portal

A self-hosted, offline-first hackathon submission and judging portal for 72-hour events. The stack is Next.js + TypeScript, Prisma, PostgreSQL, and Docker Compose.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies: `npm ci`
3. Start the portal locally: `npm run dev`
4. Or run the full stack in Docker: `docker compose up --build`

## Seeded accounts

The seed prints these login details to the app logs at startup.

| Email                        | Password              | Role        |
| ---------------------------- | --------------------- | ----------- |
| `admin@dogfood.local`        | `AdminPass123!`       | ADMIN       |
| `organizer@dogfood.local`    | `OrganizerPass123!`   | ORGANIZER   |
| `judge1@dogfood.local`       | `JudgePass123!`       | JUDGE       |
| `participant1@dogfood.local` | `ParticipantPass123!` | PARTICIPANT |

## Docker workflow

The app container runs `prisma migrate deploy`, then the seed script, before starting Next.js. PostgreSQL runs in the `db` service and persists data in a named Docker volume.

## Implemented endpoints

- `GET /api/health` checks database connectivity.
- `POST /api/auth/signup`, `POST /api/auth/login`, and `POST /api/auth/logout` manage email/password sessions.
- `GET /api/auth/session` and `GET /api/me` return the current session user.
- `GET /api/admin` is restricted to ADMIN; `GET /api/organizer` is restricted to ORGANIZER.

See [ARCHITECTURE.md](ARCHITECTURE.md) and [DATA-MODEL.md](DATA-MODEL.md) for the current implementation boundaries.

## Default roles

- `ADMIN`
- `ORGANIZER`
- `JUDGE`
- `PARTICIPANT`

## Security model

- Email/password authentication with `bcryptjs`
- Session tokens stored in secure `httpOnly` cookies
- Backend authorization enforced through the `requireRole()` and `requireUser()` helpers
- All sensitive actions are logged into `AuditLog`
