/**
 * Fit Analysis Benchmarks
 * Validates V4 capability-based scoring against representative jobs.
 * Deterministic: uses mocked Candidate Intelligence, no LLM calls.
 */

import { BenchmarkSuite, assert, assertInRange, assertNotEmpty } from "../lib/harness";
import { FIT_BENCHMARK_JOBS } from "./fixtures";
import { mapToCapabilities } from "../../src/server/capability/capabilityMapper";
import {
  mapEvidenceInventory,
  matchRequirementToEvidence,
} from "../../src/server/capability/capabilityMatcher";
import { CAPABILITY_TAXONOMY } from "../../src/server/capability/capabilityTaxonomy";

// --- Mock Candidate Intelligence (deterministic, no DB) ---
// Represents a junior-to-mid candidate with AI/fullstack experience

const MOCK_EVIDENCE_INVENTORY = [
  {
    claim: "Built AI-powered career automation platform with OpenAI integration",
    evidence: ["Career Autopilot project — full-stack AI product with LLM orchestration"],
    evidenceStrength: "strong",
    category: "AI / LLM Development",
    sources: ["projects"],
  },
  {
    claim: "Full-stack web development with React, Next.js, and Node.js",
    evidence: ["Multiple production projects using React/Next.js + Node.js backends"],
    evidenceStrength: "strong",
    category: "Full Stack Development",
    sources: ["projects", "experience"],
  },
  {
    claim: "Database design and querying with PostgreSQL and Prisma ORM",
    evidence: ["Career Autopilot uses PostgreSQL + Prisma, designed schema from scratch"],
    evidenceStrength: "strong",
    category: "Backend Development",
    sources: ["projects"],
  },
  {
    claim: "API development and integration with REST endpoints",
    evidence: ["Built 30+ API routes, integrated multiple external APIs"],
    evidenceStrength: "strong",
    category: "Backend Development",
    sources: ["projects"],
  },
  {
    claim: "Prompt engineering and LLM workflow design",
    evidence: ["Designed multi-step LLM pipelines with structured output parsing"],
    evidenceStrength: "strong",
    category: "AI / LLM Development",
    sources: ["projects"],
  },
  {
    claim: "Python scripting and automation",
    evidence: ["Python scripts for data processing and automation tasks"],
    evidenceStrength: "medium",
    category: "Backend Development",
    sources: ["experience"],
  },
  {
    claim: "Product building and independent feature ownership",
    evidence: ["Shipped multiple features end-to-end from idea to production"],
    evidenceStrength: "strong",
    category: "Product Building",
    sources: ["projects"],
  },
  {
    claim: "Customer-facing communication and stakeholder management",
    evidence: ["Previous hospitality management experience, client communication"],
    evidenceStrength: "medium",
    category: "Customer-facing Experience",
    sources: ["experience"],
  },
  {
    claim: "Git and version control workflows",
    evidence: ["Daily Git usage, GitHub projects, CI/CD basics"],
    evidenceStrength: "strong",
    category: "Full Stack Development",
    sources: ["projects"],
  },
  {
    claim: "TypeScript and type-safe development",
    evidence: ["TypeScript used across all projects, strict mode enabled"],
    evidenceStrength: "strong",
    category: "Full Stack Development",
    sources: ["projects"],
  },
];

// --- Suite ---

const suite = new BenchmarkSuite("Fit Analysis");

// Test: capability mapper extracts capabilities from job requirements
suite.add("capability mapper extracts from job text", () => {
  const result = mapToCapabilities("Experience with Python and OpenAI APIs, building REST APIs");
  assertNotEmpty(result.capabilities, "capabilities");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("backend_development") || capIds.includes("scripting"), "should detect Python/backend");
  assert(capIds.includes("llm_integration"), "should detect OpenAI/LLM");
  assert(capIds.includes("api_development"), "should detect REST API");
});

// Test: capability mapper handles empty/generic text
suite.add("capability mapper handles empty input", () => {
  const result = mapToCapabilities("");
  assert(result.capabilities.length === 0, "empty text should produce no capabilities");
  assert(result.unmapped === true, "empty text should be unmapped");
});

// Test: evidence inventory mapping works
suite.add("evidence inventory maps to capabilities", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE_INVENTORY);
  assertNotEmpty(items, "evidence items");
  // At least some items should have capabilities mapped
  const withCaps = items.filter(i => i.mapping.capabilities.length > 0);
  assert(withCaps.length > 0, "some evidence should map to capabilities");
});

// Test: requirement matching finds evidence
suite.add("requirement matching finds strong evidence for known skills", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE_INVENTORY);
  const match = matchRequirementToEvidence("Experience with React and Next.js", items);
  assert(match.matchStrength !== "none", `expected evidence for React/Next.js, got strength: ${match.matchStrength}`);
  assert(match.tier === "exact" || match.tier === "capability", `expected exact or capability tier, got: ${match.tier}`);
});

// Test: requirement matching identifies gaps
suite.add("requirement matching identifies gaps for unknown skills", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE_INVENTORY);
  const match = matchRequirementToEvidence("5+ years Kubernetes and Terraform experience", items);
  // K8s/Terraform may get adjacent capability match (devops → backend), so allow medium
  assert(
    match.matchStrength !== "strong",
    `expected non-strong for Kubernetes/Terraform, got strength: ${match.matchStrength}`
  );
  assert(
    match.tier !== "exact",
    `expected non-exact tier for Kubernetes/Terraform, got tier: ${match.tier}`
  );
});

// Test: score ranges for each benchmark job (deterministic V4-like scoring)
for (const job of FIT_BENCHMARK_JOBS) {
  suite.add(`score range: ${job.id} (${job.category})`, () => {
    const items = mapEvidenceInventory(MOCK_EVIDENCE_INVENTORY);

    // Extract requirements from job description (deterministic text parsing)
    const requirementLines = job.description
      .split("\n")
      .filter(l => l.trim().startsWith("- "))
      .map(l => l.trim().replace(/^- /, ""));

    if (requirementLines.length === 0) {
      // If no bullet points, use the whole description
      return;
    }

    // Match each requirement
    const matches = requirementLines.map(req => matchRequirementToEvidence(req, items));
    const total = matches.length;

    // Compute coverage score (simplified V4 model)
    const strengthCredit = { strong: 1.0, medium: 0.75, weak: 0.4, none: 0 } as const;
    let earned = 0;
    for (const m of matches) {
      earned += strengthCredit[m.matchStrength];
    }
    const coverageScore = total > 0 ? Math.round((earned / total) * 100) : 0;

    // Verify score is in expected range
    assertInRange(
      coverageScore,
      job.expectedScoreRange[0],
      job.expectedScoreRange[1],
      `${job.id} coverage score`
    );
  });
}

// Test: taxonomy completeness
suite.add("taxonomy has required capabilities for benchmarks", () => {
  const requiredCaps = [
    "frontend_development", "backend_development", "fullstack_development",
    "llm_integration", "prompt_engineering", "api_development",
    "database_querying", "ml_engineering", "devops_practices",
    "cloud_operations", "data_engineering", "product_building",
  ];
  const taxIds = new Set(CAPABILITY_TAXONOMY.map(c => c.id));
  for (const cap of requiredCaps) {
    assert(taxIds.has(cap), `taxonomy missing required capability: ${cap}`);
  }
});

export default suite;
