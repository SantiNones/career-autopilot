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
import { parseMaterialForExport } from "./parseMaterialForExport";

const MARGIN_TWIP = convertInchesToTwip(0.9);
const INDENT_BULLET = convertInchesToTwip(0.25);

// Extract all URLs from a line
function extractUrls(text: string): string[] {
  return (text.match(/https?:\/\/\S+/g) ?? []).map((u) => u.replace(/[.,;)]+$/, ""));
}

function buildLinkParagraph(text: string): Paragraph {
  const urls = extractUrls(text);

  if (urls.length === 0) {
    return new Paragraph({
      children: [new TextRun({ text, size: 18, color: "4040B0" })],
      spacing: { after: 40 },
    });
  }

  // Build runs: split text around each URL, wrap URLs in ExternalHyperlink
  const children: (TextRun | ExternalHyperlink)[] = [];
  let remaining = text;

  for (const url of urls) {
    const idx = remaining.indexOf(url);
    if (idx > 0) {
      const label = remaining.slice(0, idx).replace(/\s+$/, " ");
      children.push(new TextRun({ text: label, size: 18, color: "404040" }));
    }
    children.push(
      new ExternalHyperlink({
        link: url,
        children: [
          new TextRun({ text: url, size: 18, color: "1155CC", underline: {} }),
        ],
      }),
    );
    remaining = remaining.slice(idx + url.length);
  }
  if (remaining.trim()) {
    children.push(new TextRun({ text: remaining, size: 18, color: "404040" }));
  }

  return new Paragraph({
    children,
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
          children: [new TextRun({ text: t, bold: true, size: 44, color: "111111" })],
          spacing: { after: 40 },
          alignment: AlignmentType.LEFT,
        }));
        break;

      case "role":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, size: 26, color: "444444" })],
          spacing: { after: 40 },
        }));
        break;

      case "contact":
        paragraphs.push(buildLinkParagraph(t));
        break;

      case "divider":
        paragraphs.push(new Paragraph({
          children: [new TextRun("")],
          border: {
            bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
          spacing: { before: 60, after: 120 },
        }));
        break;

      case "section-heading":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 22, color: "111111" })],
          spacing: { before: 200, after: 80 },
          border: {
            bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 4 },
          },
        }));
        break;

      case "project-title":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, bold: true, size: 20, color: "111111" })],
          spacing: { before: 120, after: 40 },
        }));
        break;

      case "link":
        paragraphs.push(buildLinkParagraph(t));
        break;

      case "bullet":
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `\u2022  ${t}`, size: 20, color: "222222" })],
          spacing: { after: 40 },
          indent: { left: INDENT_BULLET },
        }));
        break;

      case "blank":
        paragraphs.push(new Paragraph({
          children: [new TextRun("")],
          spacing: { after: 80 },
        }));
        break;

      default:
        if (!t) break;
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: t, size: 20, color: "222222" })],
          spacing: { after: 60 },
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
