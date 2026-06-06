import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const LINK_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/g;

export type UploadParseResult = {
  rawText: string;
  links: string[];
};

export class UploadValidationError extends Error {}

export async function extractFromFile(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<UploadParseResult> {
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new UploadValidationError("File too large. Maximum size is 5 MB.");
  }

  const lowerName = fileName.toLowerCase();
  const isPdf =
    mimeType === "application/pdf" || lowerName.endsWith(".pdf");
  const isDocx =
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerName.endsWith(".docx");

  if (!isPdf && !isDocx) {
    throw new UploadValidationError(
      "Unsupported file type. Please upload a PDF or DOCX file.",
    );
  }

  let rawText = "";
  const embeddedHrefs: string[] = [];

  if (isPdf) {
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      rawText = result.text ?? "";
    } catch {
      throw new Error("Could not extract text from this PDF file.");
    }
  } else {
    try {
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer }),
        mammoth.convertToHtml({ buffer }),
      ]);
      rawText = textResult.value ?? "";
      embeddedHrefs.push(...extractHrefsFromHtml(htmlResult.value ?? ""));
    } catch {
      throw new Error("Could not extract text from this DOCX file.");
    }
  }

  rawText = rawText.trim();

  if (!rawText) {
    throw new Error(
      "Could not extract text from this file. The file may be empty or image-only.",
    );
  }

  const links = extractLinks(rawText, embeddedHrefs);

  return { rawText, links };
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function normalizeUrl(raw: string): string {
  const withoutLabel = raw.replace(/^[^:]+:\s+(?=https?:\/\/)/i, "").trim();
  const noTrail = withoutLabel.replace(/[.,;)]+$/, "");
  try {
    const u = new URL(noTrail);
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

// Known project-specific URLs — these belong in Projects, not in Links.
const KNOWN_PROJECT_URLS: Set<string> = new Set([
  "https://projectflow-ai-chi.vercel.app/",
  "https://github.com/SantiNones/projectflow-ai",
  "https://github.com/SantiNones/career-autopilot",
  "https://ethnicraft-hek8qyip6-santiago-nones-projects.vercel.app/",
  "https://github.com/SantiNones/ethnicraft",
  "https://rise-app.onrender.com/",
  "https://github.com/SantiNones/rise-habit-tracker",
  "https://github.com/SantiNones/station-app",
].map(normalizeUrl));

function isProjectUrl(url: string): boolean {
  return KNOWN_PROJECT_URLS.has(normalizeUrl(url));
}

function isPersonalUrl(url: string): boolean {
  if (isProjectUrl(url)) return false;
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return true;
  if (lower.includes("github.com")) {
    try {
      const parts = new URL(url).pathname.replace(/^\//, "").split("/").filter(Boolean);
      return parts.length <= 1;
    } catch { return false; }
  }
  return false;
}

// Extract href attribute values from HTML anchor tags produced by mammoth.
function extractHrefsFromHtml(html: string): string[] {
  const hrefs: string[] = [];
  const HREF_RE = /href="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = HREF_RE.exec(html)) !== null) {
    const href = m[1].trim();
    if (href.startsWith("http")) hrefs.push(href);
  }
  return hrefs;
}

export function extractLinks(text: string, extraUrls: string[] = []): string[] {
  const fromText = (text.match(LINK_REGEX) ?? []).map((u) => u.replace(/[.,;)]+$/, ""));
  const allUrls = [...fromText, ...extraUrls];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of allUrls) {
    const norm = normalizeUrl(url);
    if (seen.has(norm)) continue;
    seen.add(norm);
    if (isPersonalUrl(url)) result.push(labelUrl(url));
  }
  return result;
}
