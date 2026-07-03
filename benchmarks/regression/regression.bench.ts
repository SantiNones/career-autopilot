/**
 * Regression Suite
 * Cross-cutting checks that validate system-wide invariants:
 * - Score stability (determinism)
 * - Type safety of critical interfaces
 * - Module boundary respect (no circular imports)
 * - Export correctness
 */

import { BenchmarkSuite, assert } from "../lib/harness";
import { scoreJob } from "../../src/server/jobScoring";
import { mapToCapabilities, confidenceRank } from "../../src/server/capability/capabilityMapper";
import { matchRequirementToEvidence, mapEvidenceInventory } from "../../src/server/capability/capabilityMatcher";
import { CAPABILITY_TAXONOMY, CAPABILITY_INDEX } from "../../src/server/capability/capabilityTaxonomy";
import { generateMaterials } from "../../src/server/materialGeneration";
import { parseJobFromHtml, validateIngestInput, looksLikeUrl, isLikelyJobUrl, validateJobPage } from "../../src/server/jobParsing";

const suite = new BenchmarkSuite("Regression");

// --- Score Stability ---

suite.add("heuristic scoring is stable across repeated calls", () => {
  const prefs = {
    targetTitles: ["AI Engineer"],
    positiveKeywords: ["python", "react", "openai"],
    negativeKeywords: ["senior"],
    preferredCountries: ["Spain"],
    excludedCountries: ["United States"],
    targetSeniority: "junior",
    allowedSeniorities: ["junior", "mid"],
    openToRelocation: false,
  };
  const jobText = "Junior AI Engineer\nTechCorp | Barcelona | Remote\nPython, OpenAI, React. 1-2 years.";

  const scores: number[] = [];
  for (let i = 0; i < 10; i++) {
    const result = scoreJob(jobText, prefs as unknown as Parameters<typeof scoreJob>[1]);
    scores.push(result.totalScore);
  }

  const allSame = scores.every(s => s === scores[0]);
  assert(allSame, `scoring should be deterministic, got: ${[...new Set(scores)].join(", ")}`);
});

suite.add("capability mapper is stable across repeated calls", () => {
  const text = "Python developer with React, OpenAI API integration, and PostgreSQL";

  const results: number[] = [];
  for (let i = 0; i < 10; i++) {
    const result = mapToCapabilities(text);
    results.push(result.capabilities.length);
  }

  const allSame = results.every(r => r === results[0]);
  assert(allSame, `capability mapping should be deterministic, got: ${[...new Set(results)].join(", ")}`);
});

// --- Export Correctness ---

suite.add("jobScoring exports scoreJob function", () => {
  assert(typeof scoreJob === "function", "scoreJob should be exported");
});

suite.add("capabilityMapper exports expected functions", () => {
  assert(typeof mapToCapabilities === "function", "mapToCapabilities should be exported");
  assert(typeof confidenceRank === "function", "confidenceRank should be exported");
  assert(typeof matchRequirementToEvidence === "function", "matchRequirementToEvidence should be exported");
  assert(typeof mapEvidenceInventory === "function", "mapEvidenceInventory should be exported");
});

suite.add("capabilityTaxonomy exports expected data", () => {
  assert(Array.isArray(CAPABILITY_TAXONOMY), "CAPABILITY_TAXONOMY should be an array");
  assert(CAPABILITY_TAXONOMY.length > 0, "CAPABILITY_TAXONOMY should not be empty");
  assert(CAPABILITY_INDEX instanceof Map, "CAPABILITY_INDEX should be a Map");
});

suite.add("materialGeneration exports generateMaterials", () => {
  assert(typeof generateMaterials === "function", "generateMaterials should be exported");
});

suite.add("jobParsing exports expected functions", () => {
  assert(typeof parseJobFromHtml === "function", "parseJobFromHtml should be exported");
  assert(typeof validateIngestInput === "function", "validateIngestInput should be exported");
  assert(typeof looksLikeUrl === "function", "looksLikeUrl should be exported");
  assert(typeof isLikelyJobUrl === "function", "isLikelyJobUrl should be exported");
  assert(typeof validateJobPage === "function", "validateJobPage should be exported");
});

// --- Interface Shape Checks ---

suite.add("scoreJob returns expected shape", () => {
  const result = scoreJob("AI Engineer\nCompany | Remote\nPython, React.", null);
  assert(typeof result.totalScore === "number", "totalScore must be number");
  assert(typeof result.label === "string", "label must be string");
  assert(Array.isArray(result.reasons), "reasons must be array");
  assert(Array.isArray(result.risks), "risks must be array");
  assert(Array.isArray(result.gaps), "gaps must be array");
  assert(typeof result.seniorityFit === "number", "seniorityFit must be number");
  assert(typeof result.stackFit === "number", "stackFit must be number");
  assert(typeof result.geographyFit === "number", "geographyFit must be number");
});

suite.add("mapToCapabilities returns expected shape", () => {
  const result = mapToCapabilities("Python and React development");
  assert(typeof result.text === "string", "text must be string");
  assert(Array.isArray(result.capabilities), "capabilities must be array");
  assert(typeof result.source === "string", "source must be string");
  assert(typeof result.unmapped === "boolean", "unmapped must be boolean");
  if (result.capabilities.length > 0) {
    const cap = result.capabilities[0];
    assert(typeof cap.capabilityId === "string", "capabilityId must be string");
    assert(typeof cap.confidence === "string", "confidence must be string");
    assert(typeof cap.matchedTerm === "string", "matchedTerm must be string");
  }
});

suite.add("parseJobFromHtml returns expected shape", () => {
  const html = `<html><head><title>Test Job</title></head><body><h1>Engineer</h1><p>Description</p></body></html>`;
  const result = parseJobFromHtml("https://example.com/jobs/1", html);
  assert(typeof result.rawText === "string", "rawText must be string");
  assert(typeof result.parsedJson === "object", "parsedJson must be object");
});

// --- Score Bounds ---

suite.add("scores are always within 0-100 range", () => {
  const testCases = [
    "Senior Staff Principal Engineer | 15 years required | Kubernetes | PhD",
    "Junior Intern | Entry level | No experience needed",
    "AI Python React OpenAI TypeScript Node.js PostgreSQL Barcelona Remote Junior",
    "",
  ];
  for (const text of testCases) {
    const result = scoreJob(text, null);
    assert(result.totalScore >= 0, `score should be >= 0, got ${result.totalScore} for: ${text.slice(0, 30)}`);
    assert(result.totalScore <= 100, `score should be <= 100, got ${result.totalScore} for: ${text.slice(0, 30)}`);
  }
});

suite.add("labels are valid enum values", () => {
  const validLabels = new Set(["APPLY", "APPLY_STRETCH", "MAYBE", "SKIP"]);
  const texts = [
    "Junior AI Engineer | Barcelona | Python OpenAI React",
    "Senior Staff SRE | San Francisco | 10 years Kubernetes",
    "Marketing Manager | MBA required",
  ];
  for (const text of texts) {
    const result = scoreJob(text, null);
    assert(validLabels.has(result.label), `label "${result.label}" should be valid for: ${text.slice(0, 30)}`);
  }
});

export default suite;
