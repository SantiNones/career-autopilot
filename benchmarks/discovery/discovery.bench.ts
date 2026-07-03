/**
 * Discovery Benchmarks
 * Captures current discovery scoring behavior as a baseline.
 * Measures: score distribution, top-20 precision, location quality,
 * seniority quality, role quality.
 * Deterministic: uses mock job data, no provider API calls.
 */

import { BenchmarkSuite, assert, assertInRange } from "../lib/harness";
import { scoreJob } from "../../src/server/jobScoring";

const suite = new BenchmarkSuite("Discovery");

// --- Mock candidate preferences (matches current system expectations) ---

const MOCK_PREFS = {
  id: "bench-prefs",
  createdAt: new Date(),
  updatedAt: new Date(),
  userProfileId: "bench-user",
  targetTitles: ["AI Engineer", "Full Stack Developer", "Product Engineer"],
  positiveKeywords: ["ai", "openai", "react", "next.js", "python", "typescript"],
  negativeKeywords: ["senior", "staff", "principal", "lead"],
  minNetEurPerMonth: null,
  preferredCountries: ["Spain", "Netherlands", "Germany"],
  preferredCities: ["Barcelona", "Amsterdam"],
  preferredWorkMode: "remote",
  targetSeniority: "junior",
  allowedSeniorities: ["junior", "mid"],
  excludedCountries: ["United States"],
  excludedRoleKeywords: ["devops", "sre", "security"],
  maxOnsiteDistanceKm: null,
  openToRelocation: false,
  preferredLocations: null,
  remotePreference: "remote_first",
  targetRoleKeywords: ["ai", "fullstack", "product engineer"],
  primaryCareerGoal: null,
  secondaryCareerGoals: null,
  targetRoleFamilies: null,
  acceptableSteppingStoneRoles: null,
  rolesToAvoid: null,
  careerHorizon: null,
  optimizationPriority: null,
};

// --- Test jobs representing different quality levels ---

const HIGH_QUALITY_JOB = `Junior AI Engineer
TechCorp AI | Barcelona, Spain | Remote

We are looking for a Junior AI Engineer to join our team.
Build AI-powered features with Python and OpenAI APIs.
React and Next.js frontend development.
TypeScript required. PostgreSQL experience valued.
English fluency required. 1-2 years experience.`;

const MEDIUM_QUALITY_JOB = `Full Stack Developer
StartupCo | Berlin, Germany | Hybrid

Looking for a full stack developer.
React, Node.js, PostgreSQL.
3-5 years of experience preferred.
German language helpful.`;

const LOW_QUALITY_JOB = `Senior Staff Engineer — Infrastructure
BigCorp | San Francisco, USA | On-site

10+ years distributed systems experience required.
Kubernetes, Terraform, AWS at scale.
PhD preferred. US citizenship required.
On-call rotation mandatory.`;

const IRRELEVANT_JOB = `Marketing Manager
Agency Inc | New York, USA | On-site

5+ years marketing experience.
Campaign management, SEO, social media strategy.
MBA preferred.`;

// --- Score Distribution Tests ---

suite.add("high quality job scores above average", () => {
  const result = scoreJob(HIGH_QUALITY_JOB, MOCK_PREFS);
  assertInRange(result.totalScore, 35, 100, "high quality job score");
  assert(
    result.label !== "SKIP",
    `expected non-SKIP for high quality job, got ${result.label}`
  );
});

suite.add("medium quality job scores in reasonable range", () => {
  const result = scoreJob(MEDIUM_QUALITY_JOB, MOCK_PREFS);
  assertInRange(result.totalScore, 10, 70, "medium quality job score");
});

suite.add("low quality job scores below APPLY threshold", () => {
  const result = scoreJob(LOW_QUALITY_JOB, MOCK_PREFS);
  assertInRange(result.totalScore, 0, 55, "low quality job (senior/infrastructure)");
  assert(
    result.label === "SKIP" || result.label === "MAYBE",
    `expected SKIP or MAYBE for senior infra, got ${result.label}`
  );
});

suite.add("irrelevant job scores very low", () => {
  const result = scoreJob(IRRELEVANT_JOB, MOCK_PREFS);
  assertInRange(result.totalScore, 0, 40, "irrelevant marketing job");
  assert(result.label === "SKIP", `expected SKIP for marketing, got ${result.label}`);
});

