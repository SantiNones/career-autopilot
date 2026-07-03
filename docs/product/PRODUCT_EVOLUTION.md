# Career Autopilot — Product Evolution

Last updated: 2026-07-01  
Owner: Santiago Nones  
Status: Living document  
Reference: VISION.md (constitution)

---

## Overview

Career Autopilot should evolve through five stages. Each stage expands the product's understanding of the user, the market, and the relationship between them.

The stages are not implementation order. They represent product maturity levels. Some Stage 3 capabilities may be built before Stage 2 is complete, if they strengthen the intelligence layer.

The guiding question at every stage:

> "Does this help the user make better career decisions?"

```
Stage 1                Stage 2                Stage 3                Stage 4                Stage 5
Personal Job       →   Career Operating   →   Career Intelligence →  Professional       →   CareerOps
Assistant              System                 Platform               Operating System
                                                                    
"Help me apply"        "Help me decide"       "Help me grow"         "Help me navigate"     "Help us all"
```

---

## Stage 1 — Personal Job Assistant

### Primary User
Santiago (single user, technical, career-transitioning into AI engineering)

### Main Problem Solved
Applying to jobs is fragmented and manual. No single tool understands the candidate well enough to score opportunities, generate materials, and track progress.

### Capabilities
- Profile and resume management
- Job ingestion (manual + bulk)
- Job discovery from provider APIs (Greenhouse, Lever, Ashby)
- Heuristic scoring and deterministic classifiers
- Candidate Intelligence generation
- Fit Analysis (V4 capability-based)
- Application material generation (CV, cover letter, recruiter message, screening answers)
- Material export (PDF, DOCX)
- Application pipeline tracking (Kanban)
- Evidence-based capability matching

### Engineering Priorities
- Get the core loop working reliably
- Stabilize scoring
- Fix discovery quality
- Add table filters and search
- Editable materials
- Documentation and architecture clarity

### Success Criteria
- User can go from job discovery → fit score → materials → export → apply in under 15 minutes
- Fit scores are stable for unchanged inputs
- Materials don't hallucinate experience
- Discovery shows at least 30% relevant results in top 20
- Core workflows have benchmark coverage

### Why the Next Stage Exists
Stage 1 helps the user apply. But applying is only one part of a career. The user also needs to decide *which* jobs to pursue, understand *why* they're a fit, and learn from outcomes. Stage 1 treats each application as independent. Stage 2 connects them into a career strategy.

---

## Stage 2 — Career Operating System

### Primary User
Santiago + early adopters (2-10 users, mostly technical, actively job searching)

### Main Problem Solved
The user has too many options and not enough signal. They need the system to help them *decide*, not just *apply*. Which jobs are worth pursuing? Which are stretches? Where are the capability gaps? What should they prioritize?

### Capabilities (added on top of Stage 1)
- **Career Strategy Engine** — Connects role families, career goals, and opportunity fit into a coherent strategy
- **Gap Analysis** — Identifies specific capability gaps relative to target roles
- **Guided Onboarding** — Multi-step wizard that builds the intelligence layer from first visit
- **Outcome Tracking** — Records interview results, offer data, and rejection reasons
- **Score Explanation** — Users can see exactly why a job scored the way it did
- **Reanalysis Diff** — When a score changes, users can see what changed and why
- **Smart Discovery** — Recommendations improve based on user feedback and outcomes
- **Multi-user support** — Authentication, user scoping, data isolation

### Engineering Priorities
- Add auth and multi-tenancy
- Build caching layer for all LLM results
- Add cost tracking and budget enforcement
- Make all scoring deterministic or cached
- Implement outcome feedback loop
- Build progressive disclosure UX

### Success Criteria
- User opens the system weekly to check: "What should I focus on this week?"
- Score stability: identical inputs always produce identical scores
- LLM cost per active user per month: <$2
- Onboarding: new user is productive in under 10 minutes
- Outcome data feeds back into strategy recommendations

### Why the Next Stage Exists
Stage 2 helps the user navigate a job search. But careers span decades, not months. The user also needs to understand how their capabilities are evolving, which skills are becoming more valuable, and which career moves create the most long-term leverage. Stage 2 is reactive (respond to opportunities). Stage 3 is proactive (shape the career).

---

## Stage 3 — Career Intelligence Platform

### Primary User
Professionals who think about their career as a long-term system (50-500 users, mixed technical/non-technical)

### Main Problem Solved
People don't know what they should learn, build, or pursue to maximize their career trajectory. They react to opportunities instead of creating them. No system connects their current capabilities to future market demand.

### Capabilities (added on top of Stage 2)
- **Market Intelligence** — Tracks which skills, roles, and companies are growing or declining
- **Personalized Learning Recommendations** — "To reach your target role, you should learn X"
- **Project Recommendations** — "Building a project like X would demonstrate capability Y"
- **Career Trajectory Simulation** — "If you pursue role A, your likely path is..."
- **Skill Market Value Index** — Which of your skills are most/least valuable right now
- **Career Health Score** — A composite metric of your career positioning, growth, and risk
- **Interview Intelligence** — Structured interview preparation based on role + company + fit analysis
- **Career Journal** — A living record of decisions, outcomes, and reflections

### Engineering Priorities
- Build market data pipeline (job market trends, salary data, skill demand)
- Build recommendation engine (deterministic + AI hybrid)
- Add longitudinal data model (track changes over time)
- Build learning resource integration
- Performance and scalability for hundreds of concurrent users

