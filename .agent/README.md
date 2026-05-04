# .agent — REX AI Operating Framework

> This directory is the AI collaboration infrastructure for the REX repository.
> It extends `AGENT.md` at the repo root with detailed skill files, hooks, subagent roles, and workflows.
> All content is model-agnostic and works with Claude, ChatGPT/Codex, Gemini, or any capable coding agent.

---

## Directory Structure

```
.agent/
├── README.md               ← This file
├── skills/                 ← Domain-specific instruction sets
│   ├── 01-repo-architecture.md
│   ├── 02-frontend-social-ui.md
│   ├── 03-backend-social-api.md
│   ├── 04-supabase-schema.md
│   ├── 05-auth-and-profile-flow.md
│   ├── 06-generation-pipeline.md
│   ├── 07-post-publishing-workflow.md
│   ├── 08-feed-and-discovery.md
│   ├── 09-engagement-actions.md
│   ├── 10-moderation-and-safety.md
│   ├── 11-billing-and-credits.md
│   ├── 12-migration-planner.md
│   ├── 13-repo-refactor-guard.md
│   └── 14-qa-and-release-checks.md
├── hooks/
│   └── HOOKS.md            ← 8 quality gates (policy + executable guide)
├── subagents/
│   └── ROLES.md            ← 10 specialized agent role definitions
└── workflows/
    └── WORKFLOW.md         ← Task lifecycle, multi-agent coordination, formats
```

---

## Quick Reference: When to Use What

| I need to... | Use |
|---|---|
| Start a new task in this repo | `AGENT.md` → Workflows → relevant skill |
| Build a new page or component | Skill `02-frontend-social-ui` |
| Build a new API endpoint | Skill `03-backend-social-api` |
| Change the database schema | Skill `04-supabase-schema` + Hook `db-migration` |
| Work with auth or Clerk | Skill `05-auth-and-profile-flow` |
| Modify the generation flow | Skill `06-generation-pipeline` |
| Build the publish flow | Skill `07-post-publishing-workflow` |
| Build feed or explore | Skill `08-feed-and-discovery` |
| Add like/save/follow/comment | Skill `09-engagement-actions` |
| Add reporting or moderation | Skill `10-moderation-and-safety` |
| Modify payments or credits | Skill `11-billing-and-credits` |
| Plan a schema migration | Skill `12-migration-planner` |
| Refactor existing code | Skill `13-repo-refactor-guard` |
| Verify work before completing | Skill `14-qa-and-release-checks` |
| Check if my plan is safe | `HOOKS.md` |
| Delegate to a specialized agent | `ROLES.md` |
| Coordinate multi-agent work | `WORKFLOW.md` |

---

## Portability Notes

| File | Claude | ChatGPT/Codex | Gemini | Human |
|---|---|---|---|---|
| `AGENT.md` | ✅ Primary | ✅ System prompt or context | ✅ Context | ✅ Read first |
| `skills/*.md` | ✅ Skill files | ✅ Task context | ✅ Context docs | ✅ Reference |
| `hooks/HOOKS.md` | ✅ Self-check | ✅ Policy checklist | ✅ Policy | ✅ Code review |
| `subagents/ROLES.md` | ✅ Subagent system | ✅ GPT delegation | ✅ Task split | ✅ Team roles |
| `workflows/WORKFLOW.md` | ✅ Workflow | ✅ Process guide | ✅ Process | ✅ SOPs |

---

## Framework Maintenance Rules

1. `AGENT.md` is the source of truth — skills and hooks cannot contradict it
2. When product direction changes → update AGENT.md §1 and §5 first, then update skills
3. When new domains are added → create a new skill file; update `AGENT.md` §15 skill index
4. When new recurring failure modes appear → add a hook to HOOKS.md
5. Skills are versioned by implicit revision — add `**Updated:** YYYY-MM-DD` at top when changed significantly
6. Do not create platform-specific files in this directory unless clearly labeled `[CLAUDE-ONLY]` etc.
