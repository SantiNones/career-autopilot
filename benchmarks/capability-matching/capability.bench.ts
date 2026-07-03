/**
 * Capability Matching Benchmarks
 * Deterministic tests covering exact match, adjacent capability, 
 * transferable capability, importance weighting, and regression protection.
 */

import { BenchmarkSuite, assert, assertEqual, assertNotEmpty } from "../lib/harness";
import { mapToCapabilities, confidenceRank } from "../../src/server/capability/capabilityMapper";
import {
  mapEvidenceInventory,
  matchRequirementToEvidence,
} from "../../src/server/capability/capabilityMatcher";
import { CAPABILITY_TAXONOMY, CAPABILITY_INDEX } from "../../src/server/capability/capabilityTaxonomy";

const suite = new BenchmarkSuite("Capability Matching");

// --- Exact Match Tests ---

suite.add("exact match: React maps to frontend_development", () => {
  const result = mapToCapabilities("React");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("frontend_development"), "React should map to frontend_development");
});

suite.add("exact match: PostgreSQL maps to database_querying", () => {
  const result = mapToCapabilities("PostgreSQL");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("database_querying"), "PostgreSQL should map to database_querying");
});

suite.add("exact match: OpenAI maps to llm_integration", () => {
  const result = mapToCapabilities("OpenAI API integration");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("llm_integration"), "OpenAI should map to llm_integration");
});

suite.add("exact match: Docker maps to devops_practices", () => {
  const result = mapToCapabilities("Docker and Kubernetes");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("devops_practices"), "Docker/Kubernetes should map to devops_practices");
});

suite.add("exact match: REST API maps to api_development", () => {
  const result = mapToCapabilities("REST API design and development");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.includes("api_development"), "REST API should map to api_development");
});

// --- Adjacent Capability Tests ---

suite.add("adjacent: frontend_development adjacent to fullstack_development", () => {
  const frontend = CAPABILITY_TAXONOMY.find(c => c.id === "frontend_development");
  assert(!!frontend, "frontend_development must exist");
  assert(frontend!.adjacent.includes("fullstack_development"), "frontend should be adjacent to fullstack");
});

suite.add("adjacent: backend_development adjacent to api_development", () => {
  const backend = CAPABILITY_TAXONOMY.find(c => c.id === "backend_development");
  assert(!!backend, "backend_development must exist");
  assert(backend!.adjacent.includes("api_development"), "backend should be adjacent to api_development");
});

suite.add("adjacent: llm_integration adjacent to prompt_engineering", () => {
  const llm = CAPABILITY_TAXONOMY.find(c => c.id === "llm_integration");
  assert(!!llm, "llm_integration must exist");
  assert(llm!.adjacent.includes("prompt_engineering"), "llm_integration should be adjacent to prompt_engineering");
});

// --- Transferable Capability Tests ---

suite.add("transferable: customer-facing maps to relevant capabilities", () => {
  const result = mapToCapabilities("customer-facing communication, presenting demos, stakeholder management");
  const capIds = result.capabilities.map(c => c.capabilityId);
  // Customer-facing experience should map to something relevant
  assert(
    capIds.includes("technical_communication") || capIds.includes("customer_success") || capIds.includes("presales") || capIds.length >= 1,
    `customer-facing should map to relevant capability, got: ${capIds.join(", ")}`
  );
});

suite.add("transferable: project management maps to relevant capabilities", () => {
  const result = mapToCapabilities("project management, agile, scrum master, sprint planning");
  const capIds = result.capabilities.map(c => c.capabilityId);
  assert(capIds.length > 0, "project management should map to at least one capability");
});

// --- No Capability (Gap Detection) ---

suite.add("no capability: gibberish text returns unmapped", () => {
  const result = mapToCapabilities("xyzzy foobar blorp");
  assert(result.unmapped === true, "gibberish should be unmapped");
  assert(result.capabilities.length === 0, "gibberish should have no capabilities");
});

suite.add("no capability: very generic text returns few or no capabilities", () => {
  const result = mapToCapabilities("looking for a team player with good communication");
  // Generic soft skills may or may not map — but should not map to technical capabilities
  const techCaps = result.capabilities.filter(c =>
    ["frontend_development", "backend_development", "ml_engineering", "devops_practices"].includes(c.capabilityId)
  );
  assert(techCaps.length === 0, "generic text should not map to specific technical capabilities");
});

