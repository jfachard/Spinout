# Spinout 🎡

> A social roulette app that settles the age-old question: *"So… what do we do tonight?"*

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-61DAFB?style=flat&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=flat&logo=turborepo&logoColor=white)

Spinout lets a group of friends spin a wheel that suggests an activity based on their shared preferences and chosen categories. Everyone votes yes or no in real time — majority wins. No more endless debates.

---

## Features

- **Session-based rooms** — create a session and share a link or 6-character code, no account required
- **Guest & account support** — join as a guest or sign up to save preferences and session history
- **Smart roulette** — suggestions are filtered by selected categories and each member's liked/disliked tags
- **Real-time voting** — all votes are cast simultaneously and results appear live for everyone
- **Re-spin on rejection** — if the group says no, spin again instantly
- **Session history** — see every activity that was proposed, accepted, or rejected during a session
- **QR code join** — mobile users can scan a QR code to join instantly

---

## Tech Stack

### Web
- [Next.js 15](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS

### Mobile
- [Expo](https://expo.dev/) (React Native)
- TypeScript
- NativeWind

### API
- [NestJS](https://nestjs.com/)
- [Socket.io](https://socket.io/) — real-time events (lobby + session)
- [Prisma 7](https://www.prisma.io/) ORM
- [PostgreSQL](https://www.postgresql.org/) (Supabase)
- JWT authentication

### Monorepo
- npm workspaces
- [Turborepo](https://turbo.build/)
- `@spinout/shared` — shared TypeScript types and Socket.io event constants

---

## Project Structure

```
spinout/
├── apps/
│   ├── web/          # Next.js App Router
│   ├── mobile/       # Expo React Native
│   └── api/          # NestJS + Socket.io
├── packages/
│   └── shared/       # Shared types & event names
├── turbo.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- A [Supabase](https://supabase.com/) project (PostgreSQL)

### Installation

```bash
# Clone the repo
git clone https://github.com/jfachard/Spinout.git
cd Spinout

# Install all dependencies
npm install
```

### Environment variables

Create `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
JWT_SECRET="your-jwt-secret"
```

### Database setup

```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### Run in development

```bash
# From the root — starts all apps in parallel
npm run dev
```

Or individually:

```bash
# API (port 3001)
cd apps/api && npm run start:dev

# Web (port 3000)
cd apps/web && npm run dev

# Mobile
cd apps/mobile && npx expo start
```

---

## Socket.io Events

| Phase | Event | Direction | Description |
|-------|-------|-----------|-------------|
| Lobby | `lobby:join` | client → server | Join a session room |
| Lobby | `lobby:joined` | server → client | Receive session state |
| Lobby | `lobby:member_joined` | server → all | Broadcast new member |
| Lobby | `lobby:set_prefs` | client → server | Set categories & tags |
| Lobby | `lobby:pref_updated` | server → all | Broadcast preference update |
| Lobby | `lobby:start` | client → server | Start session (host only) |
| Session | `session:spin` | client → server | Trigger a spin (host only) |
| Session | `session:activity` | server → all | Broadcast proposed activity |
| Session | `session:vote` | client → server | Cast a vote |
| Session | `session:vote_update` | server → all | Live vote count update |
| Session | `session:vote_result` | server → all | Final vote result |
| Session | `session:close` | client → server | End session (host only) |
| Session | `session:closed` | server → all | Session ended with history |

---

## Database Schema

7 models: `User`, `Session`, `SessionMember`, `Preference`, `Activity`, `Spin`, `Vote`

Key design decisions:
- `SessionMember` unifies authenticated users and guests under a single model
- `Preference` is scoped to a member (not a user) — tastes are session-specific
- `Spin` records every proposal for history and to avoid re-suggesting rejected activities

---

## Deployment

| App | Platform |
|-----|----------|
| Web | [Vercel](https://vercel.com/) |
| API | [Railway](https://railway.app/) |
| Mobile | Expo Go / EAS Build |
| Database | [Supabase](https://supabase.com/) |

---

## Roadmap

- [ ] Auth module (register / login / JWT)
- [ ] Session CRUD (create, join, close)
- [ ] Socket.io gateway (lobby + session)
- [ ] Activity seeding
- [ ] Roulette algorithm (preference-based filtering)
- [ ] Web UI (Next.js)
- [ ] Mobile UI (Expo)
- [ ] Push notifications (mobile)
- [ ] Session history page

---

## Author

**Jean-Francis Achard** — [jfachard.com](https://www.jfachard.com) · [GitHub](https://github.com/jfachard)