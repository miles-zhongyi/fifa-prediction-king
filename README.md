# FIFA Prediction King

A simple full-stack FIFA match prediction game built with Next.js, Prisma, SQLite, and Zod.

## Features

- Username-based identity (no authentication)
- One prediction per user per match
- Match listing with prediction submission
- Leaderboard with stage-weighted scoring (Group 1 → Final 5)

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- Zod validation

## Getting Started

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard.

| Page | Route |
|------|-------|
| Dashboard | `/` |
| Match details | `/matches/[id]` |
| Leaderboard | `/leaderboard` |
| Admin | `/admin` |

Set `ADMIN_PASSWORD` in `.env` to access the admin panel.

## Prediction Rules

- Submit `username`, `matchId`, and `predictedWinner` to `POST /api/predictions`
- Unknown usernames are created automatically
- One prediction per user per match (re-submitting updates the existing pick)
- `predictedWinner` must be either `homeTeam` or `awayTeam`
- Predictions are rejected when server time is at or after `match.startTime`

## Scoring

Points are computed at request time from predictions and finished matches (never stored):

| Stage | Points |
|-------|--------|
| Group stage | 1 |
| Round of 16 | 2 |
| Quarterfinal | 3 |
| Semifinal | 4 |
| Final | 5 |

Tied players share the same rank (competition ranking: 1, 1, 3…).

Run tests with `npm test`.

## Database Scripts

- `npm run db:generate` — generate Prisma client
- `npm run db:migrate` — run migrations
- `npm run db:seed` — seed sample data
- `npm run db:studio` — open Prisma Studio

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Register username |
| GET | `/api/users/[username]` | Get user with predictions |
| GET | `/api/matches` | List matches |
| GET | `/api/matches/[id]` | Get match details |
| GET | `/api/admin/matches` | List matches (admin, `x-admin-password` header) |
| POST | `/api/admin/matches` | Create match (admin) |
| PATCH | `/api/admin/matches/[id]` | Update match (admin) |
| POST | `/api/admin/matches/[id]/complete` | Set winner and mark finished (admin) |
| GET | `/api/predictions` | List predictions (`?username=&matchId=`) |
| POST | `/api/predictions` | Submit prediction (create or update) |
| PATCH | `/api/predictions/[id]` | Update prediction |
| DELETE | `/api/predictions/[id]?username=` | Delete prediction |
| GET | `/api/leaderboard` | Leaderboard standings |

## Data Model

- **User** — unique `username`
- **Match** — `homeTeam`, `awayTeam`, `stage`, `startTime`, `winner`, `status`
- **Prediction** — unique per `(userId, matchId)`
