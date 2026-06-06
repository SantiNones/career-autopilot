export type LineType =
  | "name"
  | "role"
  | "contact"
  | "divider"
  | "section-heading"
  | "project-title"
  | "link"
  | "bullet"
  | "blank"
  | "paragraph";

export type ParsedLine = {
  type: LineType;
  text: string;
  url?: string;
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
  // Has uppercase start + dash/em-dash separator + mixed case description
  // e.g. "CAREER AUTOPILOT — AI-Powered Job Application Copilot"
  // or   "PROJECTFLOW AI — Project Intake & Delivery Planning Tool"
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

function extractFirstUrl(line: string): string | undefined {
  const m = line.match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[.,;)]+$/, "") : undefined;
}

export function parseMaterialForExport(content: string): ParsedLine[] {
  const rawLines = content.split("\n");
  const result: ParsedLine[] = [];

  // Detect header block: first non-blank line = name, next non-blank non-link = role,
  // first link-like or contact-like line after = contact.
  // We scan the top of the document before the first section heading.
  let headerDone = false;
  let nameFound = false;
  let roleFound = false;
  let contactFound = false;
  let firstSectionIdx = rawLines.findIndex((l) => isSectionHeading(l.trim()));
  if (firstSectionIdx === -1) firstSectionIdx = rawLines.length;

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    // ── Header block ──────────────────────────────────────────────────────────
    if (!headerDone && i < firstSectionIdx) {
      if (!trimmed) {
        result.push({ type: "blank", text: "" });
        continue;
      }
      if (!nameFound) {
        result.push({ type: "name", text: trimmed });
        nameFound = true;
        continue;
      }
      if (!roleFound && !isLinkLine(trimmed) && !trimmed.includes("@") && !trimmed.match(/^[+\d(]/)) {
        result.push({ type: "role", text: trimmed });
        roleFound = true;
        continue;
      }
      if (!contactFound) {
        result.push({ type: "contact", text: trimmed, url: extractFirstUrl(trimmed) });
        contactFound = true;
        result.push({ type: "divider", text: "" });
        headerDone = true;
        continue;
      }
    }

    // ── Body ──────────────────────────────────────────────────────────────────
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
