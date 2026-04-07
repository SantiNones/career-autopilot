import type { CandidatePreferences, JobLabel } from "@prisma/client";

export type JobScore = {
  label: JobLabel;
  totalScore: number;
  seniorityFit: number;
  stackFit: number;
  domainFit: number;
  languageFit: number;
  geographyFit: number;
  salaryFit: number;
  screeningFit: number;
  honestyFit: number;
  effortReward: number;
  strategicValue: number;
  reasons: string[];
  risks: string[];
  gaps: string[];
  narrativeSuggestion: string;
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function countMatches(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  let c = 0;
  for (const k of keywords) {
    const kk = k.toLowerCase().trim();
    if (!kk) continue;
    if (t.includes(kk)) c += 1;
  }
  return c;
}

function extractRequiredYears(text: string): number | null {
  const t = text.toLowerCase();
  const m = t.match(/(\d{1,2})\s*\+?\s*(?:years|yrs|años)/i);
  if (!m?.[1]) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return n;
}

function looksBlockedOrLowValue(text: string): { blocked: boolean; reason: string | null } {
  const t = text.toLowerCase();
  const short = text.trim().length < 800;
  const blockedSignals: Array<{ re: RegExp; reason: string }> = [
    { re: /sign\s*in|log\s*in|iniciar\s*sesión|acceder/i, reason: "login" },
    { re: /captcha|cloudflare/i, reason: "bot_protection" },
    { re: /join\s+linkedin|linkedin\s+member/i, reason: "linkedin_gated" },
    { re: /enable\s+javascript|turn\s+on\s+javascript/i, reason: "js_required" },
  ];

  for (const s of blockedSignals) {
    if (s.re.test(t)) return { blocked: true, reason: s.reason };
  }

  if (short) return { blocked: true, reason: "too_short" };
  return { blocked: false, reason: null };
}

export function scoreJob(text: string, prefs: CandidatePreferences | null): JobScore {
  const reasons: string[] = [];
  const risks: string[] = [];
  const gaps: string[] = [];

  const quality = looksBlockedOrLowValue(text);
  if (quality.blocked) {
    risks.push(`Low-quality or blocked content (${quality.reason ?? "unknown"})`);
  }

  const positiveKeywords = (prefs?.positiveKeywords as unknown as string[] | undefined) ?? [];
  const negativeKeywords = (prefs?.negativeKeywords as unknown as string[] | undefined) ?? [];

  const pos = countMatches(text, positiveKeywords);
  const neg = countMatches(text, negativeKeywords);

  const years = extractRequiredYears(text);

  let seniorityFit = 70;
  if (years !== null) {
    if (years >= 5) {
      seniorityFit = 10;
      risks.push("Role looks senior (5+ years required)");
    } else if (years >= 3) {
      seniorityFit = 40;
      risks.push("May require 3+ years experience");
    } else {
      seniorityFit = 80;
      reasons.push("Seniority seems compatible");
    }
  }

  const stackFit = clamp(40 + pos * 12 - neg * 10);
  if (stackFit >= 70) reasons.push("Tech stack keywords match");
  if (neg > 0) risks.push("Contains senior/lead keywords");

  const domainFit = 55;
  const languageFit = 60;
  const geographyFit = 60;
  const salaryFit = 50;
  const screeningFit = clamp(60 + pos * 6 - neg * 5);
  const honestyFit = clamp(65 - Math.max(0, (years ?? 0) - 2) * 15);
  if (honestyFit < 40) gaps.push("Experience gap vs requirements");

  const effortReward = clamp(55 + (stackFit - 50) / 2 - (seniorityFit < 30 ? 20 : 0));
  const strategicValue = clamp(55 + (stackFit - 50) / 3);

  let totalScore = Math.round(
    (seniorityFit + stackFit + domainFit + languageFit + geographyFit + salaryFit + screeningFit + honestyFit + effortReward + strategicValue) /
      10,
  );

  if (quality.blocked) {
    totalScore = Math.max(0, totalScore - 25);
  }

  let label: JobLabel = "MAYBE";
  if (seniorityFit <= 20 || totalScore < 45) label = "SKIP";
  else if (totalScore >= 70 && honestyFit >= 55) label = "APPLY";

  if (quality.blocked && label === "APPLY") label = "MAYBE";

  const narrativeSuggestion =
    label === "APPLY"
      ? "Emphasize React/Python projects, end-to-end delivery, and AI-assisted development; keep it concise and role-aligned."
      : label === "MAYBE"
        ? "Clarify fit: highlight transferable experience and address gaps honestly; consider applying if role is truly junior/early-career."
        : "Not recommended: focus effort on closer junior matches with clearer requirements.";

  if (label === "SKIP" && years !== null && years >= 5) reasons.push("Auto-skip: senior requirement");
  if (quality.blocked) reasons.push("Manual review recommended: paste full job description");

  return {
    label,
    totalScore,
    seniorityFit,
    stackFit,
    domainFit,
    languageFit,
    geographyFit,
    salaryFit,
    screeningFit,
    honestyFit,
    effortReward,
    strategicValue,
    reasons,
    risks,
    gaps,
    narrativeSuggestion,
  };
}