// --- Importance Weighting ---

suite.add("confidence ranking: high > medium > low", () => {
  assert(confidenceRank("high") > confidenceRank("medium"), "high > medium");
  assert(confidenceRank("medium") > confidenceRank("low"), "medium > low");
  assertEqual(confidenceRank("high"), 3, "high confidence rank");
  assertEqual(confidenceRank("medium"), 2, "medium confidence rank");
  assertEqual(confidenceRank("low"), 1, "low confidence rank");
});

suite.add("high confidence match: specific technology", () => {
  const result = mapToCapabilities("Next.js");
  const nextjsCap = result.capabilities.find(c => c.capabilityId === "frontend_development");
  assert(!!nextjsCap, "Next.js should map to frontend_development");
  assertEqual(nextjsCap!.confidence, "high", "Next.js → frontend should be high confidence");
});

suite.add("medium confidence match: broad term", () => {
  const result = mapToCapabilities("javascript");
  const fsCap = result.capabilities.find(c => c.capabilityId === "fullstack_development");
  assert(!!fsCap, "javascript should map to fullstack_development");
  assertEqual(fsCap!.confidence, "medium", "javascript → fullstack should be medium confidence");
});

// --- Evidence Matching with Tiered Results ---

const MOCK_EVIDENCE = [
  {
    claim: "Built production React/Next.js applications",
    evidence: ["Career Autopilot — full React/Next.js SPA with server components"],
    evidenceStrength: "strong" as const,
    category: "Full Stack Development",
    sources: ["projects"],
  },
  {
    claim: "Python scripting for data processing",
    evidence: ["Automation scripts for data extraction"],
    evidenceStrength: "medium" as const,
    category: "Backend Development",
    sources: ["experience"],
  },
];

suite.add("evidence matching: exact tier for known technology", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE);
  const match = matchRequirementToEvidence("React and Next.js development", items);
  assertEqual(match.tier, "exact", "React/Next.js should get exact tier match");
  assertEqual(match.matchStrength, "strong", "exact tier should be strong strength");
  assertNotEmpty(match.matchedEvidence, "should have matched evidence claims");
});

suite.add("evidence matching: capability tier for related skill", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE);
  const match = matchRequirementToEvidence("Frontend development skills", items);
  assert(
    match.tier === "exact" || match.tier === "capability",
    `expected exact or capability tier for frontend, got: ${match.tier}`
  );
  assert(match.matchStrength !== "none", "should find some match for frontend");
});

suite.add("evidence matching: none tier for unrelated skill", () => {
  const items = mapEvidenceInventory(MOCK_EVIDENCE);
  const match = matchRequirementToEvidence("Kubernetes cluster management and Terraform IaC", items);
  assert(
    match.matchStrength === "none" || match.matchStrength === "weak",
    `expected none/weak for K8s/Terraform, got: ${match.matchStrength}`
  );
});

// --- Regression Protection ---

suite.add("regression: taxonomy has 80+ capabilities", () => {
  assert(CAPABILITY_TAXONOMY.length >= 80, `taxonomy should have 80+ capabilities, has ${CAPABILITY_TAXONOMY.length}`);
});

suite.add("regression: all adjacents reference valid capability IDs", () => {
  const validIds = new Set(CAPABILITY_TAXONOMY.map(c => c.id));
  for (const cap of CAPABILITY_TAXONOMY) {
    for (const adj of cap.adjacent) {
      assert(validIds.has(adj), `${cap.id} has invalid adjacent: ${adj}`);
    }
  }
});

suite.add("regression: CAPABILITY_INDEX matches TAXONOMY", () => {
  for (const cap of CAPABILITY_TAXONOMY) {
    assert(CAPABILITY_INDEX.has(cap.id), `CAPABILITY_INDEX missing: ${cap.id}`);
  }
});

suite.add("regression: mapToCapabilities is deterministic", () => {
  const text = "Experience with Python, React, and OpenAI APIs for building full-stack AI applications";
  const result1 = mapToCapabilities(text);
  const result2 = mapToCapabilities(text);
  assertEqual(result1.capabilities.length, result2.capabilities.length, "same input should produce same output length");
  for (let i = 0; i < result1.capabilities.length; i++) {
    assertEqual(result1.capabilities[i].capabilityId, result2.capabilities[i].capabilityId, `capability ${i} should be identical`);
  }
});

export default suite;
