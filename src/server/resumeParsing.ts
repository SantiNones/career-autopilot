export type ParsedResume = {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  languages: string;
  links: string;
};

const SECTION_HEADINGS: Array<{ key: keyof ParsedResume; patterns: RegExp[] }> = [
  {
    key: "summary",
    patterns: [/^(summary|profile|about|objective|professional\s+summary|about\s+me)\s*$/i],
  },
  {
    key: "experience",
    patterns: [/^(experience|work\s+experience|employment|professional\s+experience|career\s+history)\s*$/i],
  },
  {
    key: "projects",
    patterns: [/^(projects|personal\s+projects|side\s+projects|portfolio)\s*$/i],
  },
  {
    key: "skills",
    patterns: [/^(skills|technical\s+skills|core\s+competencies|competencies|technologies)\s*$/i],
  },
  {
    key: "education",
    patterns: [/^(education|academic\s+background|qualifications|studies)\s*$/i],
  },
  {
    key: "languages",
    patterns: [/^(languages|spoken\s+languages|language\s+proficiency)\s*$/i],
  },
  {
    key: "links",
    patterns: [/^(links|online\s+presence|portfolio\s+links|contact|contacts|social)\s*$/i],
  },
];

const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

type ProjectLinkEntry = {
  namePatterns: string[];
  liveDemo?: string;
  github?: string;
};

const PROJECT_LINK_MAP: ProjectLinkEntry[] = [
  {
    namePatterns: ["projectflow", "project flow"],
    liveDemo: "https://projectflow-ai-chi.vercel.app/",
    github: "https://github.com/SantiNones/projectflow-ai",
  },
  {
    namePatterns: ["career autopilot", "careerautopilot"],
    github: "https://github.com/SantiNones/career-autopilot",
  },
  {
    namePatterns: ["ethnicraft"],
    liveDemo: "https://ethnicraft-hek8qyip6-santiago-nones-projects.vercel.app/",
    github: "https://github.com/SantiNones/ethnicraft",
  },
  {
    namePatterns: ["rise app", "rise habit", "rise-habit", "^rise\\b"],
    liveDemo: "https://rise-app.onrender.com/",
    github: "https://github.com/SantiNones/rise-habit-tracker",
  },
  {
    namePatterns: ["station"],
    github: "https://github.com/SantiNones/station-app",
  },
];

function detectHeading(line: string): keyof ParsedResume | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const section of SECTION_HEADINGS) {
    for (const pattern of section.patterns) {
      if (pattern.test(trimmed)) {
        return section.key;
      }
    }
  }
  return null;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  // Strip label prefix like "LinkedIn: " or "GitHub: " or "Live Demo: "
  const withoutLabel = raw.replace(/^[^:]+:\s+(?=https?:\/\/)/i, "").trim();
  // Remove trailing punctuation
  const noTrail = withoutLabel.replace(/[.,;)]+$/, "");
  try {
    const u = new URL(noTrail);
    // Lowercase hostname; remove trailing slash from pathname
    const pathname = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.protocol}//${u.hostname.toLowerCase()}${pathname}${u.search}${u.hash}`;
  } catch {
    return noTrail.toLowerCase();
  }
}

function labelUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return `LinkedIn: ${url}`;
  if (lower.includes("github.com")) return `GitHub: ${url}`;
  if (lower.includes("vercel.app") || lower.includes("render.com") || lower.includes("netlify.app")) return `Portfolio: ${url}`;
  return url;
}

// All project-specific URLs across PROJECT_LINK_MAP — used to exclude them from
// the personal Links section.
function buildProjectUrlSet(): Set<string> {
  const s = new Set<string>();
  for (const entry of PROJECT_LINK_MAP) {
    if (entry.liveDemo) s.add(normalizeUrl(entry.liveDemo));
    if (entry.github)   s.add(normalizeUrl(entry.github));
  }
  return s;
}

const PROJECT_URL_SET: Set<string> = buildProjectUrlSet();

function isProjectUrl(url: string): boolean {
  return PROJECT_URL_SET.has(normalizeUrl(url));
}

// Extract only personal links (LinkedIn / GitHub profile) from the pre-section
// header block. Excludes project-specific repos and live demo URLs.
function extractPersonalLinksFromHeader(headerLines: string[]): string {
  const text = headerLines.join(" ");
  const rawUrls = text.match(URL_REGEX) ?? [];
  const cleaned = rawUrls.map((u) => u.replace(/[.,;)]+$/, ""));
  const seen = new Set<string>();
  const personalUrls: string[] = [];

  for (const url of cleaned) {
    const lower = url.toLowerCase();
    const norm = normalizeUrl(url);
    if (seen.has(norm)) continue;
    seen.add(norm);

    const isLinkedIn = lower.includes("linkedin.com");
    // GitHub profile = github.com/<user> with no further path segments beyond the username
    const isGitHubProfile = lower.includes("github.com") && !isProjectUrl(url) &&
      (() => {
        try {
          const parts = new URL(url).pathname.replace(/^\//, "").split("/").filter(Boolean);
          return parts.length <= 1; // github.com/SantiNones is personal; /SantiNones/repo is project
        } catch { return false; }
      })();

    if (isLinkedIn || isGitHubProfile) personalUrls.push(url);
  }

  if (!personalUrls.length) return "";
  return personalUrls.map(labelUrl).join("\n");
}

