# Career Autopilot — Product Principles

Last updated: 2026-07-01  
Owner: Santiago Nones  
Reference: VISION.md (constitution)

This document defines the operating principles of Career Autopilot.  
VISION.md is the highest-level document. These principles are derived from it.  
Every feature, subsystem, and design decision must be consistent with these principles.

---

## Product Principles

1. **Optimize for career outcomes, not activity.** The product should never optimize for submitting the highest number of applications. It should optimize for obtaining better opportunities with less wasted effort. Features that increase application volume without improving outcomes are anti-features.

2. **Understand once, reuse forever.** The user should never have to repeatedly explain who they are. Every document, resume, project, interview, application and interaction should enrich a permanent intelligence layer. Everything else should be generated from that layer.

3. **The product is the intelligence layer.** Career Autopilot is not a resume builder, a cover letter generator, or an auto-apply bot. Those may exist as features. The product is the structured professional intelligence behind them.

4. **Every recommendation must be explainable.** If the system recommends a job, the user must be able to see why. If the system assigns a score, the user must be able to trace it back to evidence. No black boxes.

5. **Human approves every external action.** The system never sends applications, emails, or messages on behalf of the user without explicit approval. Career decisions have long-term consequences. AI can prepare. Humans decide.

6. **Never invent candidate experience.** Materials, CVs, cover letters, and screening answers must be grounded in the candidate's actual resume, projects, and experience. Fabricating skills, roles, or achievements is a hard failure.

7. **Build reusable career assets, not disposable outputs.** A tailored CV, a well-structured evidence inventory, a calibrated candidate intelligence model — these are assets that compound across applications. Isolated one-off outputs are less valuable.

8. **Every feature must answer a product question.** Every major feature should answer at least one of: Does it help the user understand themselves? Understand the market? Discover opportunities? Evaluate opportunities? Close capability gaps? Produce better materials? Track progress? Learn from outcomes? If the answer is "no", the feature does not belong in Career Autopilot.

9. **Degrade gracefully.** Every workflow must produce useful output even when parts of the system are unavailable. No AI? Use deterministic scoring. No fit analysis? Show heuristic scores. No internet? Show cached results.

10. **Enrich continuously.** The system should continuously become more useful as more information is added. Every application, every interview, every outcome should feed back into the intelligence layer.

---

## Engineering Principles

11. **Deterministic before AI.** If a rule-based system produces equivalent value, use it. LLMs are expensive, non-deterministic, and hard to test. Heuristic scoring, keyword classifiers, and taxonomy matching are preferred defaults.

12. **Single responsibility per module.** Each subsystem does one thing. It has clear inputs, clear outputs, and no hidden side effects. A new engineer should understand any module in under 30 minutes.

13. **Easy to debug.** Every subsystem must produce enough information to diagnose failures without adding temporary logging. Inputs, outputs, and intermediate state should be traceable.

14. **Cheap to test.** Deterministic modules must be testable without network calls, databases, or API keys. Benchmark fixtures should run in seconds. If a module can't be tested cheaply, it should be redesigned.

15. **Replaceable without rewriting.** Any module should be swappable — a different LLM provider, a different scoring algorithm, a different export format — without cascading changes through the rest of the system.

16. **Prefer maintainability over cleverness.** Code that a tired engineer can understand at 11pm is better than code that's elegant but opaque. No clever abstractions without clear justification.

17. **Benchmarks before shipping.** Every scoring change, classifier update, or generation modification must be validated against benchmark fixtures before it reaches production. Regressions are caught before users see them.

---

## AI Principles

18. **AI only where reasoning creates meaningful user value.** Use LLMs for tasks that require synthesis, judgment, or natural language generation that can't be replicated by templates or rules. Examples: candidate intelligence generation, material personalization, requirement extraction for complex job descriptions.

19. **Cache before calling an LLM twice.** If the inputs haven't changed, the output shouldn't be recomputed. Every LLM call must be cacheable by input hash. Identical inputs must never trigger a second API call.

20. **Every expensive AI call must have measurable value.** Before adding an LLM call, answer: What does this produce that a deterministic system cannot? What is the cost per invocation? How often will it be called? What is the caching strategy?

21. **Every workflow should work without AI.** If OpenAI is down, the system should still score jobs, classify locations, match evidence, and display the pipeline. AI enhances; it should never be a single point of failure.

