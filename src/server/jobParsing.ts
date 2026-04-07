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

function extractMetaDescription(html: string): string | undefined {
  const m = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );
  if (!m?.[1]) return undefined;
  return m[1].replace(/\s+/g, " ").trim().slice(0, 300);
}

function extractH1(html: string): string | undefined {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m?.[1]) return undefined;
  const raw = m[1].replace(/<[^>]+>/g, " ");
  return raw.replace(/\s+/g, " ").trim().slice(0, 200);
}

function detectBlockedContent(text: string, title?: string): {
  blocked: boolean;
  reason: string | null;
} {
  const t = `${title ?? ""} ${text}`.toLowerCase();

  const signals: Array<{ match: RegExp; reason: string }> = [
    { match: /sign\s*in|log\s*in|iniciar\s*sesión|acceder/i, reason: "login" },
    { match: /cookie|cookies\s+policy|accept\s+cookies/i, reason: "cookie_wall" },
    { match: /enable\s+javascript|turn\s+on\s+javascript/i, reason: "js_required" },
    { match: /captcha|cloudflare/i, reason: "bot_protection" },
    { match: /join\s+linkedin|linkedin\s+member/i, reason: "linkedin_gated" },
    { match: /subscribe|subscription|paywall/i, reason: "paywall" },
  ];

  for (const s of signals) {
    if (s.match.test(t)) return { blocked: true, reason: s.reason };
  }

  return { blocked: false, reason: null };
}

function guessCompanyFromTitle(title?: string): string | undefined {
  if (!title) return undefined;
  const parts = title.split(/\s[-|•|@]\s/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return parts[parts.length - 1];
  return undefined;
}

export function parseJobFromHtml(sourceUrl: string, html: string): ParsedJob {
  const titleFromTitleTag = extractTitle(html);
  const titleFromH1 = extractH1(html);
  const title = titleFromH1 ?? titleFromTitleTag;
  const companyName = guessCompanyFromTitle(title);
  const metaDescription = extractMetaDescription(html);
  const rawText = stripHtml(html);
  const blocked = detectBlockedContent(rawText, title);

  return {
    title,
    companyName,
    rawText,
    parsedJson: {
      sourceUrl,
      parser: "naive_v1",
      title,
      companyName,
      metaDescription,
      titleFromH1,
      titleFromTitleTag,
      textLength: rawText.length,
      blocked: blocked.blocked,
      blockedReason: blocked.reason,
    },
  };
}
