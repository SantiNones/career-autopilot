/**
 * Material Generation Benchmarks
 * Validates that template-based materials never invent experience,
 * always use evidence, produce all required sections, and remain structurally valid.
 * Deterministic: uses the template generator, not OpenAI.
 */

import { BenchmarkSuite, assert, assertEqual, assertContainsAny } from "../lib/harness";

// We import the module dynamically to avoid triggering any DB or OpenAI connections
// The materialGeneration.ts is a pure function module with no side effects on import
const suite = new BenchmarkSuite("Material Generation");

// --- Mock inputs (representative of real usage) ---

const MOCK_PROFILE = {
  fullName: "Santiago Nones",
  headline: "Full Stack Developer & AI Product Engineer",
  location: "Barcelona, Spain",
  phone: "+34 600 000 000",
  email: "santi@example.com",
  linkedinUrl: "https://linkedin.com/in/santinones",
  githubUrl: "https://github.com/SantiNones",
  portfolioUrl: null,
  languages: ["English", "Spanish"],
};

const MOCK_PREFS = {
  targetTitles: ["AI Engineer", "Full Stack Developer", "Product Engineer"],
  targetSeniority: "junior",
};

const MOCK_RESUME = {
  summary: "Full-stack developer with experience building AI-powered applications using React, Next.js, Python, and OpenAI APIs.",
  experience: "Operations Manager — Hospitality Group (2019-2023)\nManaged team of 15, implemented digital processes\n\nFreelance Developer (2023-present)\nBuilt web applications for small businesses",
  projects: "Career Autopilot — AI career management platform\nNext.js, Prisma, PostgreSQL, OpenAI\n\nProjectFlow AI — AI project management tool\nReact, Node.js, OpenAI integration",
  skills: "TypeScript, React, Next.js, Python, PostgreSQL, Prisma, OpenAI API, Node.js, TailwindCSS, Git",
  education: "Self-taught developer with structured learning path in CS fundamentals",
  languages: "English (Fluent), Spanish (Native)",
  links: "GitHub: github.com/SantiNones | LinkedIn: linkedin.com/in/santinones",
};

const MOCK_JOB = {
  title: "Junior AI Engineer",
  companyName: "TechCorp",
  location: "Barcelona, Spain",
  rawText: "We are looking for a Junior AI Engineer to join our team. Requirements: Python, OpenAI APIs, React, SQL.",
};

const MOCK_EVALUATION = {
  label: "APPLY",
  totalScore: 72,
  narrativeSuggestion: "Strong AI project experience with relevant full-stack background.",
};

const MOCK_FIT_ANALYSIS = {
  recommendedAngle: "Junior AI Engineer",
  jobFocus: "AI Development",
  matchingSkills: ["python", "openai", "react", "sql"],
  matchingProjects: ["Career Autopilot"],
  strengths: ["AI/LLM integration", "Full-stack development"],
  gaps: ["Production ML experience"],
  confidenceScore: 72,
  seniorityDetected: "Junior",
};

// --- Test: generated CV structure ---

suite.add("template CV contains candidate name", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assert(result.tailoredCv.includes("Santiago Nones"), "CV must contain candidate name");
});

suite.add("template CV contains candidate headline or angle", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  // V2 CV uses candidate headline, not job title
  assertContainsAny(result.tailoredCv, ["Full Stack", "AI", "Developer", "Engineer"], "CV should reference candidate profile or angle");
});

suite.add("template CV has required sections", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  const cvUpper = result.tailoredCv.toUpperCase();
  assert(cvUpper.includes("EXPERIENCE") || cvUpper.includes("WORK"), "CV must have experience section");
  assert(cvUpper.includes("SKILLS") || cvUpper.includes("SKILL"), "CV must have skills section");
});

suite.add("template CV does NOT invent experience", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  // The CV should only contain information from the resume/profile, not fabricated
  const fabricatedCompanies = ["Google", "Meta", "Amazon", "Microsoft", "Netflix"];
  for (const company of fabricatedCompanies) {
    assert(!result.tailoredCv.includes(company), `CV must not fabricate experience at ${company}`);
  }
});

// --- Test: cover letter structure ---

suite.add("template cover letter addresses company", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assert(result.coverLetter.includes("TechCorp"), "Cover letter must reference company name");
});

suite.add("template cover letter mentions role", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assertContainsAny(result.coverLetter, ["Junior AI Engineer", "AI Engineer"], "Cover letter should mention the role");
});

suite.add("template cover letter is signed by candidate", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assert(result.coverLetter.includes("Santiago Nones"), "Cover letter must be signed by candidate");
});

// --- Test: recruiter message structure ---

suite.add("template recruiter message is concise", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  const lines = result.recruiterMessage.split("\n").filter(l => l.trim().length > 0);
  assert(lines.length <= 20, `Recruiter message should be concise, has ${lines.length} lines`);
});

suite.add("template recruiter message mentions role", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assertContainsAny(result.recruiterMessage, ["Junior AI Engineer", "TechCorp"], "Recruiter message should mention role or company");
});

// --- Test: screening answers structure ---

suite.add("template screening answers has Q&A format", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  const qCount = (result.screeningAnswers.match(/^Q:/gm) || []).length;
  const aCount = (result.screeningAnswers.match(/^A:/gm) || []).length;
  assert(qCount >= 3, `Screening answers should have 3+ questions, has ${qCount}`);
  assert(aCount >= 3, `Screening answers should have 3+ answers, has ${aCount}`);
  assertEqual(qCount, aCount, "questions and answers count");
});

suite.add("template screening answers do not fabricate", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  const fabricatedClaims = ["10 years", "PhD", "Stanford", "MIT", "Google"];
  for (const claim of fabricatedClaims) {
    assert(!result.screeningAnswers.includes(claim), `Screening answers must not fabricate: ${claim}`);
  }
});

// --- Test: all material types are non-empty ---

suite.add("all 4 material types are generated", async () => {
  const { generateMaterials } = await import("../../src/server/materialGeneration");
  const result = generateMaterials(MOCK_JOB, MOCK_PROFILE, MOCK_PREFS, MOCK_RESUME, MOCK_EVALUATION, MOCK_FIT_ANALYSIS);
  assert(result.tailoredCv.length > 100, "CV should be substantial");
  assert(result.coverLetter.length > 100, "Cover letter should be substantial");
  assert(result.recruiterMessage.length > 50, "Recruiter message should be substantial");
  assert(result.screeningAnswers.length > 100, "Screening answers should be substantial");
});

export default suite;
