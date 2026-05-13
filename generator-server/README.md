# REX Generator Server

Express + TypeScript API for generation, profiles, social posts, payments, and admin workflows.

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env` using `.env.example` as the source of required variable names.

## Scripts

```bash
pnpm dev        # run src/server.ts with tsx watch
pnpm typecheck  # run TypeScript without emitting files
pnpm build      # compile to dist/
pnpm start      # run compiled dist/server.js
```

## Architecture Notes for Agents

- New backend work should follow route -> controller -> service -> repository.
- Controllers parse requests, call services, and send responses.
- Services own business decisions and authorization checks.
- Repositories own Supabase or database access.
- Some existing controllers still call Supabase directly. Treat those as legacy surfaces and avoid copying that pattern into new code.

Read the root `AGENT.md` before making backend changes.
