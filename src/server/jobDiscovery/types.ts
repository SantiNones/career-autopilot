import type { CompanySource } from "@prisma/client";

export type ProviderName = "greenhouse" | "lever" | "ashby";

export type DiscoveredJob = {
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  source: string;
  provider: ProviderName;
  providerSlug: string;
  externalId?: string;
  postedAt?: Date | null;
};

export type JobProvider = {
  provider: ProviderName;
  fetchJobs(source: CompanySource): Promise<DiscoveredJob[]>;
};

export type DiscoverySummary = {
  providersRun: number;
  companiesScanned: number;
  jobsFetched: number;
  afterDedupe: number;
  jobsSaved: number;
  topMatches: Array<{ company: string; title: string; matchScore: number }>;
};

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
