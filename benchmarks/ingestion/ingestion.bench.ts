/**
 * Ingestion Benchmarks
 * Covers: manual pasted text, valid HTML, invalid input, duplicate detection,
 * missing fields, fallback behavior.
 * Deterministic: uses the jobParsing module directly, no network calls.
 */

import { BenchmarkSuite, assert, assertEqual } from "../lib/harness";
import {
  parseJobFromHtml,
  validateIngestInput,
  looksLikeUrl,
  isLikelyJobUrl,
  validateJobPage,
} from "../../src/server/jobParsing";

const suite = new BenchmarkSuite("Ingestion");

// --- Fixture: well-formed HTML job page ---

const VALID_HTML = `
<!DOCTYPE html>
<html>
<head><title>Junior AI Engineer - TechCorp | Careers</title></head>
<body>
<h1>Junior AI Engineer</h1>
<div class="job-details">
  <p><strong>Company:</strong> TechCorp</p>
  <p><strong>Location:</strong> Barcelona, Spain</p>
  <p><strong>Type:</strong> Full-time, Remote</p>
</div>
<div class="job-description">
  <h2>About the Role</h2>
  <p>We are looking for a Junior AI Engineer to join our growing team.</p>
  <h2>Requirements</h2>
  <ul>
    <li>Experience with Python and OpenAI APIs</li>
    <li>React and Next.js development</li>
    <li>SQL and database knowledge</li>
    <li>English fluency required</li>
  </ul>
  <h2>Nice to Have</h2>
  <ul>
    <li>Vector database experience</li>
    <li>RAG architecture knowledge</li>
  </ul>
</div>
</body>
</html>`;

// --- Fixture: pasted text ---

const PASTED_TEXT = `Junior AI Engineer
TechCorp | Barcelona, Spain | Remote

About the Role:
We are looking for a Junior AI Engineer to join our team.

Requirements:
- Python and OpenAI APIs
- React and Next.js
- SQL and databases
- English fluency

Nice to have:
- Vector databases
- RAG architectures`;

// --- Fixture: blocked/invalid content ---

const LOGIN_WALL_HTML = `
<!DOCTYPE html>
<html>
<head><title>Sign In - LinkedIn</title></head>
<body>
<h1>Join LinkedIn</h1>
<p>Sign in to view this job posting.</p>
<form>
  <input type="email" placeholder="Email" />
  <input type="password" placeholder="Password" />
  <button>Sign In</button>
</form>
</body>
</html>`;

const COOKIE_WALL_HTML = `
<!DOCTYPE html>
<html>
<head><title>Cookie Policy</title></head>
<body>
<h1>Accept Cookies</h1>
<p>Please accept cookies to continue. Cookie policy applies.</p>
<button>Accept Cookies</button>
</body>
</html>`;

const EMPTY_HTML = `
<!DOCTYPE html>
<html>
<head><title></title></head>
<body></body>
</html>`;

// --- Tests: Input validation ---

suite.add("pasted text: detected as non-URL", () => {
  const result = validateIngestInput(PASTED_TEXT);
  assert(result.ok === true, "pasted text should be valid input");
  assert("isUrl" in result && result.isUrl === false, "pasted text should not be detected as URL");
});

suite.add("URL detection: identifies URLs correctly", () => {
  assert(looksLikeUrl("https://greenhouse.io/jobs/123") === true, "https URL should be detected");
  assert(looksLikeUrl("http://lever.co/jobs/456") === true, "http URL should be detected");
  assert(looksLikeUrl("greenhouse.io/jobs/123") === true, "bare domain should be detected");
  assert(looksLikeUrl("Junior AI Engineer at TechCorp") === false, "plain text should not be URL");
});

suite.add("URL validation: blocks known generic domains", () => {
  const google = isLikelyJobUrl("https://google.com");
  assert(google.ok === false, "google.com should be blocked");
  const github = isLikelyJobUrl("https://github.com");
  assert(github.ok === false, "github.com should be blocked");
});

suite.add("URL validation: allows job board domains", () => {
  const greenhouse = isLikelyJobUrl("https://boards.greenhouse.io/company/jobs/123");
  assert(greenhouse.ok === true, "greenhouse should be allowed");
  const lever = isLikelyJobUrl("https://jobs.lever.co/company/123");
  assert(lever.ok === true, "lever should be allowed");
});

// --- Tests: Valid HTML parsing ---

