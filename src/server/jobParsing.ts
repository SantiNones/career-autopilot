export type ParsedJob = {
  title?: string;
  companyName?: string;
  location?: string;
  rawText: string;
  parsedJson: Record<string, unknown>;
};

function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts.replace(/<[^>]+>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m?.[1]) return undefined;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 200);
}

function extractMetaDescription(html: string): string | undefined {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  if (!m?.[1]) return undefined;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 300);
}

function extractH1(html: string): string | undefined {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m?.[1]) return undefined;
  const raw = m[1].replace(/<[^>]+>/g, " ");
  return raw.replace(/\s+/g, " ").trim().slice(0, 200);
}

function detectBlockedContent(text: string, title?: string): {
  blocked: boolean;
  reason: string | null;
} {
  const t = `${title ?? ""} ${text}`.toLowerCase();

  const signals: Array<{ match: RegExp; reason: string }> = [
    { match: /sign\s*in|log\s*in|iniciar\s*sesión|acceder/i, reason: "login" },
    { match: /cookie|cookies\s+policy|accept\s+cookies/i, reason: "cookie_wall" },
    { match: /enable\s+javascript|turn\s+on\s+javascript/i, reason: "js_required" },
    { match: /captcha|cloudflare/i, reason: "bot_protection" },
    { match: /join\s+linkedin|linkedin\s+member/i, reason: "linkedin_gated" },
    { match: /subscribe|subscription|paywall/i, reason: "paywall" },
  ];

  for (const s of signals) {
    if (s.match.test(t)) return { blocked: true, reason: s.reason };
  }

  return { blocked: false, reason: null };
}

function guessCompanyFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const parts = title.split(/\s[-|•|@]\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return undefined;
}

// ─── URL-level pre-flight validation ───

const HARD_BLOCKED_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "github.com",
  "www.github.com",
  "vercel.com",
  "www.vercel.com",
  "gmail.com",
  "accounts.google.com",
]);

const JOB_PATH_KEYWORDS = [
  "job", "jobs", "career", "careers", "opening", "openings",
  "position", "positions", "vacancy", "vacancies",
  "greenhouse", "lever", "ashby", "workable",
];

export function looksLikeUrl(input: string): boolean {
  return /^https?:\/\//i.test(input) || /^[a-z0-9-]+\.[a-z]{2,}/i.test(input);
}

export function validateIngestInput(
  input: string,
): { ok: true; isUrl: true; url: string } | { ok: true; isUrl: false } | { ok: false; reason: string } {
  const trimmed = input.trim();
  const isUrl = looksLikeUrl(trimmed);

  console.log("[validateIngestInput] input:", trimmed.slice(0, 80), "isUrl:", isUrl);

  if (isUrl) {
    // normalize bare domain to https
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const urlCheck = isLikelyJobUrl(url);
    if (!urlCheck.ok) {
      console.log("[validateIngestInput] REJECTED:", urlCheck.reason);
      return { ok: false, reason: urlCheck.reason };
    }
    console.log("[validateIngestInput] ACCEPTED URL:", url);
    return { ok: true, isUrl: true, url };
  }

  console.log("[validateIngestInput] ACCEPTED as pasted text");
  return { ok: true, isUrl: false };
}

export function isLikelyJobUrl(url: string): { ok: true } | { ok: false; reason: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();

  console.log("[isLikelyJobUrl] hostname:", hostname, "pathname:", pathname);

  // 1. Hard block known generic domains
  if (HARD_BLOCKED_HOSTS.has(hostname)) {
    console.log("[isLikelyJobUrl] REJECTED — hard blocked host:", hostname);
    return { ok: false, reason: "Generic homepage domain — not a job posting" };
  }

  // 2. LinkedIn: only allow /jobs/view/ URLs
  if (hostname === "linkedin.com" || hostname === "www.linkedin.com") {
    if (!pathname.includes("/jobs/view/")) {
      console.log("[isLikelyJobUrl] REJECTED — LinkedIn URL without /jobs/view/");
      return { ok: false, reason: "LinkedIn URL must contain /jobs/view/" };
    }
  }

  // 3. For any hostname, the path should contain a job-related keyword
  const hasJobKeyword = JOB_PATH_KEYWORDS.some((kw) => pathname.includes(`/${kw}`));
  if (!hasJobKeyword) {
    console.log("[isLikelyJobUrl] REJECTED — no job keyword in path:", pathname);
    return { ok: false, reason: "URL path does not look like a job posting" };
  }

  console.log("[isLikelyJobUrl] ACCEPTED");
  return { ok: true };
}

