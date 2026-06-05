import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Packer,
  AlignmentType,
  LevelFormat,
  convertInchesToTwip,
} from "docx";

const MARGIN_TWIP = convertInchesToTwip(1.0);

function isHeading(line: string): boolean {
  return /^[A-Z][A-Z\s&/]{2,}$/.test(line.trim());
}

function isBullet(line: string): boolean {
  return /^[•·\-\*]\s/.test(line.trim());
}

function buildParagraph(line: string): Paragraph {
  const trimmed = line.trim();

  if (!trimmed) {
    // Empty line — small spacing paragraph
    return new Paragraph({
      children: [new TextRun("")],
      spacing: { after: 60 },
    });
  }

  if (isHeading(trimmed)) {
    return new Paragraph({
      children: [new TextRun({ text: trimmed, bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 160, after: 80 },
      border: {
        bottom: { color: "CCCCCC", space: 1, style: "single", size: 4 },
      },
    });
  }

  if (isBullet(trimmed)) {
    const text = trimmed.replace(/^[•·\-\*]\s*/, "");
    return new Paragraph({
      children: [new TextRun({ text, size: 20 })],
      numbering: { reference: "bullet-list", level: 0 },
      spacing: { after: 40 },
    });
  }

  return new Paragraph({
    children: [new TextRun({ text: trimmed, size: 20 })],
    spacing: { after: 60 },
    alignment: AlignmentType.LEFT,
  });
}

export async function generateDocxFromText(content: string): Promise<Buffer> {
  const lines = content.split("\n");
  const children = lines.map((line) => buildParagraph(line));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left:       convertInchesToTwip(0.375),
                    hanging:    convertInchesToTwip(0.25),
                  },
                },
                run: { font: "Calibri", size: 20 },
              },
            },
          ],
        },
      ],
    },
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
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
