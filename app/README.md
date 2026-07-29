# CircleUp — Frontend

Next.js web application for the CircleUp multiplayer party game platform.

## Quick Start

```bash
npm install
npm run dev
```

App runs at `http://localhost:3001`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm start` | Start production server |

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Tech Stack

- **Next.js 16** — App Router, Server Components
- **TypeScript** — strict mode
- **Tailwind CSS v4** — utility-first styling
- **shadcn/ui** — component primitives
- **React Query** — server state management
- **Zustand** — client state (auth, UI)
- **Axios** — HTTP client with token refresh interceptor
- **Socket.IO Client** — real-time events
- **Framer Motion** — animations
- **Lucide React** — icons

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Main layout (sidebar + bottom nav)
│   │   ├── dashboard/      # Home — hero, stats, public rooms, create/join
│   │   ├── friends/        # Friend list, requests, user search
│   │   ├── games/          # Game catalog grid
│   │   ├── notifications/  # Notification feed with inline actions
│   │   ├── profile/        # User profile + edit + sign out
│   │   ├── user/[id]/      # View another user's profile
│   │   ├── admin/          # Game management + settings schema editor
│   │   └── circle/[code]/  # Room lobby ↔ game screen
│   ├── (auth)/             # Login/register (standalone fallback pages)
│   ├── layout.tsx          # Root layout + providers
│   ├── providers.tsx       # React Query + Theme + Toaster
│   └── page.tsx            # Redirect to /dashboard
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── auth-modal.tsx      # Google OAuth + email auth modal + nickname prompt
│   └── route-loader.tsx    # Full-screen route change loader with logo
│
├── features/
│   └── games/
│       ├── GameView.tsx    # Game router (picks component by slug)
│       ├── MostLikelyToGame.tsx  # Most Likely To game UI
│       └── index.ts
│
├── hooks/                  # React Query hooks
│   ├── useFriends.ts
│   ├── useGames.ts
│   └── useNotifications.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts       # Axios instance + interceptors
│   │   └── services.ts     # All API service functions
│   └── socket/
│       └── client.ts       # Socket.IO singleton + reconnection logic
│
├── stores/
│   ├── auth.ts             # User, tokens (persisted)
│   └── ui.ts              # Auth modal state
│
└── types/
    ├── index.ts            # All API response types
    └── google.d.ts         # Google Identity Services types
```

## Design System

### Brand Colors

| Name | Hex | Usage |
|---|---|---|
| Primary (Indigo) | `#4F46E5` | Buttons, links, active states |
| Secondary (Violet) | `#7C3AED` | Gradients, accents |
| Accent (Cyan) | `#06B6D4` | Highlights |
| Success (Emerald) | `#10B981` | Confirmations |
| Danger (Rose) | `#F43F5E` | Errors, destructive |
| Background | `#F8FAFC` | Page background |

### Design Principles

- `rounded-2xl` / `rounded-3xl` for cards and containers
- `font-extrabold` for headings
- Gradient hero sections (`from-indigo-600 via-violet-600 to-purple-700`)
- Lucide icons throughout
- Generous whitespace
- Skeleton loading states
- Auth modal (not page redirect) for protected actions

## Pages

| Route | Auth Required | Description |
|---|---|---|
| `/dashboard` | No | Home with hero, stats, public rooms, create/join |
| `/games` | No | Game catalog (enabled games) |
| `/friends` | Yes | Friend list + requests + user search |
| `/notifications` | Yes | Notification feed with inline actions |
| `/profile` | Yes | User profile + edit + sign out |
| `/user/[id]` | Yes | View other user's profile + add friend |
| `/admin` | Admin | Game CRUD, settings schema editor, analytics |
| `/circle/[code]` | Yes | Room lobby (WAITING) / Game screen (PLAYING) |
| `/login` | No | Standalone login (fallback) |
| `/register` | No | Standalone register (fallback) |

## Authentication Flow

1. User clicks a protected action (Create Circle, Join, etc.)
2. Auth Modal opens with Google OAuth popup (Safari-compatible) + email/password (secondary)
3. On success: tokens stored in Zustand (persisted to localStorage), modal closes
4. New Google users get a nickname prompt before proceeding
5. API client auto-attaches Bearer token to all requests
6. On 401: interceptor attempts token refresh, logs out if refresh fails
7. Welcome notification sent automatically on registration

## Real-time

Socket.IO connects automatically when user is authenticated.

**Connection:**
- Singleton socket instance, listeners attached once
- Auto-reconnect with exponential backoff (infinite retries)
- Token refreshed on `connect_error` auth failures

**Room sync:**
- Circle page sets `currentRoomCode` on mount
- If socket is already connected → emits `room:join` immediately
- If socket connects later → `connect` listener emits `room:join`
- Global `connect` handler also auto-rejoins via `currentRoomCode`

**Events received:**
- `room:update` → full room state snapshot (players, settings, status)
- `game:update` → game session state (phase, round data, scores, timer)
- `game:ended` → final scores
- `notification:new` → real-time notification push

## Game Screen

When room status is `PLAYING`, the UI switches from lobby to a focused game view:
- Compact header with room code, live indicator
- Collapsible Scores and Players panels
- Game component rendered by slug (`GameView` router)
- Leave button always accessible

### Most Likely To (`m-l-t`)

Phases: `STARTING` → `ANSWERING` → `RESULTS` → (repeat) → final `RESULTS`

- **STARTING**: Host types a question
- **ANSWERING**: All players see question + vote for a player + countdown timer
- **RESULTS**: Animated bar chart showing all players ranked by votes
- **Final round**: "Expose All Votes" button reveals full game breakdown, then "Return to Lobby"