// ─── Post-parse content validation ───

export type ValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

const BLOCKED_TITLE_PATTERNS = [
  /^LinkedIn Login$/i,
  /^Sign in\s*\|?\s*LinkedIn$/i,
  /^Join LinkedIn$/i,
  /^Log In\s*\|?\s*LinkedIn$/i,
  /^LinkedIn:\s*Log In or Sign Up$/i,
  /^Before you continue to Google$/i,
  /^Google$/i,
  /^GitHub: Where the world builds software$/i,
  /^GitHub$/i,
  /^Vercel: Build. Preview. Ship.$/i,
  /^Vercel$/i,
  /^Welcome to Vercel$/i,
  /^Home$/i,
  /^Homepage$/i,
  /^Index$/i,
  /^Startseite$/i,
  /^Accueil$/i,
];

const BLOCKED_TEXT_PATTERNS = [
  /authwall/i,
  /login required/i,
  /sign in to view/i,
  /sign in or create account/i,
  /join to view/i,
  /members only/i,
  /restricted access/i,
  /before you continue to google/i,
];

const GENERIC_DOMAIN_HOME_PAGES: Record<string, RegExp> = {
  "google.com": /google/i,
  "github.com": /github/i,
  "vercel.com": /vercel/i,
  "linkedin.com": /linkedin/i,
};

export function validateJobPage(
  sourceUrl: string,
  title: string | undefined,
  rawText: string,
): ValidationResult {
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");

  // 1. Blocked / authwall pages by title
  if (title) {
    for (const pattern of BLOCKED_TITLE_PATTERNS) {
      if (pattern.test(title)) {
        return { valid: false, reason: "Blocked or login page detected" };
      }
    }
  }

  // 2. Blocked by text patterns
  const textLower = rawText.toLowerCase();
  for (const pattern of BLOCKED_TEXT_PATTERNS) {
    if (pattern.test(textLower)) {
      return { valid: false, reason: "Authwall or restricted content detected" };
    }
  }

  // 3. Generic homepages for known domains
  for (const [domain, titlePattern] of Object.entries(GENERIC_DOMAIN_HOME_PAGES)) {
    if (hostname === domain || hostname.endsWith(`.${domain}`)) {
      if (!title || titlePattern.test(title)) {
        return { valid: false, reason: "Generic homepage — not a job posting" };
      }
    }
  }

  // 4. Must have a title that looks like a job title
  if (!title || title.length < 5) {
    return { valid: false, reason: "Missing or too short page title" };
  }

  // 5. Must have meaningful content
  const meaningfulText = rawText.replace(/\s+/g, " ").trim();
  if (meaningfulText.length < 400) {
    return { valid: false, reason: "Page content too short to be a job posting" };
  }

  // 6. Title should not be a generic homepage title
  const genericTitles = [
    "home", "homepage", "index", "start", "welcome", "main", "portal",
    "dashboard", "account", "profile", "settings", "about us", "contact",
    "blog", "news", "search", "jobs", "careers", "work with us",
  ];
  const titleWords = title.toLowerCase().split(/\s+/);
  if (genericTitles.some((gt) => titleWords.includes(gt) && titleWords.length <= 3)) {
    return { valid: false, reason: "Page title looks like a generic homepage" };
  }

  return { valid: true };
}

export function parseJobFromHtml(sourceUrl: string, html: string): ParsedJob {
  const titleFromTitleTag = extractTitle(html);
  const titleFromH1 = extractH1(html);
  const title = titleFromH1 ?? titleFromTitleTag;
  const companyName = guessCompanyFromTitle(title);
  const metaDescription = extractMetaDescription(html);
  const rawText = stripHtml(html);
  const blocked = detectBlockedContent(rawText, title);

  return {
    title,
    companyName,
    rawText,
    parsedJson: {
      sourceUrl,
      parser: "naive_v1",
      title,
      companyName,
      metaDescription,
      titleFromH1,
      titleFromTitleTag,
      textLength: rawText.length,
      blocked: blocked.blocked,
      blockedReason: blocked.reason,
    },
  };
}
