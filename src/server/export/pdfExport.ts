import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { parseMaterialForExport } from "./parseMaterialForExport";

const PAGE_WIDTH  = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X    = 52;
const MARGIN_TOP  = 56;
const MARGIN_BOT  = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

// Font sizes
const SIZE_NAME    = 20;
const SIZE_ROLE    = 13;
const SIZE_CONTACT =  9;
const SIZE_HEADING = 11;
const SIZE_PROJ    = 10.5;
const SIZE_BODY    = 10;
const SIZE_LINK    =  9;

// Line heights
const LH_NAME    = 26;
const LH_ROLE    = 18;
const LH_CONTACT = 13;
const LH_HEADING = 17;
const LH_PROJ    = 16;
const LH_BODY    = 15;
const LH_LINK    = 14;

// ── Unicode → WinAnsi normalizer ─────────────────────────────────────────────
export function normalizePdfText(text: string): string {
  return text
    .replace(/\u2011/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2015/g, "-")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2022\u2023\u2024\u2025\u2026\u25AA\u25CF\u25E6\u00B7\u2027]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B\u200C\u200D\u2060\u202F\u205F\uFEFF]/g, "")
    .replace(/[^\x00-\xFF]/g, "");
}

export async function generatePdfFromText(content: string): Promise<Buffer> {
  const pdoc  = await PDFDocument.create();
  const font  = await pdoc.embedFont(StandardFonts.Helvetica);
  const fontB = await pdoc.embedFont(StandardFonts.HelveticaBold);
  const fontO = await pdoc.embedFont(StandardFonts.HelveticaOblique);

  function wrapLine(text: string, size: number, bold: boolean, maxW = CONTENT_WIDTH): string[] {
    const f = bold ? fontB : font;
    if (f.widthOfTextAtSize(text, size) <= maxW) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) <= maxW) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length ? lines : [text];
  }

  type DrawItem = {
    text: string;
    size: number;
    bold: boolean;
    italic: boolean;
    indent: number;
    color: [number, number, number];
    lineHeight: number;
    spaceBefore: number;
    spaceAfter: number;
    drawRule?: boolean;   // draw a horizontal rule after this line
  };

  const items: DrawItem[] = [];
  const norm = (s: string) => normalizePdfText(s);

  const parsed = parseMaterialForExport(content);

  for (const line of parsed) {
    const t = norm(line.text);

    switch (line.type) {
      case "name":
        items.push({ text: t, size: SIZE_NAME, bold: true, italic: false, indent: 0, color: [0.05, 0.05, 0.05], lineHeight: LH_NAME, spaceBefore: 0, spaceAfter: 2 });
        break;
      case "role":
        items.push({ text: t, size: SIZE_ROLE, bold: false, italic: false, indent: 0, color: [0.25, 0.25, 0.25], lineHeight: LH_ROLE, spaceBefore: 4, spaceAfter: 2 });
        break;
      case "contact":
        items.push({ text: t, size: SIZE_CONTACT, bold: false, italic: false, indent: 0, color: [0.35, 0.35, 0.35], lineHeight: LH_CONTACT, spaceBefore: 4, spaceAfter: 0 });
        break;
      case "divider":
        items.push({ text: "", size: 0, bold: false, italic: false, indent: 0, color: [0.8, 0.8, 0.8], lineHeight: 10, spaceBefore: 6, spaceAfter: 8, drawRule: true });
        break;
      case "section-heading":
        // Text item first — no drawRule so the text actually gets drawn
        items.push({ text: t, size: SIZE_HEADING, bold: true, italic: false, indent: 0, color: [0.1, 0.1, 0.1], lineHeight: LH_HEADING, spaceBefore: 12, spaceAfter: 2 });
        // Then a separate rule-only item below the text
        items.push({ text: "", size: 0, bold: false, italic: false, indent: 0, color: [0.8, 0.8, 0.8], lineHeight: 0, spaceBefore: 0, spaceAfter: 4, drawRule: true });
        break;
      case "project-title":
        items.push({ text: t, size: SIZE_PROJ, bold: true, italic: false, indent: 0, color: [0.1, 0.1, 0.1], lineHeight: LH_PROJ, spaceBefore: 8, spaceAfter: 1 });
        break;
      case "link":
        items.push({ text: t, size: SIZE_LINK, bold: false, italic: false, indent: 0, color: [0.2, 0.2, 0.7], lineHeight: LH_LINK, spaceBefore: 1, spaceAfter: 1 });
        break;
      case "bullet":
        items.push({ text: `- ${t}`, size: SIZE_BODY, bold: false, italic: false, indent: 14, color: [0.1, 0.1, 0.1], lineHeight: LH_BODY, spaceBefore: 1, spaceAfter: 0 });
        break;
      case "blank":
        items.push({ text: "", size: SIZE_BODY, bold: false, italic: false, indent: 0, color: [0, 0, 0], lineHeight: 0, spaceBefore: 0, spaceAfter: 5 });
        break;
      default:
        if (!t) break;
        items.push({ text: t, size: SIZE_BODY, bold: false, italic: false, indent: 0, color: [0.1, 0.1, 0.1], lineHeight: LH_BODY, spaceBefore: 0, spaceAfter: 1 });
    }
  }

  // ── Paginate and draw ─────────────────────────────────────────────────────
  let page = pdoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y    = PAGE_HEIGHT - MARGIN_TOP;

  function newPage() {
    page = pdoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y    = PAGE_HEIGHT - MARGIN_TOP;
  }

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN_BOT) newPage();
  }

  for (const item of items) {
    // spaceBefore
    if (item.spaceBefore > 0) {
      ensureSpace(item.spaceBefore + (item.lineHeight || LH_BODY));
      y -= item.spaceBefore;
    }

    if (item.drawRule) {
      ensureSpace(6);
      page.drawLine({
        start: { x: MARGIN_X, y },
        end:   { x: PAGE_WIDTH - MARGIN_X, y },
        thickness: 0.5,
        color: rgb(0.75, 0.75, 0.75),
      });
      y -= 6;
      if (item.spaceAfter) y -= item.spaceAfter;
      continue;
    }

    if (!item.text) {
      y -= item.spaceAfter ?? 0;
      continue;
    }

    const [r, g, b2] = item.color;
    const wrapWidth = CONTENT_WIDTH - item.indent;
    const wrapped = wrapLine(item.text, item.size, item.bold, wrapWidth);

    for (const wLine of wrapped) {
      ensureSpace(item.lineHeight);
      page.drawText(wLine, {
        x:    MARGIN_X + item.indent,
        y,
        size: item.size,
        font: item.bold ? fontB : item.italic ? fontO : font,
        color: rgb(r, g, b2),
      });
      y -= item.lineHeight;
    }

    if (item.spaceAfter) y -= item.spaceAfter;
  }

  const bytes = await pdoc.save();
  return Buffer.from(bytes);
}