22. **No AI in hot paths.** Discovery scoring, job table rendering, pipeline display, and status updates must never call an LLM. AI calls belong in user-triggered, async, cacheable operations only.

---

## Cost Principles

23. **Measure every dollar.** Every LLM call must log its token count, model, and approximate cost. Aggregate cost must be visible to the developer. Eventually, approximate cost should be visible to the user before triggering expensive operations.

24. **Deterministic operations cost zero.** Scoring, classification, matching, export, and pipeline operations must have zero marginal API cost. Only user-triggered intelligence and generation operations should cost money.

25. **Recurring cost requires recurring value.** If a feature costs money every time it runs, it must produce proportional value every time. Regenerating identical materials is waste. Reanalyzing unchanged jobs is waste.

26. **Design for 10,000 users.** If this product had 10,000 active users tomorrow, every cost decision would be amplified 10,000x. Design cost structures that scale linearly with value, not with usage.

27. **Budget before building.** Before implementing any feature that involves OpenAI, estimate: cost per user per month, cost per operation, number of expected operations, and caching savings.

---

## Reliability Principles

28. **Deterministic scoring is the foundation.** Heuristic scoring, location classification, seniority detection, and capability matching are deterministic. They must produce identical outputs for identical inputs. Always. No exceptions.

29. **Score stability is a product requirement.** If the job description hasn't changed and the candidate profile hasn't changed, the fit score must not change. Score instability is a bug, not a feature.

30. **Fail visibly.** When something breaks, the user must know. Silent failures — a fit analysis that silently returns a default score, a material generation that swallows an error — are worse than visible errors.

31. **Isolate external dependencies.** Provider API failures (Greenhouse down, Lever rate-limited, Ashby timeout) must not cascade. Each provider fails independently. Each LLM call fails independently.

32. **Contracts enforce correctness.** Every subsystem has defined contracts: valid input ranges, guaranteed output properties, forbidden behaviors. Violations are bugs, not edge cases.

---

## UX Principles

33. **Functional before beautiful.** A working filter is more valuable than a polished animation. Ship utility first, then polish. Users forgive rough edges; they don't forgive broken workflows.

34. **The user controls what they see.** If discovery quality is poor, the user must be able to hide recommendations. If a score seems wrong, the user must be able to see why. If materials need editing, the user must be able to edit them.

35. **Fast feedback loops.** Ingesting a job, checking a score, changing a status — these are high-frequency actions. They must feel instant. Async operations (fit analysis, material generation) must show clear loading states.

36. **Progressive complexity.** New users see the simplest version. Power features (evidence inventory, positioning strategy, benchmark results) are accessible but not overwhelming.

37. **Structured, not conversational.** The experience should feel like a senior career advisor and a trusted engineering tool — not ChatGPT with buttons, not a prompt playground, not a collection of disconnected tools. The product should be structured, predictable and trustworthy.

---

## Portfolio Principles

38. **Every architecture decision must be defensible in an interview.** "Why did you build it this way?" must have a clear, technical answer grounded in tradeoffs — not "because it was faster" or "because the AI suggested it."

39. **The codebase is the portfolio.** Clean code, clear naming, well-organized modules, comprehensive documentation — these demonstrate engineering maturity more than features do.

40. **Show the thinking, not just the output.** Documentation of decisions, tradeoffs, benchmarks, and known issues demonstrates engineering judgment. The audit trail matters as much as the final product.

41. **Build systems, not scripts.** Every feature should be designed as part of a coherent system. Isolated hacks and one-off fixes erode the portfolio value of the project.

42. **Maintain for years, not weeks.** Decisions made today must still make sense in 12 months. Dependencies, abstractions, and architectural choices should favor long-term maintainability.

---

## See Also

- **[VISION.md](VISION.md)** — Product vision
- **[../engineering/SPRINT_RULES.md](../engineering/SPRINT_RULES.md)** — Sprint operating rules
- **[../decisions/ADR-001-deterministic-first.md](../decisions/ADR-001-deterministic-first.md)** — Deterministic-first decision
- **[../decisions/ADR-002-human-approval-required.md](../decisions/ADR-002-human-approval-required.md)** — Human approval decision
- **[../decisions/ADR-005-evidence-grounding.md](../decisions/ADR-005-evidence-grounding.md)** — Evidence grounding decision
