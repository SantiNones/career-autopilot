export type ParsedJob = {
  title?: string;
  companyName?: string;
  location?: string;
  rawText: string;
  parsedJson: Record<string, unknown>;
};

function stripHtml(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts.replace(/<[^>]+>/g, " ");
  return text.replace(/\s+/g, " ").trim();
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m?.[1]) return undefined;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 200);
}

function guessCompanyFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const parts = title.split(/\s[-|•|@]\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return undefined;
}

export function parseJobFromHtml(sourceUrl: string, html: string): ParsedJob {
  const title = extractTitle(html);
  const companyName = guessCompanyFromTitle(title);
  const rawText = stripHtml(html);

  return {
    title,
    companyName,
    rawText,
    parsedJson: {
      sourceUrl,
      parser: "naive_v1",
      title,
      companyName,
    },
  };
}
