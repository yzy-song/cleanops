# 项目概述

Nest.js + Next.js + TypeScript + Prisma + PostgreSQL SaaS

# Behavioral Guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

# Project Structure (IMPORTANT)

This is a monorepo:

- Backend: /apps/api (NestJS)
- Frontend: /apps/web (Next.js, App Router)
- Database: /packages/db (shared database layer, Prisma or ORM)

Only work within the relevant folder. Do NOT scan the entire repository unless explicitly asked.

---

## Backend Rules (NestJS - /apps/api)

- Use modular architecture (feature-based modules).
- Controllers handle routing only.
- Business logic must be in services.
- Use DTOs for validation (class-validator).
- Follow existing module patterns (do not invent new structure).
- Use dependency injection.

---

## Frontend Rules (Next.js - /apps/web)

- Use App Router.
- Prefer Server Components.
- Use Client Components only when necessary.
- Keep UI and data fetching separate.
- Use existing API endpoints, do NOT mock data unless asked.

---

## Database Rules (/packages/db)

- All database access must go through this layer.
- Do NOT write raw queries in frontend or backend directly.
- Reuse existing models and schema.

---

## API Integration Rules

- Backend is the single source of truth.
- Frontend must call backend APIs.
- Keep API responses consistent.

---

## When Unsure

- Ask before making large changes.
- Prefer extending existing logic over creating new systems.

# 开发命令

pnpm dev
pnpm build
