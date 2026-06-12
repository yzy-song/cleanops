# CleanOps API — NestJS Backend

## Stack
- NestJS (CommonJS) on port 4000
- Prisma ORM via `@cleanops/db`
- PostgreSQL `db-cleanops`
- Stripe (per-company keys, not Connect)
- Xero OAuth2 for accounting sync
- Cloudinary for photo uploads
- pdfmake for invoice/payslip PDFs
- JWT auth with Passport

## Architecture
```
src/
├── auth/          # JWT login, guards, decorators (@Auth)
├── company/       # Company CRUD, Stripe key management
├── worker/        # Worker CRUD, earnings, job assignments
├── customer/      # Customer CRUD, credit risk
├── job/           # Job CRUD, assign, check-in/out, auto-schedule
├── invoice/       # Invoice CRUD, PDF, payment links, Xero sync
├── quote/         # Quote CRUD, pricing calculator, send/accept
├── report/        # Dashboard, overview, payroll, VAT, payslip PDF
├── billing/       # SaaS subscriptions, trial guard
├── customer-portal/  # Self-service portal for customers
├── service/       # Service catalog
├── automation/    # Automation rules
├── xero/          # Xero OAuth callback
├── common/        # Shared services, guards, decorators, utils
└── email/         # Email service
```

## Key Patterns
- Controller → Service → Prisma (never raw SQL)
- DTOs use `class-validator` decorators
- `@Auth()` decorator applies JwtAuthGuard + RolesGuard
- `@CurrentUser()` extracts user from JWT payload
- Module pattern with DI: `PrismaService` is global
- Response format: `{ success: true, data: T }`
- Stripe: `stripeService.createPaymentLink(companyId, amount, desc, metadata)` — uses company's own key

## Routes (prefix: /api)
| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/login, /auth/register, /auth/refresh |
| Company | CRUD /company, POST /company/stripe/key |
| Worker | CRUD /worker, GET /worker/me/jobs, /worker/me/earnings |
| Customer | CRUD /customer, GET /customer/list/credit-risk |
| Jobs | CRUD /jobs, /jobs/auto-schedule, /jobs/export/csv |
| Invoice | CRUD /invoice, PDF, pay, mark-paid, void, sync-xero |
| Quote | CRUD /quote, send, accept, decline, convert |
| Report | /report/overview, /dashboard, /payroll, /vat, /timesheet |
| Report | /report/payslip/:workerId/pdf (PAYE/PRSI/USC) |
| Billing | /billing/subscription, /checkout, /portal |
| Portal | /portal/verify, /portal/jobs, /portal/invoices, /portal/book |
| Xero | /xero/connect, /callback, /status, /disconnect |
| Services | CRUD /services |
| Automations | CRUD /automations |

## Roles
- **ADMIN**: full access
- **MANAGER**: most access (except admin-only: some delete ops, billing)
- **WORKER**: only own jobs/earnings via `/worker/me/*`

## Database
- All amounts in **integer cents** (€14.80 = 1480)
- All dates in **UTC** (ISO 8601)
- Schema: `packages/db/prisma/schema.prisma`
- Dev: `prisma db push`, Prod: `prisma migrate deploy`

## Env Vars
```
DATABASE_URL, JWT_SECRET, CORS_ORIGINS
STRIPE_SECRET_KEY (platform billing only — companies store their own key in DB)
STRIPE_BILLING_WEBHOOK_SECRET
XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI
CLOUDINARY_*, EMAIL_*
```

## Commands
- `pnpm --filter @cleanops/api dev` — start with watch mode
- `pnpm --filter @cleanops/api build` — production build
- `pnpm --filter @cleanops/api test` — run tests
