# ADR-002: Human Approval Required

**Status:** Accepted  
**Date:** 2025-06  
**Category:** Product

## Context

Career Autopilot automates job discovery, fit analysis, and material generation. The natural progression would be to automate job applications — auto-submit CVs, auto-reply to recruiters, auto-schedule interviews.

Fully autonomous applications create risks:
- **Reputation damage** — poorly targeted applications damage professional reputation
- **Quality erosion** — automation incentivises quantity over quality
- **Trust violations** — users must control what goes out under their name
- **Legal exposure** — automated applications may violate platform terms of service
- **Ethical concerns** — misrepresenting a human decision as autonomous

## Decision

**No action that represents the user to an employer may happen without explicit human approval.**

Specifically:
1. **Job applications** — always require human click-to-submit
2. **Generated materials** — always presented for review before use
3. **Recruiter messages** — always shown for editing before sending
4. **Screening answers** — always displayed for verification

The system may **recommend**, **rank**, **draft**, and **prepare** — but never **send**, **submit**, or **apply** autonomously.

## Consequences

- **Positive:** Users maintain full control over their professional representation
- **Positive:** Every application reflects genuine human judgment
- **Positive:** No risk of spam-applying or reputation damage
- **Positive:** Builds user trust in the system
- **Negative:** Higher friction than fully automated systems
- **Negative:** Throughput limited by human review speed
- **Negative:** Some time-sensitive opportunities may be missed

## Alternatives Considered

1. **Full automation** — rejected due to reputation and ethical risks
2. **Configurable automation levels** — rejected for Stage 1; complexity without trust foundation
3. **Human-in-the-loop with defaults** — rejected; defaults create pressure to skip review
4. **Human approval required** — **selected** — safest foundation for trust

## See Also

- [PRODUCT_PRINCIPLES.md](../product/PRODUCT_PRINCIPLES.md) — Principle: human controls all outbound actions
- [PRODUCT_EVOLUTION.md](../product/PRODUCT_EVOLUTION.md) — automation increases in later stages
