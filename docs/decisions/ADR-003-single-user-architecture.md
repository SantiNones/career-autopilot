# ADR-003: Stage 1 Single-User Architecture

**Status:** Accepted  
**Date:** 2025-06  
**Category:** Architecture

## Context

Career Autopilot is a personal job search tool built for a single user (the developer). Multi-user support requires authentication, authorization, tenant isolation, user management, and session handling — all of which add complexity without delivering value at this stage.

The product evolution plan (Stage 1–5) envisions multi-user support in Stage 3+. Building multi-tenancy now would:
- Slow development of core features
- Add authentication complexity before the product validates its value proposition
- Require infrastructure decisions (auth providers, session management) prematurely

## Decision

**Stage 1 operates as a single-user application with no authentication.**

Specific implications:
1. All database queries return data without user filtering
2. Prisma queries use a hardcoded or first-found user profile
3. No login page, no session management, no auth middleware
4. API routes trust all requests as coming from the owner
5. Environment variables store user-specific configuration

Multi-user support will be introduced in Stage 3 as part of the platform evolution.

## Consequences

- **Positive:** No auth complexity — faster feature development
- **Positive:** Simpler data model — no tenant isolation needed
- **Positive:** Reduced infrastructure cost — no auth provider needed
- **Positive:** Faster iteration on core value proposition
- **Negative:** Cannot be deployed for other users without refactor
- **Negative:** No access control — anyone with the URL can access everything
- **Negative:** Must migrate to multi-tenant when scaling (known technical debt)

## Alternatives Considered

1. **Multi-user from day one** — rejected; premature complexity for a personal tool
2. **Basic auth (password protection)** — considered; adds minimal security but no real value for a personal tool on Vercel
3. **No auth, single user** — **selected** — simplest path to validate product value
4. **OAuth with NextAuth** — deferred to Stage 3

## See Also

- [PRODUCT_EVOLUTION.md](../product/PRODUCT_EVOLUTION.md) — Stage 3 introduces multi-user
- [KNOWN_ISSUES.md](../engineering/KNOWN_ISSUES.md) — tracked as known technical debt
- [SPRINT_1_ARCHITECTURE_AUDIT.md](../reports/SPRINT_1_ARCHITECTURE_AUDIT.md) — identifies no-auth as a key finding
