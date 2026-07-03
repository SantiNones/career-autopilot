# Career Autopilot — Lightweight CI Plan

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## Philosophy

Keep CI minimal, fast, and useful. A pipeline that takes 2 minutes and catches real problems is better than a 20-minute pipeline that runs everything.

No deployment automation yet. Focus on preventing regressions before merge.

---

## Target Pipeline

```
┌─────────────┐
│   Build     │  Next.js production build (catches import errors, missing deps)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ TypeScript  │  Type checking (catches type errors without running code)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Lint      │  ESLint (catches code quality issues)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│ Deterministic Benchmark     │  Tier 1 + Tier 2 tests (no LLM, no network)
│ Suite                       │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│ Ready to    │  
│ Merge       │  
└─────────────┘
```

---

## Commands

```bash
# Step 1: Build
npm run build

# Step 2: TypeScript (included in build, but can run standalone)
npx tsc --noEmit

# Step 3: Lint
npm run lint

# Step 4: Deterministic benchmarks (no LLM)
npm run test:benchmarks
```

---

## Required package.json Scripts (to add)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test:benchmarks": "node --experimental-vm-modules tests/run.ts",
    "ci": "npm run typecheck && npm run lint && npm run build && npm run test:benchmarks"
  }
}
```

---

## GitHub Actions Workflow (proposed)

File: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: career
          POSTGRES_PASSWORD: career
          POSTGRES_DB: career_autopilot
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U career"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_URL: postgresql://career:career@localhost:5432/career_autopilot

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      
      - run: npm ci
      
      - run: npx prisma generate
      
      - run: npx prisma migrate deploy
      
      - name: TypeScript
        run: npx tsc --noEmit
      
      - name: Lint
        run: npm run lint
      
      - name: Build
        run: npm run build
      
      - name: Deterministic Benchmarks
        run: npm run test:benchmarks
        env:
          USE_AI: "false"
```

---

## What Each Step Catches

| Step | Catches | Time |
|------|---------|------|
| **Build** | Import errors, missing modules, Prisma schema issues, Next.js config errors | ~30s |
| **TypeScript** | Type errors, interface mismatches, null safety issues | ~10s |
| **Lint** | Code quality, unused vars, style violations | ~5s |
| **Benchmarks** | Scoring regressions, classifier bugs, contract violations, format errors | ~10s |

**Total expected time: ~60 seconds**

---

## What Is NOT In This Pipeline

- ❌ LLM-based tests (too expensive, non-deterministic)
- ❌ E2E browser tests (too complex for now)
- ❌ Deployment (manual via Vercel)
- ❌ Database seeding
- ❌ Performance benchmarks
- ❌ Security scanning

These may be added in later sprints when the value justifies the complexity.

---

## Local Development Equivalent

Developers (and AI agents) should run before committing:

```bash
# Quick check (30s)
npm run typecheck && npm run lint

# Full check (60s)
npm run ci
```

---

## Implementation Plan

1. **Sprint 0:** Document this plan (this file) ✓
2. **Sprint 1:** Add `test:benchmarks` script with first Tier 1 tests
3. **Sprint 2:** Add `ci` script combining all steps
4. **Sprint 4:** Add GitHub Actions workflow file
5. **Ongoing:** Add benchmarks as features are built

---

## Success Criteria

The CI pipeline is working when:

- A developer can run `npm run ci` locally and get pass/fail in under 2 minutes
- No PR is merged without passing the pipeline
- Adding a new benchmark is as easy as adding a fixture file
- The pipeline never requires API keys or network access for default runs
- False positives are rare enough that developers trust the results
