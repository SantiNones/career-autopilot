import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH  = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X    = 52;
const MARGIN_TOP  = 60;
const MARGIN_BOT  = 52;
const FONT_SIZE   = 10;
const LINE_HEIGHT  = 15;
const SECTION_GAP  = 8;   // extra space before a section heading
const HEADING_SIZE = 11;

// ── Unicode → WinAnsi normalizer ─────────────────────────────────────────────
// Helvetica (WinAnsi / cp1252) cannot encode characters outside U+00FF.
// This helper replaces the most common offenders produced by GPT and then
// strips any remaining characters above U+00FF with a safe ASCII fallback.
export function normalizePdfText(text: string): string {
  return text
    // Dashes
    .replace(/\u2011/g, "-")   // non-breaking hyphen
    .replace(/\u2013/g, "-")   // en dash
    .replace(/\u2014/g, "-")   // em dash
    .replace(/\u2015/g, "-")   // horizontal bar
    // Quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // left/right double quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // left/right single quotes / apostrophes
    // Bullets and markers (normalize to ASCII '-' so isBullet() still matches)
    .replace(/[\u2022\u2023\u2024\u2025\u2026\u25AA\u25CF\u25E6\u00B7\u00B7\u2027]/g, "-")
    // Ellipsis
    .replace(/\u2026/g, "...")
    // Non-breaking space
    .replace(/\u00A0/g, " ")
    // Thin / hair / zero-width spaces
    .replace(/[\u200B\u200C\u200D\u2060\u202F\u205F\uFEFF]/g, "")
    // Any remaining character above U+00FF → stripped (safe fallback)
    .replace(/[^\x00-\xFF]/g, "");
}

function isHeading(line: string): boolean {
  // Treat ALL-CAPS lines (like "SUMMARY", "SKILLS", "EXPERIENCE") as headings
  return /^[A-Z][A-Z\s&/]{2,}$/.test(line.trim());
}

function isBullet(line: string): boolean {
  // After normalization, bullets are ASCII '-', '*', or the original '·'
  return /^[-*·]\s/.test(line.trim());
}

export async function generatePdfFromText(content: string): Promise<Buffer> {
  const doc    = await PDFDocument.create();
  const font   = await doc.embedFont(StandardFonts.Helvetica);
  const fontB  = await doc.embedFont(StandardFonts.HelveticaBold);

  const usableWidth = PAGE_WIDTH - MARGIN_X * 2;

  // ── Word-wrap a single line to fit within usableWidth ──────────────────────
  function wrapLine(text: string, size: number, bold: boolean): string[] {
    const f = bold ? fontB : font;
    if (f.widthOfTextAtSize(text, size) <= usableWidth) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) <= usableWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [text];
  }

  // ── Parse content into a flat list of render items ────────────────────────
  type RenderLine = { text: string; bold: boolean; size: number; indent: number; spaceBefore: number };
  const renderLines: RenderLine[] = [];

  const rawLines = content.split("\n");
  for (const raw of rawLines) {
    // Normalize before any classification or measurement to avoid WinAnsi errors
    const trimmed = normalizePdfText(raw).trim();

    if (!trimmed) {
      // Blank line → small vertical gap (encoded as empty spacer)
      renderLines.push({ text: "", bold: false, size: FONT_SIZE, indent: 0, spaceBefore: 4 });
      continue;
    }

    if (isHeading(trimmed)) {
      renderLines.push({ text: trimmed, bold: true, size: HEADING_SIZE, indent: 0, spaceBefore: SECTION_GAP });
      continue;
    }

    if (isBullet(trimmed)) {
      const bulletText = trimmed.replace(/^[-*·]\s*/, "- ");
      renderLines.push({ text: bulletText, bold: false, size: FONT_SIZE, indent: 12, spaceBefore: 0 });
      continue;
    }

    renderLines.push({ text: trimmed, bold: false, size: FONT_SIZE, indent: 0, spaceBefore: 0 });
  }

  // ── Paginate and draw ─────────────────────────────────────────────────────
  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y    = PAGE_HEIGHT - MARGIN_TOP;

  function newPage() {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y    = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN_BOT) newPage();
  }

  for (const item of renderLines) {
    if (item.text === "") {
      // Spacer
      ensureSpace(item.spaceBefore);
      y -= item.spaceBefore;
      continue;
    }

    // Apply spaceBefore
    if (item.spaceBefore > 0) {
      ensureSpace(item.spaceBefore + LINE_HEIGHT);
      y -= item.spaceBefore;
    }

    const wrapped = wrapLine(item.text, item.size, item.bold);
    for (const wLine of wrapped) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(wLine, {
        x:    MARGIN_X + item.indent,
        y,
        size: item.size,
        font: item.bold ? fontB : font,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_HEIGHT;
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
