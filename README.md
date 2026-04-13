# Backend Boilerplate

Node.js + Express + PostgreSQL starter with Prisma:

- validated environment config
- reusable logger and request logging
- centralized error handling
- auth with register, login, refresh, logout, and role guards
- Prisma schema, generated client, and auth-ready models

## Scripts

- `npm run dev`
- `npm start`
- `npm run format`

## Setup

1. Copy `.env.example` to `.env`.
2. Update `DATABASE_URL` and JWT secrets.
3. Make sure PostgreSQL is running.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:push` for a quick schema sync or `npm run prisma:migrate` for migrations.
6. Start the app with `npm run dev`.

## API

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Access tokens are returned in JSON. Refresh tokens are also set as an `httpOnly` cookie.