### Success Criteria
- User answers "What should I learn next?" using the platform
- Platform recommendations lead to measurably better interview outcomes
- Career Health Score correlates with real career outcomes over 6+ months
- Market intelligence is updated at least weekly

### Why the Next Stage Exists
Stage 3 helps individuals grow. But professional growth doesn't happen in isolation. Careers exist within organizations, networks, and communities. Stage 4 connects the individual intelligence layer to the professional ecosystem.

---

## Stage 4 — Professional Operating System

### Primary User
Professionals managing their entire professional presence (1,000-10,000 users)

### Main Problem Solved
Professional identity is fragmented across LinkedIn, resumes, portfolios, GitHub, personal sites, and dozens of applications. No system provides a unified, structured view of a professional identity that can be projected into any context.

### Capabilities (added on top of Stage 3)
- **Unified Professional Profile** — One structured identity, multiple projections (resume, LinkedIn, portfolio, etc.)
- **Network Intelligence** — Understand professional relationships, referral paths, and warm introductions
- **Company Intelligence** — Deep profiles of companies including culture, tech stack, growth trajectory, and insider perspectives
- **Negotiation Intelligence** — Salary benchmarks, offer comparison, negotiation strategy
- **Career Agent** — An AI assistant that understands your entire career context and can help with complex decisions
- **Professional Content Generation** — LinkedIn posts, blog ideas, conference talk proposals, all grounded in your evidence inventory
- **Continuous Profile Enrichment** — Every interaction (application, interview, project, course) enriches the intelligence layer

### Engineering Priorities
- Build integration layer (LinkedIn, GitHub, portfolio sites)
- Build agent framework (structured decision support)
- Scale to thousands of concurrent users
- Implement robust privacy and data ownership model
- Build revenue model (freemium → premium)

### Success Criteria
- User manages their entire professional identity from one platform
- Career Agent provides advice that users describe as "better than most human career coaches"
- Platform generates revenue from premium features
- Data privacy and ownership are demonstrably user-controlled

### Why the Next Stage Exists
Stage 4 serves individuals. But career systems don't exist in a vacuum. Organizations also need to find and evaluate talent. Stage 5 connects supply (professionals) and demand (organizations) through a shared intelligence layer.

---

## Stage 5 — CareerOps

### Primary User
Professionals + organizations (10,000+ users, B2B + B2C)

### Main Problem Solved
Hiring is broken on both sides. Candidates can't find the right opportunities. Companies can't find the right candidates. Both sides lack the structured intelligence to make better decisions. CareerOps bridges this gap with a shared intelligence protocol.

### Capabilities (added on top of Stage 4)
- **Talent Intelligence for Organizations** — Companies understand their talent needs through the same capability taxonomy
- **Mutual Fit Analysis** — Both candidate and company see the same fit assessment
- **Structured Career Marketplace** — Opportunities matched to capabilities, not keywords
- **Career Path Visualization** — "People with your profile typically transition to roles like..."
- **Industry Career Maps** — Aggregate anonymized career trajectories across industries
- **Open Career Protocol** — A standard for expressing professional capabilities that works across platforms

### Engineering Priorities
- B2B platform architecture
- Marketplace matching engine
- Privacy-preserving data aggregation
- API platform for third-party integrations
- Compliance and regulatory framework

### Success Criteria
- Companies and candidates both report better match quality
- Platform processes thousands of matches per day
- Career data contributes to a public or semi-public career intelligence commons
- Revenue sustains continued development

---

## Stage Transition Triggers

| From | To | Trigger |
|------|-----|---------|
| 1 → 2 | Core loop works reliably. Fit scores are stable. Materials are usable. Discovery is acceptable. | Santiago is using it daily for real job applications. |
| 2 → 3 | Multi-user works. Caching works. Outcomes are tracked. | First 5 users are active and providing outcome data. |
| 3 → 4 | Market data pipeline exists. Recommendations are measurably useful. | Users describe the platform as their "career home." |
| 4 → 5 | Professional identity management is mature. Agent framework is reliable. | Organizations express interest in talent intelligence. |

---

## Current Stage Assessment

Career Autopilot is in **early Stage 1**.

The core loop exists but is not yet reliable:
- Discovery quality is poor (5/10)
- Fit scores are unstable (KI-001)
- Materials are not editable (KI-010)
- No filters/search on job table (KI-008)
- No onboarding
- No caching
- No multi-user

**Priority:** Complete Stage 1 before thinking about Stage 2.

The engineering foundation (Sprint 0) is designed to support all five stages. The architecture, principles, contracts, and benchmarks are intentionally forward-looking.

---

## Principles That Must Survive All Stages

These principles from VISION.md must remain true regardless of product stage:

1. **Understand once, reuse forever** — The intelligence layer compounds.
2. **Humans decide** — AI prepares, humans approve external actions.
3. **Deterministic before AI** — Every workflow should work without LLMs.
4. **Never invent experience** — All outputs are grounded in real data.
5. **Explainable recommendations** — No black boxes at any stage.
6. **Optimize for outcomes, not activity** — Better jobs, not more applications.

---

## See Also

- **[VISION.md](VISION.md)** — Product vision and direction
- **[../decisions/ADR-003-single-user-architecture.md](../decisions/ADR-003-single-user-architecture.md)** — Stage 1 single-user decision
- **[../decisions/ADR-004-python-migration-strategy.md](../decisions/ADR-004-python-migration-strategy.md)** — Python migration strategy
- **[../engineering/ROADMAP.md](../engineering/ROADMAP.md)** — Current sprint progress
