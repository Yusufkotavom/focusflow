# Vite + Clerk Starter

Admin Dashboard starter template built with Vite, React, shadcn/ui, and Clerk authentication.

## Tech Stack

- **Frontend:** [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **UI:** [shadcn/ui](https://ui.shadcn.com) (TailwindCSS + RadixUI)
- **Auth:** [Clerk](https://clerk.com)
- **Routing:** [TanStack Router](https://tanstack.com/router)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)
- **API:** [Hono](https://hono.dev/) (Vercel Edge Functions)
- **Database:** [Neon PostgreSQL](https://neon.tech/) + [Drizzle ORM](https://orm.drizzle.team/)

## Features

- Clerk authentication (sign-in, sign-up, sign-out)
- Protected routes with auth guard
- User profile from Clerk session (sidebar + header)
- Light/dark mode
- Responsive layout with sidebar
- RTL support
- Global search command
- 10+ demo pages

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Yusufkotavom/vite-clerk-starter.git
cd vite-clerk-starter
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env.local
```

Fill in your keys in `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
```

Get your Clerk keys from [Clerk Dashboard](https://dashboard.clerk.com) → API Keys.

### 3. Clerk Dashboard Setup

In your Clerk Dashboard → Configure → Paths:

- **Sign-in URL:** `/sign-in`
- **Sign-up URL:** `/sign-up`
- **After sign-in URL:** `/`
- **After sign-up URL:** `/`

### 4. Run

```bash
pnpm run dev
```

Open `http://localhost:5173`

## Project Structure

```
├── api/                  # Hono API (Vercel Edge Functions)
│   ├── db.ts             # Database connection (server-only)
│   └── index.ts          # API routes
├── src/
│   ├── components/       # UI components (shadcn + custom)
│   ├── context/          # React context providers
│   ├── db/               # Database schema (Drizzle)
│   ├── features/         # Feature modules (dashboard, tasks, users, etc.)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── (auth)/       # Sign-in, sign-up (Clerk components)
│   │   ├── (errors)/     # Error pages (401, 403, 404, 500, 503)
│   │   └── _authenticated/ # Protected routes (dashboard, settings, etc.)
│   └── main.tsx          # App entry point (ClerkProvider wraps everything)
└── .env.example          # Environment variables template
```

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type check + production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm test` | Run tests |
| `pnpm knip` | Detect unused code |

## License

[MIT](https://choosealicense.com/licenses/mit/)