const URL_REGEX_FRESH = () =>
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

// Extract every normalized URL present anywhere in a text string.
function extractNormedUrls(text: string): Set<string> {
  const matches = text.match(URL_REGEX_FRESH()) ?? [];
  return new Set(matches.map(normalizeUrl));
}

// True if a line is purely a link-label line (e.g. "GitHub: url", "Live Demo: url | GitHub: url").
function isLinkLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Strip all URLs, then strip known label prefixes and pipe separators
  const withoutLinks = trimmed
    .replace(URL_REGEX_FRESH(), "")
    .replace(/\|\s*/g, "")
    .replace(/^(live demo|github|linkedin|portfolio|demo)\s*:\s*/gi, "")
    .trim();
  // If nothing meaningful remains, it is purely a link line
  return withoutLinks.length === 0;
}

// Deduplicate link lines inside a single project block.
// Strategy:
//   - Track every normalized URL we have "accepted" so far (per block).
//   - For each line, if it is a link line AND all its URLs are already accepted → drop it.
//   - Otherwise, accept it (and record its URLs as accepted).
// This eliminates exact duplicates AND combined lines whose individual URLs were already emitted.
function deduplicateProjectBlock(block: string): string {
  const lines = block.split("\n");
  const acceptedUrls = new Set<string>();
  const kept: string[] = [];

  for (const line of lines) {
    if (!isLinkLine(line)) {
      kept.push(line);
      continue;
    }
    const lineUrls = extractNormedUrls(line);
    if (lineUrls.size === 0) {
      kept.push(line);
      continue;
    }
    // Drop this line only if every URL it contains was already accepted
    const allAlreadySeen = [...lineUrls].every((u) => acceptedUrls.has(u));
    if (allAlreadySeen) continue;
    // Accept this line — record its URLs
    for (const u of lineUrls) acceptedUrls.add(u);
    kept.push(line);
  }

  return kept.join("\n");
}

function backfillProjectLinks(projectsText: string): string {
  if (!projectsText.trim()) return projectsText;

  const blocks = projectsText.split(/\n{2,}/);

  const patched = blocks.map((block) => {
    // Phase 1: remove duplicate link lines within the block
    const deduped = deduplicateProjectBlock(block);

    const firstLine = deduped.split("\n")[0].toLowerCase();
    const meta = PROJECT_LINK_MAP.find((entry) =>
      entry.namePatterns.some((p) => {
        try {
          return new RegExp(p, "i").test(firstLine);
        } catch {
          return firstLine.includes(p);
        }
      }),
    );
    if (!meta) return deduped;

    // Phase 2: inject only URLs still missing after dedup
    const existingNorm = extractNormedUrls(deduped);
    const dedupedLines = deduped.split("\n");
    const toInsert: string[] = [];

    if (meta.liveDemo && !existingNorm.has(normalizeUrl(meta.liveDemo))) {
      toInsert.push(`Live Demo: ${meta.liveDemo}`);
    }
    if (meta.github && !existingNorm.has(normalizeUrl(meta.github))) {
      toInsert.push(`GitHub: ${meta.github}`);
    }

    if (!toInsert.length) return deduped;

    return [dedupedLines[0], ...toInsert, ...dedupedLines.slice(1)].join("\n");
  });

  return patched.join("\n\n");
}

function mergeLinksText(existing: string, incoming: string): string {
  if (!incoming) return existing;
  if (!existing) return incoming;
  const existingLines = existing.split("\n").map((l) => l.trim()).filter(Boolean);
  const existingNorms = new Set(existingLines.map(normalizeUrl));
  const incomingLines = incoming.split("\n").map((l) => l.trim()).filter(Boolean);
  const toAdd = incomingLines.filter((l) => !existingNorms.has(normalizeUrl(l)));
  if (!toAdd.length) return existing;
  return [...existingLines, ...toAdd].join("\n");
}

export function parseResume(rawText: string): ParsedResume {
  const result: ParsedResume = {
    summary: "",
    experience: "",
    projects: "",
    skills: "",
    education: "",
    languages: "",
    links: "",
  };

  const lines = rawText.split(/\r?\n/);
  let currentSection: keyof ParsedResume | null = null;
  const sectionLines: Partial<Record<keyof ParsedResume, string[]>> = {};
  const preHeaderLines: string[] = [];

  for (const line of lines) {
    const heading = detectHeading(line);
    if (heading) {
      currentSection = heading;
      if (!sectionLines[currentSection]) {
        sectionLines[currentSection] = [];
      }
    } else if (currentSection) {
      sectionLines[currentSection] = sectionLines[currentSection] ?? [];
      sectionLines[currentSection]!.push(line);
    } else {
      preHeaderLines.push(line);
    }
  }

  const hasSections = Object.keys(sectionLines).length > 0;

  if (!hasSections) {
    return result;
  }

  for (const key of Object.keys(result) as Array<keyof ParsedResume>) {
    const sLines = sectionLines[key];
    if (sLines) {
      result[key] = sLines.join("\n").replace(/^\n+|\n+$/g, "").trim();
    }
  }

  const headerLinks = extractPersonalLinksFromHeader(preHeaderLines);
  if (headerLinks) {
    result.links = mergeLinksText(result.links, headerLinks);
  }

  if (result.projects) {
    result.projects = backfillProjectLinks(result.projects);
  }

  return result;
}
