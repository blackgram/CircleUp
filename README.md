# CircleUp

**Gather. Play. Connect.**

A multiplayer social gaming platform where groups of friends create private circles (rooms), invite others using a room code, and play interactive party games together in real time.

*by AJ*

---

## Architecture

```
game-world/
├── api/          Express + Socket.IO backend (TypeScript)
├── app/          Next.js frontend (TypeScript + Tailwind + shadcn/ui)
└── circleup/     Design reference (AI Studio generated)
```

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or Docker)
- Redis (optional)

### 1. Start the API

```bash
cd api
cp .env.example .env
# Edit .env with your secrets
npm install
npm run dev
```

API runs at `http://localhost:3000`  
Swagger docs at `http://localhost:3000/swagger`

### 2. Start the Frontend

```bash
cd app
npm install
npm run dev
```

App runs at `http://localhost:3001`

### 3. Start MongoDB

```bash
docker run -d --name mongodb -p 27017:27017 mongo:7
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, React Query, Zustand, Socket.IO Client |
| Backend | Express, TypeScript, Socket.IO, Mongoose, Pino |
| Database | MongoDB |
| Cache | Redis (optional) |
| Auth | JWT (access + refresh tokens), Google OAuth |

## Key Features

- Real-time multiplayer rooms via Socket.IO
- Plugin-based game architecture (add games without changing infrastructure)
- Schema-driven game settings (frontend auto-renders from backend schemas)
- Friend system with notifications
- Admin panel for game management
- Token blacklisting for immediate logout
- Storage-agnostic room management (memory/Redis)

## Documentation

- [API README](./api/README.md) — endpoints, project structure, how to add games
- [API Architecture](./api/ARCHITECTURE.md) — full design decisions and principles
- [App README](./app/README.md) — frontend setup, pages, design system
- [Swagger UI](http://localhost:3000/swagger) — interactive API docs (when running)

## Environment

See `.env.example` files in both `api/` and `app/` for required configuration.
