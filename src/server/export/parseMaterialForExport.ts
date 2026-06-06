export type LineType =
  | "name"
  | "role"
  | "contact"
  | "link-bar"   // aggregated header links rendered as "LinkedIn | GitHub"
  | "divider"
  | "section-heading"
  | "project-title"
  | "link"
  | "bullet"
  | "blank"
  | "paragraph";

export type LinkBarEntry = { label: string; url: string };

export type ParsedLine = {
  type: LineType;
  text: string;
  url?: string;
  links?: LinkBarEntry[];  // only on link-bar
};

const SECTION_HEADINGS = new Set([
  "SUMMARY", "PROFILE", "ABOUT", "OBJECTIVE",
  "EXPERIENCE", "WORK EXPERIENCE", "EMPLOYMENT", "PROFESSIONAL EXPERIENCE",
  "PROJECTS", "PERSONAL PROJECTS", "SIDE PROJECTS", "SELECTED PROJECTS",
  "SKILLS", "TECHNICAL SKILLS", "CORE COMPETENCIES", "COMPETENCIES", "TECHNOLOGIES",
  "EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS",
  "LANGUAGES", "SPOKEN LANGUAGES",
  "LINKS", "ONLINE PRESENCE", "CONTACT", "CONTACTS",
  "CERTIFICATIONS", "AWARDS", "REFERENCES",
]);

function isSectionHeading(line: string): boolean {
  const t = line.trim();
  if (SECTION_HEADINGS.has(t)) return true;
  // ALL-CAPS word(s) only — max 4 words, no lowercase
  return /^[A-Z][A-Z\s&/]{2,40}$/.test(t) && !t.includes("—") && !t.includes("-");
}

function isProjectTitle(line: string): boolean {
  const t = line.trim();
  return /^[A-Z][A-Z\s]{1,30}[\u2014\-\u2013]{1,3}.+/.test(t);
}

function isBullet(line: string): boolean {
  return /^[•·\-\*]\s/.test(line.trim());
}

function isLinkLine(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  const stripped = t
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\|\s*/g, "")
    .replace(/\b(live demo|github|linkedin|portfolio|demo|link)\s*:\s*/gi, "")
    .replace(/[:\s\-|]+/g, "")
    .trim();
  return stripped.length === 0 && /https?:\/\//.test(t);
}

function isHeaderContactLine(line: string): boolean {
  const t = line.trim();
  // phone, email, or location-like (no URL, not a section heading)
  return (
    /^[+\d(]/.test(t) ||               // phone
    t.includes("@") ||                   // email
    /^[\w\s,]+$/.test(t)               // plain text (location, city)
  );
}

function extractFirstUrl(line: string): string | undefined {
  const m = line.match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[.,;)]+$/, "") : undefined;
}

// Parse "LinkedIn: https://..." or "GitHub: https://..." into label+url
function parseLinkLabel(line: string): LinkBarEntry | null {
  const t = line.trim();
  // "Label: url" pattern
  const colonMatch = t.match(/^([^:]+):\s*(https?:\/\/\S+)/);
  if (colonMatch) {
    return { label: colonMatch[1].trim(), url: colonMatch[2].replace(/[.,;)]+$/, "") };
  }
  // bare URL — derive label from domain
  const urlMatch = t.match(/^(https?:\/\/\S+)/);
  if (urlMatch) {
    const url = urlMatch[1].replace(/[.,;)]+$/, "");
    const domain = url.replace(/https?:\/\/(www\.)?/, "").split("/")[0].split(".").slice(-2, -1)[0] ?? "Link";
    return { label: domain.charAt(0).toUpperCase() + domain.slice(1), url };
  }
  return null;
}

export function parseMaterialForExport(content: string): ParsedLine[] {
  const rawLines = content.split("\n");
  const result: ParsedLine[] = [];

  // ── Locate header boundary: everything before the first section heading ──────
  let firstSectionIdx = rawLines.findIndex((l) => isSectionHeading(l.trim()));
  if (firstSectionIdx === -1) firstSectionIdx = rawLines.length;

  let i = 0;
  let nameFound = false;
  let roleFound = false;

  // ── Header block ─────────────────────────────────────────────────────────────
  // name → role → any number of contact lines → any number of link lines → divider
  const headerLinkLines: string[] = [];

  while (i < firstSectionIdx) {
    const trimmed = rawLines[i].trim();
    i++;

    if (!trimmed) {
      if (!nameFound) result.push({ type: "blank", text: "" });
      continue;
    }

    if (!nameFound) {
      result.push({ type: "name", text: trimmed });
      nameFound = true;
      continue;
    }

    if (!roleFound && !isLinkLine(trimmed) && !isHeaderContactLine(trimmed)) {
      result.push({ type: "role", text: trimmed });
      roleFound = true;
      continue;
    }

    // After name+role: collect contact lines and link lines
    if (isLinkLine(trimmed)) {
      headerLinkLines.push(trimmed);
    } else if (isHeaderContactLine(trimmed)) {
      result.push({ type: "contact", text: trimmed });
    }
  }

  // Aggregate all header link lines into one link-bar entry
  if (headerLinkLines.length > 0) {
    const entries: LinkBarEntry[] = [];
    for (const ll of headerLinkLines) {
      const parsed = parseLinkLabel(ll);
      if (parsed) entries.push(parsed);
    }
    if (entries.length > 0) {
      result.push({ type: "link-bar", text: entries.map((e) => e.label).join(" | "), links: entries });
    }
  }

  // Header divider (only if we found a name)
  if (nameFound) {
    result.push({ type: "divider", text: "" });
  }

  // ── Body ─────────────────────────────────────────────────────────────────────
  while (i < rawLines.length) {
    const trimmed = rawLines[i].trim();
    i++;

    if (!trimmed) {
      result.push({ type: "blank", text: "" });
      continue;
    }

    if (isSectionHeading(trimmed) && !isProjectTitle(trimmed)) {
      result.push({ type: "section-heading", text: trimmed });
      continue;
    }

    if (isProjectTitle(trimmed)) {
      result.push({ type: "project-title", text: trimmed });
      continue;
    }

    if (isLinkLine(trimmed)) {
      result.push({ type: "link", text: trimmed, url: extractFirstUrl(trimmed) });
      continue;
    }

    if (isBullet(trimmed)) {
      const text = trimmed.replace(/^[•·\-\*]\s*/, "");
      result.push({ type: "bullet", text });
      continue;
    }

    result.push({ type: "paragraph", text: trimmed });
  }

  return result;
}