// --- Scoring Component Tests ---

suite.add("scoring returns all required components", () => {
  const result = scoreJob(HIGH_QUALITY_JOB, MOCK_PREFS);
  assert(typeof result.totalScore === "number", "totalScore must be number");
  assert(typeof result.seniorityFit === "number", "seniorityFit must be number");
  assert(typeof result.stackFit === "number", "stackFit must be number");
  assert(typeof result.domainFit === "number", "domainFit must be number");
  assert(typeof result.languageFit === "number", "languageFit must be number");
  assert(typeof result.geographyFit === "number", "geographyFit must be number");
  assert(typeof result.label !== "undefined", "label must be defined");
});

suite.add("scoring produces reasons and risks", () => {
  const result = scoreJob(HIGH_QUALITY_JOB, MOCK_PREFS);
  assert(Array.isArray(result.reasons), "reasons must be array");
  assert(Array.isArray(result.risks), "risks must be array");
  assert(Array.isArray(result.gaps), "gaps must be array");
});

// --- Location Quality ---

suite.add("Spain/Barcelona job gets geography bonus", () => {
  const spainJob = "AI Developer\nCompany | Barcelona, Spain | Remote\nPython, AI, React. English required.";
  const usJob = "AI Developer\nCompany | San Francisco, USA | On-site\nPython, AI, React. English required.";
  const spainScore = scoreJob(spainJob, MOCK_PREFS);
  const usScore = scoreJob(usJob, MOCK_PREFS);
  assert(spainScore.geographyFit >= usScore.geographyFit, "Spain should score >= US for geography");
});

// --- Seniority Quality ---

suite.add("junior job scores higher seniority fit than senior", () => {
  const juniorJob = "Junior AI Engineer\nCompany | Remote\nEntry level. Python, React.";
  const seniorJob = "Senior Staff AI Engineer\nCompany | Remote\n10+ years. Python, React.";
  const juniorScore = scoreJob(juniorJob, MOCK_PREFS);
  const seniorScore = scoreJob(seniorJob, MOCK_PREFS);
  assert(
    juniorScore.seniorityFit >= seniorScore.seniorityFit,
    `junior seniority (${juniorScore.seniorityFit}) should be >= senior (${seniorScore.seniorityFit})`
  );
});

// --- Role Quality ---

suite.add("AI role scores higher stack fit than DevOps", () => {
  const aiJob = "AI Engineer\nCompany | Remote\nPython, OpenAI, React, LLM workflows.";
  const devopsJob = "DevOps Engineer\nCompany | Remote\nKubernetes, Terraform, AWS, Jenkins.";
  const aiScore = scoreJob(aiJob, MOCK_PREFS);
  const devopsScore = scoreJob(devopsJob, MOCK_PREFS);
  assert(
    aiScore.stackFit >= devopsScore.stackFit,
    `AI stack fit (${aiScore.stackFit}) should be >= DevOps (${devopsScore.stackFit})`
  );
});

// --- Determinism ---

suite.add("scoring is deterministic (same input = same output)", () => {
  const result1 = scoreJob(HIGH_QUALITY_JOB, MOCK_PREFS);
  const result2 = scoreJob(HIGH_QUALITY_JOB, MOCK_PREFS);
  assert(result1.totalScore === result2.totalScore, "same input should produce same score");
  assert(result1.label === result2.label, "same input should produce same label");
});

// --- Negative keyword handling ---

suite.add("negative keywords reduce scoring", () => {
  const cleanJob = "AI Engineer\nCompany | Remote\nPython, OpenAI, React.";
  const negativeJob = "Senior Principal AI Engineer\nCompany | Remote\nPython, OpenAI, React. Lead a team of 10.";
  const cleanScore = scoreJob(cleanJob, MOCK_PREFS);
  const negativeScore = scoreJob(negativeJob, MOCK_PREFS);
  assert(
    cleanScore.totalScore >= negativeScore.totalScore,
    `clean job (${cleanScore.totalScore}) should score >= negative-keyword job (${negativeScore.totalScore})`
  );
});

export default suite;
