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
│   │   ├── dashboard/      # Home — hero, stats, create/join circle
│   │   ├── friends/        # Friend list, requests, search
│   │   ├── games/          # Game catalog grid
│   │   ├── notifications/  # Notification feed
│   │   ├── profile/        # User profile + edit + sign out
│   │   ├── admin/          # Game management (admin only)
│   │   └── circle/[code]/  # Room lobby
│   ├── (auth)/             # Login/register (standalone fallback pages)
│   ├── layout.tsx          # Root layout + providers
│   ├── providers.tsx       # React Query + Theme + Toaster
│   └── page.tsx            # Redirect to /dashboard
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── auth-modal.tsx      # Google OAuth + email auth modal
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
│       └── client.ts       # Socket.IO singleton
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
| `/dashboard` | No | Home with hero, stats, create/join |
| `/games` | No | Game catalog (enabled games) |
| `/friends` | Yes | Friend list + requests |
| `/notifications` | Yes | Notification feed |
| `/profile` | Yes | User profile + edit + sign out |
| `/admin` | Admin | Game CRUD, analytics |
| `/circle/[code]` | Yes | Room lobby with players |
| `/login` | No | Standalone login (fallback) |
| `/register` | No | Standalone register (fallback) |

## Authentication Flow

1. User clicks a protected action (Create Circle, Join, etc.)
2. Auth Modal opens with Google OAuth (primary) + email/password (secondary)
3. On success: tokens stored in Zustand (persisted to localStorage), modal closes
4. API client auto-attaches Bearer token to all requests
5. On 401: interceptor attempts token refresh, logs out if refresh fails

## Real-time

Socket.IO connects automatically when user is authenticated. Events:

- `room:update` → full room state snapshot
- `game:update` → full game session snapshot
- `game:ended` → final scores
- `notification:new` → new notification (future)
