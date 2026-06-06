import {
  Document,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  Packer,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
} from "docx";
import { parseMaterialForExport, type LinkBarEntry } from "./parseMaterialForExport";

const MARGIN_TWIP  = convertInchesToTwip(0.85);
const INDENT_BULLET = convertInchesToTwip(0.22);

// Build a centered "LinkedIn | GitHub | Portfolio" paragraph with real hyperlinks
function buildLinkBarParagraph(entries: LinkBarEntry[]): Paragraph {
  const children: (TextRun | ExternalHyperlink)[] = [];

  entries.forEach((entry, idx) => {
    if (idx > 0) {
      children.push(new TextRun({ text: "  |  ", size: 18, color: "555555" }));
    }
    children.push(
      new ExternalHyperlink({
        link: entry.url,
        children: [
          new TextRun({ text: entry.label, size: 18, color: "1A5296", underline: {} }),
        ],
      }),
    );
  });

  return new Paragraph({
    children,
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 60 },
  });
}

// Build a body link paragraph (project links etc.)
function buildBodyLinkParagraph(text: string): Paragraph {
  const urlMatch = text.match(/https?:\/\/\S+/);
  const url = urlMatch?.[0].replace(/[.,;)]+$/, "");
  const label = (text.replace(/https?:\/\/\S+/g, "").replace(/[:\s\-|]+$/, "").trim() || url) ?? text;

  if (!url) {
    return new Paragraph({
      children: [new TextRun({ text, size: 18, color: "1A5296" })],
      spacing: { after: 40 },
    });
  }

  return new Paragraph({
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text: label || url, size: 18, color: "1A5296", underline: {} })],
      }),
    ],
    spacing: { after: 40 },
  });
}

export async function generateDocxFromText(content: string): Promise<Buffer> {
  const parsed = parseMaterialForExport(content);
  const paragraphs: Paragraph[] = [];

  for (const line of parsed) {
    const t = line.text;

    switch (line.type) {
      case "name":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 48, color: "111111" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 60 },
        }));
        break;

      case "role":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, size: 24, color: "444444" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }));
        break;

      case "contact":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, size: 18, color: "555555" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 30 },
        }));
        break;

      case "link-bar":
        paragraphs.push(buildLinkBarParagraph(line.links ?? []));
        break;

      case "divider":
        paragraphs.push(new Paragraph({
          children: [new TextRun("")],
          border: {
            bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
          spacing: { before: 80, after: 140 },
        }));
        break;

      case "section-heading":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 22, color: "111111" })],
          spacing: { before: 220, after: 80 },
        }));
        break;

      case "project-title":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 20, color: "111111" })],
          spacing: { before: 140, after: 40 },
        }));
        break;

      case "link":
        paragraphs.push(buildBodyLinkParagraph(t));
        break;

      case "bullet":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `\u2022  ${t}`, size: 19, color: "222222" })],
          spacing: { after: 40 },
          indent: { left: INDENT_BULLET },
        }));
        break;

      case "blank":
        paragraphs.push(new Paragraph({
          children: [new TextRun("")],
          spacing: { after: 60 },
        }));
        break;

      default:
        if (!t) break;
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, size: 19, color: "222222" })],
          spacing: { after: 50 },
        }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top:    MARGIN_TWIP,
              bottom: MARGIN_TWIP,
              left:   MARGIN_TWIP,
              right:  MARGIN_TWIP,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
