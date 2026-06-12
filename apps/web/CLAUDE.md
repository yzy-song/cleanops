# CleanOps Web — Next.js 14 Frontend

## Stack
- Next.js 14 App Router with Turbopack
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query for data fetching
- framer-motion for animations
- Zustand for auth store
- date-fns for date formatting
- sonner for toast notifications

## Structure
```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── (dashboard)/              # Authenticated dashboard routes
│   │   ├── layout.tsx            # Sidebar + CommandPalette + AnimatePresence
│   │   ├── dashboard/            # Admin dashboard
│   │   ├── jobs/                 # Job list, /new, /[id]
│   │   ├── customers/            # Customer list, detail
│   │   ├── workers/              # Worker list, detail
│   │   ├── quotes/               # Quotes list, /new, /[id]
│   │   ├── invoices/             # Invoice list, /[id]
│   │   ├── pipeline/             # Kanban pipeline
│   │   ├── services/             # Service catalog
│   │   ├── automations/          # Automation rules
│   │   ├── map/                  # Map scheduler
│   │   ├── reports/              # Reports dashboard
│   │   └── settings/             # Settings (Stripe, Xero, company)
│   └── pricing/                  # Public pricing page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Sidebar, CommandPalette
│   ├── customer/                 # NewCustomerSheet
│   └── worker/                   # NewWorkerSheet
├── hooks/                        # TanStack Query hooks
├── lib/                          # API client, utils
└── store/                        # Zustand stores (auth)
```

## Key Patterns
- **Server Components** by default, `"use client"` only when needed
- **Data fetching**: TanStack Query hooks in `src/hooks/`
- **API client**: `api` from `@/lib/api` — axios instance with JWT interceptor
- **Auth**: JWT stored in Zustand → `useAuthStore` + `localStorage("cleanops-auth")`
- **Route protection**: `useRoleGuard(["ADMIN","MANAGER"])` redirects unauthorized roles
- **Slide-out panels**: NewCustomerSheet, NewWorkerSheet, Job creation — all right-side drawers
- **Animations**: `AnimatePresence` for page transitions, `layout` prop for list reordering
- **Animation curves**: CSS variables `--spring-gentle`, `--spring-smooth`, `--spring-bouncy`
- **Internationalization**: All user-facing text via `t()` function
- **Currency display**: `eur(cents: number) => €${(cents/100).toFixed(2)}`

## Routing
| Path | Role Required | Notes |
|------|:--:|-------|
| `/dashboard` | ADMIN, MANAGER | Worker redirected to /jobs |
| `/jobs` | ALL | Worker sees only own jobs |
| `/jobs/new` | ADMIN, MANAGER | |
| `/map` | ADMIN, MANAGER | |
| `/customers` | ADMIN, MANAGER | |
| `/workers` | ADMIN, MANAGER | |
| `/quotes` | ADMIN, MANAGER | |
| `/invoices` | ADMIN, MANAGER | |
| `/pipeline` | ADMIN, MANAGER | |
| `/services` | ADMIN, MANAGER | |
| `/automations` | ADMIN, MANAGER | |
| `/reports` | ADMIN, MANAGER | |
| `/settings` | ADMIN | |

## Commands
- `pnpm --filter @cleanops/web dev` — dev on port 3001
- `pnpm --filter @cleanops/web build` — production build

## Env Vars
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```
