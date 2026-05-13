# REX AI Generator

REX is a Next.js + Express application evolving from an AI image generator into a social platform for AI-generated art.

## Repository Map

```text
REX---AI-Generator/
  AGENT.md            Primary operating manual for AI agents
  AGENTS.md           Compatibility pointer for agents that look for this name
  .agent/             Agent skills, hooks, workflows, and role definitions
  generator-client/   Next.js 15 frontend
  generator-server/   Express + TypeScript backend
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase project and storage bucket
- Clerk application
- Hugging Face token
- Razorpay account for payment flows

## First-Time Setup

```bash
cd generator-server
pnpm install
cp .env.example .env

cd ../generator-client
pnpm install
cp .env.example .env.local
```

Fill in the copied environment files before running the apps.

## Run Locally

Start the backend:

```bash
cd generator-server
pnpm dev
```

Start the frontend in another terminal:

```bash
cd generator-client
pnpm dev
```

Default URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:5001

## Verification Commands

Use these before handing work back:

```bash
cd generator-server
pnpm typecheck
pnpm build

cd ../generator-client
pnpm typecheck
pnpm lint
pnpm build
```

No test suite is currently required for routine changes. Do not invent placeholder tests unless the task explicitly asks for tests.

## AI Agent Notes

1. Read `AGENT.md` before editing code.
2. Read the relevant file in `.agent/skills/` for the domain you touch.
3. Use `.agent/hooks/HOOKS.md` as the pre-handoff checklist.
4. Treat current direct Supabase calls in older controllers as legacy code. New or refactored backend work should move toward route -> controller -> service -> repository layering.
5. Do not inspect real `.env` files unless the task specifically requires debugging local configuration. Use `.env.example` files for required variable names.

## Package Manager

Both packages use `pnpm-lock.yaml`. Prefer pnpm for installs, scripts, and dependency changes.
