# REX Generator Client

Next.js 15 frontend for the REX image generation and social art experience.

## Setup

```bash
pnpm install
cp .env.example .env.local
```

Fill in `.env.local` using `.env.example` as the source of required variable names.

## Scripts

```bash
pnpm dev        # run Next.js locally on http://localhost:3000
pnpm typecheck  # run TypeScript without emitting files
pnpm lint       # run Next linting
pnpm build      # create a production build
pnpm start      # run the production build
```

## Local Backend

The frontend expects the API at `NEXT_PUBLIC_API_URL`, which defaults to `http://localhost:5001` in `.env.example`.

Start the backend from `generator-server` before testing API-backed pages.

## Architecture Notes for Agents

- Prefer shared API helpers and hooks over one-off fetch logic.
- Public social pages belong under public route groups as the repo evolves.
- Auth-required studio/settings surfaces belong under auth route groups.
- Do not enforce ownership or prompt visibility as a frontend security control. The backend must send only data the viewer is allowed to see.

Read the root `AGENT.md` before making frontend changes.
