# CircleUp
# Game World API

Multiplayer party game platform backend built with Express, Socket.IO, MongoDB, and TypeScript.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB (Docker)
docker run -d --name mongodb -p 27017:27017 mongo:7

# Run development server
npm run dev
```

Server starts at `http://localhost:3000`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm start` | Run compiled output |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | development | Environment |
| `PORT` | 3000 | Server port |
| `LOG_LEVEL` | info | Pino log level |
| `DATABASE_URL` | — | MongoDB connection string |
| `REDIS_URL` | — | Optional. Redis for token blacklist + room storage |
| `JWT_SECRET` | — | Access token signing key |
| `JWT_REFRESH_SECRET` | — | Refresh token signing key |
| `JWT_ACCESS_EXPIRY` | 900 | Access token TTL (seconds) |
| `JWT_REFRESH_EXPIRY` | 604800 | Refresh token TTL (seconds) |
| `GOOGLE_CLIENT_ID` | — | Google OAuth client ID |
| `CORS_ORIGIN` | http://localhost:5173 | Allowed CORS origin |

## API Documentation

Interactive Swagger UI: `http://localhost:3000/swagger`

Raw OpenAPI JSON: `http://localhost:3000/swagger.json`

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── server.ts              # HTTP + Socket.IO bootstrap
│
├── config/                # Environment, database, redis, swagger
├── routes/                # Express route definitions + OpenAPI docs
├── controllers/           # HTTP request handlers
├── services/              # Business logic
├── repositories/          # MongoDB data access
├── models/                # Mongoose schemas
│
├── socket/                # Socket.IO layer
│   ├── index.ts           # Event registration
│   ├── socketAuth.ts      # JWT auth middleware
│   ├── SocketManager.ts   # Centralized broadcasting
│   ├── RoomGateway.ts     # Room join/leave/ready
│   ├── GameGateway.ts     # Game start/action
│   └── events.ts          # Typed event definitions
│
├── storage/               # IRoomStorage interface + implementations
│   ├── IRoomStorage.ts
│   ├── MemoryStorage.ts
│   └── index.ts
│
├── game-engine/           # Game adapter registry
│   ├── GameEngine.ts
│   └── index.ts
│
├── middleware/            # Auth, admin authorization
├── dto/                   # Request/Response types
├── enums/                 # AuthProvider, RoomStatus, UserRole, etc.
├── types/                 # GameSession, GameAdapter interfaces
├── utils/                 # Logger
├── jobs/                  # Future: scheduled tasks
└── models/                # Mongoose document schemas
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full design decisions.

### Key Patterns

- **Layered:** Routes → Controllers → Services → Repositories → Database
- **Storage agnostic:** Rooms live in memory (Redis swap requires zero code changes)
- **Plugin games:** Implement `GameAdapter`, register with `GameEngine`
- **Snapshot sockets:** Every state change broadcasts the full current state
- **Generic events:** `game:action` handles all game types

### API Modules

| Module | Prefix | Auth | Description |
|---|---|---|---|
| Health | `/health` | No | Server status |
| Auth | `/api/auth` | Partial | Register, login, logout, refresh, me |
| Users | `/api/users` | Partial | Profile, search, update |
| Friends | `/api/friends` | Yes | Requests, accept, reject, list |
| Rooms | `/api/rooms` | Yes | Create, join, leave, settings, start/end |
| Games | `/api/games` | No | Browse game catalog |
| Notifications | `/api/notifications` | Yes | Read, mark, clear |
| Admin | `/api/admin` | Admin | Manage games, view rooms/users/analytics |

### Socket.IO Events

**Client → Server:**
- `room:join` — Join a room by code
- `room:leave` — Leave current room
- `player:ready` — Toggle ready status
- `game:start` — Host starts the game
- `game:action` — Submit any game action

**Server → Client:**
- `room:update` — Full room state snapshot
- `game:update` — Full game session snapshot
- `game:ended` — Final scores
- `error` — Error message

### User Roles

| Role | Access |
|---|---|
| `USER` | Default. All player features |
| `ADMIN` | Game management, analytics. Set via database |

Promote a user to admin:
```bash
mongosh mongodb://localhost:27017/game-world \
  --eval 'db.users.updateOne({ email: "you@example.com" }, { $set: { role: "ADMIN" } })'
```

## Adding a New Game

1. Create `src/game-engine/adapters/my-game.ts`:
```typescript
import { GameAdapter } from "../types";

export const myGameAdapter: GameAdapter = {
  slug: "my-game",
  name: "My Game",
  settingsSchema: [
    { key: "rounds", type: "number", label: "Rounds", default: 10, min: 1, max: 20 },
  ],
  validateSettings(settings) { return { valid: true }; },
  validateSubmission(submission) { return { valid: true }; },
  computeResults(content, submissions, config) {
    return { scores: [], data: {} };
  },
};
```

2. Register in `src/game-engine/index.ts`:
```typescript
import { myGameAdapter } from "./adapters/my-game";
gameEngine.register(myGameAdapter);
```

3. Create the game definition via admin API
4. Build the frontend renderer

No changes to services, sockets, or other games required.
