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
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? "";
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

  const links = extractLinks(rawText);

  return { rawText, links };
}

function labelUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("linkedin.com")) return `LinkedIn: ${url}`;
  if (lower.includes("github.com")) return `GitHub: ${url}`;
  if (lower.includes("vercel.app") || lower.includes("render.com") || lower.includes("netlify.app")) return `Portfolio: ${url}`;
  return url;
}

export function extractLinks(text: string): string[] {
  const matches = text.match(LINK_REGEX) ?? [];
  const cleaned = matches.map((u) => u.replace(/[.,;)]+$/, ""));
  const unique = Array.from(new Set(cleaned));
  return unique.map(labelUrl);
}
