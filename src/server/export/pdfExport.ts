// @ts-nocheck
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { parseMaterialForExport } from "./parseMaterialForExport";

const PAGE_WIDTH  = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const MARGIN_X    = 52;
const MARGIN_TOP  = 52;
const MARGIN_BOT  = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

// Font sizes
const SIZE_NAME    = 22;
const SIZE_ROLE    = 12;
const SIZE_CONTACT =  9;
const SIZE_HEADING = 10.5;
const SIZE_PROJ    = 10.5;
const SIZE_BODY    = 9.5;
const SIZE_LINK    =  9;

// Line heights
const LH_NAME    = 28;
const LH_ROLE    = 17;
const LH_CONTACT = 13;
const LH_HEADING = 16;
const LH_PROJ    = 15;
const LH_BODY    = 14;
const LH_LINK    = 13;

// ── Unicode → WinAnsi normalizer ─────────────────────────────────────────────
export function normalizePdfText(text: string): string {
  return text
    .replace(/\u2011/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2015/g, "-")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2022\u2023\u2024\u2025\u2026\u25AA\u25CF\u25E6\u00B7\u2027]/g, "*")
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

  function textWidth(text: string, size: number, bold: boolean): number {
    return (bold ? fontB : font).widthOfTextAtSize(text, size);
  }

  function wrapLine(text: string, size: number, bold: boolean, maxW = CONTENT_WIDTH): string[] {
    if (textWidth(text, size, bold) <= maxW) return [text];
    const words = text.split(" ");
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (textWidth(candidate, size, bold) <= maxW) {
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
    centered: boolean;
    indent: number;
    color: [number, number, number];
    lineHeight: number;
    spaceBefore: number;
    spaceAfter: number;
    drawRule?: boolean;
  };

  const items: DrawItem[] = [];
  const norm = (s: string) => normalizePdfText(s);

  const parsed = parseMaterialForExport(content);

  for (const line of parsed) {
    const t = norm(line.text);

    switch (line.type) {
      case "name":
        items.push({ text: t.toUpperCase(), size: SIZE_NAME, bold: true, italic: false, centered: true, indent: 0, color: [0.05, 0.05, 0.05], lineHeight: LH_NAME, spaceBefore: 0, spaceAfter: 3 });
        break;
      case "role":
        items.push({ text: t, size: SIZE_ROLE, bold: false, italic: false, centered: true, indent: 0, color: [0.3, 0.3, 0.3], lineHeight: LH_ROLE, spaceBefore: 2, spaceAfter: 6 });
        break;
      case "contact":
        items.push({ text: t, size: SIZE_CONTACT, bold: false, italic: false, centered: true, indent: 0, color: [0.35, 0.35, 0.35], lineHeight: LH_CONTACT, spaceBefore: 1, spaceAfter: 0 });
        break;
      case "link-bar":
        // Render as centered colored label text (pdf-lib doesn't support inline hyperlinks natively)
        items.push({ text: t, size: SIZE_LINK, bold: false, italic: false, centered: true, indent: 0, color: [0.18, 0.36, 0.65], lineHeight: LH_LINK, spaceBefore: 4, spaceAfter: 2 });
        break;
      case "divider":
        items.push({ text: "", size: 0, bold: false, italic: false, centered: false, indent: 0, color: [0.8, 0.8, 0.8], lineHeight: 0, spaceBefore: 6, spaceAfter: 8, drawRule: true });
        break;
      case "section-heading":
        items.push({ text: t, size: SIZE_HEADING, bold: true, italic: false, centered: false, indent: 0, color: [0.08, 0.08, 0.08], lineHeight: LH_HEADING, spaceBefore: 13, spaceAfter: 3 });
        break;
      case "project-title":
        items.push({ text: t, size: SIZE_PROJ, bold: true, italic: false, centered: false, indent: 0, color: [0.08, 0.08, 0.08], lineHeight: LH_PROJ, spaceBefore: 7, spaceAfter: 1 });
        break;
      case "link":
        items.push({ text: t, size: SIZE_LINK, bold: false, italic: false, centered: false, indent: 0, color: [0.18, 0.36, 0.65], lineHeight: LH_LINK, spaceBefore: 1, spaceAfter: 1 });
        break;
      case "bullet":
        items.push({ text: `-  ${t}`, size: SIZE_BODY, bold: false, italic: false, centered: false, indent: 10, color: [0.1, 0.1, 0.1], lineHeight: LH_BODY, spaceBefore: 1, spaceAfter: 0 });
        break;
      case "blank":
        items.push({ text: "", size: SIZE_BODY, bold: false, italic: false, centered: false, indent: 0, color: [0, 0, 0], lineHeight: 0, spaceBefore: 0, spaceAfter: 4 });
        break;
      default:
        if (!t) break;
        items.push({ text: t, size: SIZE_BODY, bold: false, italic: false, centered: false, indent: 0, color: [0.1, 0.1, 0.1], lineHeight: LH_BODY, spaceBefore: 0, spaceAfter: 1 });
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
    if (item.spaceBefore > 0) {
      ensureSpace(item.spaceBefore + (item.lineHeight || LH_BODY));
      y -= item.spaceBefore;
    }

    if (item.drawRule) {
      ensureSpace(6);
      page.drawLine({
        start: { x: MARGIN_X, y },
        end:   { x: PAGE_WIDTH - MARGIN_X, y },
        thickness: 0.4,
        color: rgb(0.78, 0.78, 0.78),
      });
      y -= 4;
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
      const xPos = item.centered
        ? MARGIN_X + (CONTENT_WIDTH - textWidth(wLine, item.size, item.bold)) / 2
        : MARGIN_X + item.indent;
      page.drawText(wLine, {
        x:    xPos,
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
