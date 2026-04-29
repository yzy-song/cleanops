# 项目概述

Nest.js + Next.js + TypeScript + Prisma + PostgreSQL SaaS

# Project Instructions (Monorepo: NestJS + Next.js)

## Project Structure (IMPORTANT)

This is a monorepo:

- Backend: /apps/api (NestJS)
- Frontend: /apps/web (Next.js, App Router)
- Database: /packages/db (shared database layer, Prisma or ORM)

Only work within the relevant folder. Do NOT scan the entire repository unless explicitly asked.

---

## General Rules (Cost Optimization)

- Do NOT read or analyze the whole project by default.
- Only access files that are directly related to the task.
- Prefer minimal changes over large refactors.
- Do NOT rewrite existing modules unless necessary.

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

## File Editing Rules (VERY IMPORTANT)

- Only modify files relevant to the task.
- Do NOT create duplicate files.
- Do NOT rename existing files unless explicitly asked.

---

## When Unsure

- Ask before making large changes.
- Prefer extending existing logic over creating new systems.

# 开发命令

pnpm dev
pnpm build