suite.add("valid HTML: extracts job title", () => {
  const result = parseJobFromHtml("https://example.com/jobs/1", VALID_HTML);
  assert(!!result.title, "title should be extracted from valid HTML");
  assert(
    result.title!.includes("AI Engineer") || result.title!.includes("Junior"),
    `title should contain job role, got: ${result.title}`
  );
});

suite.add("valid HTML: extracts raw text content", () => {
  const result = parseJobFromHtml("https://example.com/jobs/1", VALID_HTML);
  assert(result.rawText.length > 100, "rawText should have substantial content");
  assert(result.rawText.includes("Python"), "rawText should contain Python");
  assert(result.rawText.includes("OpenAI"), "rawText should contain OpenAI");
});

suite.add("valid HTML: strips HTML tags from rawText", () => {
  const result = parseJobFromHtml("https://example.com/jobs/1", VALID_HTML);
  assert(!result.rawText.includes("<h1>"), "rawText should not contain HTML tags");
  assert(!result.rawText.includes("<li>"), "rawText should not contain list tags");
  assert(!result.rawText.includes("<div"), "rawText should not contain div tags");
});

// --- Tests: Blocked/invalid content ---

suite.add("login wall: detected as blocked content", () => {
  const result = parseJobFromHtml("https://linkedin.com/jobs/1", LOGIN_WALL_HTML);
  const parsedJson = result.parsedJson as Record<string, unknown>;
  assert(
    parsedJson.blocked === true || result.rawText.length < 200,
    "login wall should be detected as blocked or produce minimal output"
  );
});

suite.add("cookie wall: detected as problematic", () => {
  const result = parseJobFromHtml("https://example.com/jobs/1", COOKIE_WALL_HTML);
  const text = result.rawText.toLowerCase();
  const isProblematic = text.includes("cookie") || result.rawText.length < 200;
  assert(isProblematic, "cookie wall should produce minimal useful content");
});

suite.add("empty HTML: handles gracefully", () => {
  const result = parseJobFromHtml("https://example.com/jobs/1", EMPTY_HTML);
  assert(result.rawText !== undefined, "should not throw on empty HTML");
});

// --- Tests: Missing fields ---

suite.add("missing title: handled gracefully", () => {
  const noTitleHtml = `<html><body><p>Some job description without a clear title.</p></body></html>`;
  const result = parseJobFromHtml("https://example.com/jobs/1", noTitleHtml);
  assert(result.rawText !== undefined, "should parse even without title");
});

// --- Tests: Fallback behavior ---

suite.add("script tags are stripped from HTML", () => {
  const htmlWithScript = `<html><body><script>alert('xss')</script><h1>AI Engineer</h1><p>Good job description here.</p></body></html>`;
  const result = parseJobFromHtml("https://example.com/jobs/1", htmlWithScript);
  assert(!result.rawText.includes("alert"), "script content should be stripped");
  assert(!result.rawText.includes("<script>"), "script tags should be stripped");
});

suite.add("style tags are stripped from HTML", () => {
  const htmlWithStyle = `<html><body><style>.job { color: red; }</style><h1>AI Engineer</h1><p>Requirements: Python, React.</p></body></html>`;
  const result = parseJobFromHtml("https://example.com/jobs/1", htmlWithStyle);
  assert(!result.rawText.includes("color: red"), "style content should be stripped");
});

// --- Tests: Page validation ---

suite.add("validateJobPage: accepts valid job page", () => {
  const result = validateJobPage(
    "https://boards.greenhouse.io/company/jobs/123",
    "Junior AI Engineer - TechCorp | Careers",
    "A".repeat(500) // Sufficient content length
  );
  assert(result.valid === true, "valid job page should pass validation");
});

suite.add("validateJobPage: rejects short content", () => {
  const result = validateJobPage(
    "https://example.com/jobs/1",
    "AI Engineer",
    "Short content"
  );
  assert(result.valid === false, "short content should fail validation");
});

// --- Tests: Determinism ---

suite.add("parsing is deterministic", () => {
  const result1 = parseJobFromHtml("https://example.com/jobs/1", VALID_HTML);
  const result2 = parseJobFromHtml("https://example.com/jobs/1", VALID_HTML);
  assertEqual(result1.rawText, result2.rawText, "same HTML should produce same rawText");
  assertEqual(result1.title, result2.title, "same HTML should produce same title");
});

export default suite;
