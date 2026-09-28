# Architecture

## Runtime

The application is a Next.js App Router server backed by PostgreSQL through Prisma. Docker Compose runs the app and database locally. On app startup, Prisma applies checked-in migrations, the idempotent seed runs, and then the Next.js server starts.

## Request flow

Implemented protected API routes call `requireUser()` or `requireRole()` from `src/lib/permissions.ts`. Those helpers resolve the httpOnly session cookie through `src/lib/auth.ts`; persistent reads and writes use the shared Prisma client in `src/lib/db.ts`. Sensitive auth and denied-access events write through `src/lib/audit.ts`.

Implemented route groups are:

- `/api/auth/*`: signup, login, logout, and session inspection.
- `/api/me`: current authenticated user.
- `/api/health`: database connectivity status.
- `/api/admin` and `/api/organizer`: role-protected access checks.

This document describes the current foundation only. Team management, submissions, gallery, and judging workflows are not implemented here.
