# Project Vision

## Goal
Build a **web-based multiplayer party game platform** where users can create private rooms, invite friends using room codes, and play different game types in real time.

The platform should be extensible so that new games can be added without changing the core multiplayer infrastructure.

---

# Business Requirements

## Primary Goals

- Support multiple party games
- Real-time multiplayer
- Private room-based gameplay
- Persistent user accounts
- Friend system
- Platform statistics
- Easily add new games

---

## Target Audience
Small groups of friends.

Typical session:

```
2–10 players

↓

Create Room

↓

Share Code

↓

Join

↓

Play

↓

Repeat
```

---

## User Types

### Guest
Cannot join games.

Can browse available games.

Prompted to register when joining a room.

---

### Registered User
Can

- Create rooms
- Join rooms
- Add friends
- Play games
- View profile
- View statistics

---

### Room Host
Can

- Start game
- Kick players
- Change game
- Change room settings
- Transfer host
- End room

---

### Administrator
Can

- Create game definitions
- Enable/Disable games
- View analytics
- Manage users
- View active rooms

---

# Functional Requirements

## Authentication
Support

- Email/password
- Google OAuth
Users persist forever.

Store

```
UUID

Nickname

Display Name

Avatar

Provider

Games Played

Games Won

Join Date

Last Seen
```

---

## Friends
Support

- Send request
- Accept
- Reject
- Remove
Future

- Invite friend
- Online indicator

---

## Rooms
Users can

- Create room
- Join using code
- Leave
- Rejoin after disconnect
- Ready up
Host can

- Start
- End
- Kick
- Change settings

---

## Games
The platform supports multiple games.

Each game provides

```
Start

Stop

Handle Action

Next Turn

End

Serialize State
```
Games should be completely independent.

---

## Realtime
Support

Player Joined

Player Left

Host Changed

Ready Changed

Game Started

Game Action

Score Update

Game Finished

Reconnect

---

## Statistics
Track

Games Played

Games Won

Most Played Game

Win Rate

Session Count

Friend Count

Join Date

---

# Non-Functional Requirements
Performance

Lobby updates should feel instant.

Target latency

<100ms on LAN

---
Scalability

Must support

Initially

```
Single Server
```
Later

```
Multiple Servers

↓

Redis Adapter

↓

Horizontal Scaling
```
No architectural rewrite.

---
Reliability

Players should reconnect after temporary internet loss.

Room state must survive server restarts when Redis is available.

---
Maintainability

Adding a new game should require

- New folder
- New game class
- Registration
Nothing else.

---
Security

JWT Authentication

Password Hashing

Rate Limiting

Input Validation

Server-side game validation

No client authority.

---

# Technical Decisions

## Frontend
Technology

Next.js

Reasons

- Already familiar
- Excellent routing
- React ecosystem
- Great deployment

---

## Backend
Technology

Express

Reason

Gain MERN experience.

Simple.

Flexible.

Large ecosystem.

---

## Database
MongoDB

Reason

Natural document structure

Fast iteration

MERN stack

---

## ORM
Mongoose

Reason

Schema validation

Indexes

Middleware

Population

---

## Authentication
JWT

Access Token

Refresh Token

Google OAuth

Reason

Industry standard

Works with web and future mobile apps.

---

## Passwords
bcrypt

Reason

Battle tested.

---

## Realtime
Socket.IO

Reason

Automatic reconnect

Rooms

Acknowledgements

Fallback transport

Battle tested.

---

## State Storage
Decision

Active room state does NOT belong in MongoDB.

Instead

```
Room Storage

↓

Redis

↓

Fallback

↓

In-Memory Map
```
Reason

Room state changes constantly.

Mongo is persistent storage.

Redis is temporary storage.

---

## Storage Abstraction
Every service depends on

```
IRoomStorage
```
Never

```
Redis
```
or

```
Memory Map
```
directly.

This allows

```
Redis URL exists

↓

RedisStorage

Otherwise

↓

MemoryStorage
```
without changing business logic.

---

## Architecture Pattern
Layered Architecture

```
Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Database
```
Game logic exists outside Express.

---

## Game Architecture
Plugin architecture.

```
GameEngine

↓

Load Game

↓

Trivia

Charades

Mafia

Drawing

Guess Game
```
Each game implements

```
IGame
```
This prevents

```
if(game=="Trivia")

if(game=="Mafia")

if(game=="Drawing")
```
throughout the codebase.

---

## Live State
Live

Room

Players

Current Turn

Votes

Scores

Timer

Ready Status

Current Round

Stored in Redis/Memory.

---
Persistent

Users

Friends

Game History

Achievements

Statistics

Stored in MongoDB.

---

## Redis Decision
Redis is optional.

Application should start successfully without Redis.

If

```
REDIS_URL
```
exists

Use Redis.

Otherwise

Use

```
Map<string, Room>
```
No feature changes.

Only storage backend changes.

---

## Error Handling
Centralized Express middleware.

Controllers never catch every error individually.

Services throw custom exceptions.

Middleware formats responses.

---

## Validation
All request payloads validated before reaching services.

Preferred

Zod

---

## Logging
Structured logging.

Every request gets

Request ID

User ID

Duration

Status Code

---
Socket events also logged.

---

## Deployment
Containerized using Docker.

Services

```
Frontend

Backend

MongoDB

Redis (optional)
```
Development via Docker Compose.

---

# Future Features (Not MVP)

