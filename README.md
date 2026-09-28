# Dogfood Hackathon Portal

A self-hosted, offline-first hackathon submission and judging portal for 72-hour events. The stack is Next.js + TypeScript, Prisma, PostgreSQL, and Docker Compose.

## Quick start

1. Copy `.env.example` to `.env`.
2. Install dependencies: `npm ci`
3. Start the portal locally: `npm run dev`
4. Or run the full stack in Docker: `docker compose up --build`

## Seeded accounts

The application seed script adds admin, organizer, judge, and participant accounts. The login information is printed to the console when the app container boots.

- Admin: `admin@dogfood.local` / `AdminPass123!`
- Organizer: `organizer@dogfood.local` / `OrganizerPass123!`
- Judge: `judge1@dogfood.local` / `JudgePass123!`
- Participant: `participant1@dogfood.local` / `ParticipantPass123!`

## Docker workflow

The app container runs Prisma schema deployment and then the seed script before starting Next.js. PostgreSQL runs in the `db` service and persists data in a named Docker volume.

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