- Voice chat
- Game chat
- Spectator mode
- AI players
- Public rooms
- Matchmaking
- Tournaments
- Leaderboards
- Seasonal achievements
- Push notifications
- Mobile application (React Native)
- WebRTC for peer-assisted features
- Analytics dashboard
- Game replay/history
- Moderation tools

---

# Guiding Architectural Principles
These are the principles I'd use to evaluate every future decision:

1. **Server authoritative:** The server is the single source of truth for room state, timers, scores, turns, and game outcomes. Clients only send intentions (actions), never authoritative state.
2. **Transport agnostic:** Game logic must not depend on Express or Socket.IO. Whether an action arrives via HTTP, WebSocket, or another protocol, it should ultimately call the same service methods.
3. **Storage agnostic:** Active room management depends on an `IRoomStorage` interface, allowing Redis and in-memory implementations to be swapped via configuration without changing business logic.
4. **Plugin-based games:** Every game implements a common interface (`GameAdapter`) and registers with the `GameEngine`. Adding a new game should not require modifying existing game implementations.
5. **Separation of concerns:** Controllers handle HTTP/WebSocket requests, services implement business rules, repositories manage persistence, and the game engine enforces gameplay. Each layer has a single, well-defined responsibility.

---

# Socket.IO Architecture

## Design Philosophy

- **Snapshot-based broadcasting:** Every state change emits the full current state. No event sourcing, no partial updates. Frontend replaces its state entirely on each `room:update` or `game:update`.
- **Generic event vocabulary:** No game-specific socket events. Everything goes through `game:action`. The payload determines what happens.
- **Thin handlers:** Socket event handlers delegate to gateways in a single line. Business logic lives in services.
- **SocketManager:** All broadcasts go through a centralized `SocketManager`. Gateways never call `io.emit()` directly. This allows adding Redis adapters, analytics, or logging in one place.

## Event Flow

```
Client → Server
─────────────────
room:join      { roomCode }
room:leave
player:ready
game:start
game:action    { action, payload }

Server → Client
─────────────────
room:update    (full room snapshot)
game:update    (full game session snapshot)
game:ended     (final scores + winner)
notification:new
error          { message }
```

## Connection Authentication

Clients provide JWT in `socket.handshake.auth.token`. The server verifies it before allowing any events.

## Idempotency

Submissions are keyed by `userId + roundNumber`. Duplicate submissions are rejected. Sequential version numbers (`session.metadata.version++`) allow clients to ignore out-of-order packets.

## Reconnection

On reconnect, client emits `room:join` with their `roomCode`. Server sends full `room:update` + `game:update` snapshots. Client rebuilds UI instantly.

---

# Game Architecture

## Separation: Platform vs Game

The platform manages rooms, players, sessions, timers, and networking.

Games only answer three questions:
1. What does the host configure? → `settingsSchema`
2. What do players submit? → `validateSubmission()`
3. How are results computed? → `computeResults()`

## GameAdapter Interface

```typescript
interface GameAdapter {
  slug: string;
  name: string;
  settingsSchema: SettingDefinition[];
  validateSettings(settings): ValidationResult;
  validateSubmission(submission): ValidationResult;
  computeResults(roundContent, submissions, config): ComputedResult;
}
```

## Game Session Lifecycle

```
Room (WAITING)
    ↓ Host starts game
GameSession (STARTING)
    ↓ First round begins
GameSession (PLAYING, phase: ANSWERING)
    ↓ All players submit / timer expires
GameSession (PLAYING, phase: RESULTS)
    ↓ Host advances / auto-advance
GameSession (PLAYING, phase: ANSWERING) ← next round
    ↓ ... repeat ...
GameSession (FINISHED)
    ↓ Persist to GameHistory
Room (FINISHED / back to WAITING)
```

## Round Structure

```
Round
├── content      (question/prompt — set by host or engine)
├── submissions  (player answers — one per player per round)
├── result       (computed by adapter — immutable after round ends)
├── status       (PENDING → ACTIVE → FINISHED)
└── timestamps
```

## Adding a New Game

1. Create `src/game-engine/adapters/my-game.ts` implementing `GameAdapter`
2. Register with `gameEngine.register(myGameAdapter)`
3. Create game definition via admin API with `settingsSchema`
4. Build frontend renderer

No changes to services, sockets, storage, or other games.

---

# Data Flow

```
┌──────────────────────────────────────────────────┐
│                   Socket.IO                       │
│              (socketAuth → events)                │
└───────────┬──────────────────┬───────────────────┘
            │                  │
     RoomGateway         GameGateway
            │                  │
     SocketManager      SocketManager
            │                  │
     RoomService       GameSessionService
            │                  │
     IRoomStorage         GameEngine
     (Memory/Redis)           │
            │           GameAdapter
     UserRepository     (per-game logic)
            │
         MongoDB
```

---

# User Roles

```
USER    — Default. Can create rooms, play games, manage friends.
ADMIN   — Set directly in database. Can manage game definitions, view analytics.
```

Role is embedded in the JWT access token. `authorizeAdmin` middleware checks the token claim without hitting the database.

---

# Notification System

Notifications are created internally by services (never via API). They support:
- Friend requests/acceptances
- Room invites
- Game events
- Achievements
- Admin announcements

Each notification has `type`, `category`, `actionUrl`, and `data` for frontend navigation.

Future: `notificationService.create()` will also emit `notification:new` via Socket.IO for real-time delivery.

These principles will keep the platform extensible as you add more games and features without accumulating unnecessary complexity.
