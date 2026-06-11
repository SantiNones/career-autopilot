import type { DiscoveryProvider, CompanySource } from "@prisma/client";

import { prisma } from "@/lib/db";
import { discoveryScoreJob } from "./discoveryScoring";
import { greenhouseProvider, leverProvider, ashbyProvider } from "./providers";
import type { DiscoveredJob, DiscoverySummary, JobProvider } from "./types";

const PROVIDERS: Record<string, JobProvider> = {
  GREENHOUSE: greenhouseProvider,
  LEVER: leverProvider,
  ASHBY: ashbyProvider,
};

const MAX_SAVED_JOBS = 50;

type ScoredJob = DiscoveredJob & {
  matchScore: number;
  label: string;
  reasons: string[];
  risks: string[];
  gaps: string[];
  locationCategory?: string;
  locationEligible?: boolean;
  seniorityLevel?: string;
  seniorityAllowed?: boolean;
  roleFamily?: string | null;
  isTargetRole?: boolean;
  queryMatch?: boolean;
  baseScore?: number;
  finalScore?: number;
  // V2 Scoring Fields
  discoveryScore?: number;
  fitScore?: number;
  positionabilityScore?: number;
  finalVerdict?: string;
  fitReasons?: string[];
  fitRisks?: string[];
  fitGaps?: string[];
  fitBreakdown?: any;
  positionabilityBreakdown?: any;
};

function providerDisplayName(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
}

function dedupeKey(job: DiscoveredJob): string {
  if (job.externalId) {
    return `${job.provider}:${job.externalId}`;
  }
  return [
    job.company.toLowerCase().trim(),
    job.title.toLowerCase().trim(),
    job.location.toLowerCase().trim(),
  ].join("|");
}

function deduplicate(jobs: DiscoveredJob[]): DiscoveredJob[] {
  const seen = new Map<string, DiscoveredJob>();
  for (const job of jobs) {
    const key = dedupeKey(job);
    const existing = seen.get(key);
    if (!existing || (job.description?.length ?? 0) > (existing.description?.length ?? 0)) {
      seen.set(key, job);
    }
  }
  return Array.from(seen.values());
}

export async function runDiscovery(query?: string): Promise<DiscoverySummary> {
  console.log("[discovery] starting discovery run...");

  // 1. Load enabled company sources
  const sources = await prisma.companySource.findMany({
    where: { enabled: true },
    orderBy: { priority: "desc" },
  });

  console.log(`[discovery] enabled sources: ${sources.length}`);

  // 2. Fetch jobs per source, continue on failure
  const allJobs: DiscoveredJob[] = [];
  const providersUsed = new Set<string>();
  let companiesScanned = 0;

  for (const source of sources) {
    const provider = PROVIDERS[source.provider];
    if (!provider) {
      console.log(`[discovery] source skipped: unknown provider ${source.provider}`);
      continue;
    }

    try {
      const jobs = await provider.fetchJobs(source);
      allJobs.push(...jobs);
      providersUsed.add(source.provider);
      companiesScanned += 1;
      console.log(
        `[discovery] source: ${providerDisplayName(source.provider)} / ${source.providerSlug} / jobs fetched: ${jobs.length}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.log(
        `[discovery] source failed: ${providerDisplayName(source.provider)} / ${source.providerSlug} / ${message}`
      );
    }
  }

  const jobsFetched = allJobs.length;
  console.log(`[discovery] total fetched: ${jobsFetched}`);

  // 3. Deduplicate
  const uniqueJobs = deduplicate(allJobs);
  console.log(`[discovery] after dedupe: ${uniqueJobs.length}`);

  // 4. Cheap deterministic scoring (no OpenAI)
  const prefs = await prisma.candidatePreferences.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const scoredJobs: ScoredJob[] = uniqueJobs.map((job) => {
    try {
      const score = discoveryScoreJob(job, prefs, query);
      return {
        ...job,
        matchScore: score.matchScore,
        label: score.label,
        reasons: score.reasons,
        risks: score.risks,
        gaps: score.gaps,
        locationCategory: score.locationEligibility.category,
        locationEligible: score.locationEligibility.eligible,
        seniorityLevel: score.seniorityClassification.level,
        seniorityAllowed: score.seniorityClassification.allowed,
        roleFamily: score.roleIntent?.roleFamily || null,
        isTargetRole: score.roleIntent?.isTargetRole || false,
        queryMatch: score.queryMatch?.matches || false,
        baseScore: score.baseScore,
        finalScore: score.finalScore,
        // V2 Scoring Fields - Now properly assigned
        discoveryScore: score.discoveryScore,
        fitScore: score.fitScore,
        positionabilityScore: score.positionabilityScore,
        finalVerdict: score.finalVerdict,
        fitReasons: score.fitReasons,
        fitRisks: score.fitRisks,
        fitGaps: score.fitGaps,
        fitBreakdown: score.fitBreakdown,
        positionabilityBreakdown: score.positionabilityBreakdown,
      };
    } catch (error) {
      console.error(`[discovery] scoring failed for job: ${job.title} at ${job.company}`, error);
      // Return a basic scored job to prevent complete failure
      return {
        ...job,
        matchScore: 0,
        label: "SKIP",
        reasons: ["Scoring failed"],
        risks: ["Scoring error"],
        gaps: [],
        locationCategory: "unknown",
        locationEligible: false,
        seniorityLevel: "unknown",
        seniorityAllowed: false,
        roleFamily: null,
        isTargetRole: false,
        queryMatch: false,
        baseScore: 0,
        finalScore: 0,
      };
    }
  });

  // 5. Sort by score, take top N
  const topJobs = scoredJobs
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, MAX_SAVED_JOBS);

  // 6. Upsert recommended jobs (update lastSeenAt on existing)
  const now = new Date();
  let jobsSaved = 0;

  for (const job of topJobs) {
    try {
      console.log(`[discovery] attempting to save job: ${job.title} at ${job.company} (score: ${job.matchScore})`);
      console.log(`[discovery] V2 scores - discoveryScore: ${job.discoveryScore}, fitScore: ${job.fitScore}, positionabilityScore: ${job.positionabilityScore}, finalVerdict: ${job.finalVerdict}`);
      
      // Use V2 scoring fields with proper persistence
      const data = {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        applyUrl: job.applyUrl,
        source: job.source,
        provider: job.provider,
        providerSlug: job.providerSlug,
        externalId: job.externalId ?? null,
        matchScore: job.matchScore,
        label: job.finalVerdict || job.label, // Use V2 final verdict if available
        reasons: job.reasons,
        risks: job.risks,
        gaps: job.gaps,
        locationCategory: job.locationCategory,
        locationEligible: job.locationEligible,
        seniorityLevel: job.seniorityLevel,
        seniorityAllowed: job.seniorityAllowed,
        baseScore: job.baseScore,
        finalScore: job.finalScore,
        // V2 Scoring Fields - Now persisted
        discoveryScore: job.discoveryScore || job.matchScore,
        fitScore: job.fitScore || 0,
        positionabilityScore: job.positionabilityScore || 0,
        finalVerdict: job.finalVerdict || 'SKIP',
        fitReasons: job.fitReasons || [],
        fitRisks: job.fitRisks || [],
        fitGaps: job.fitGaps || [],
        fitBreakdown: job.fitBreakdown || {},
        lastSeenAt: now,
      };

      if (job.externalId) {
        console.log(`[discovery] upserting job with externalId: ${job.externalId}`);
        await prisma.recommendedJob.upsert({
          where: {
            provider_externalId: {
              provider: job.provider,
              externalId: job.externalId,
            },
          },
          create: data,
          update: data,
        });
        console.log(`[discovery] upsert successful`);
      } else {
        console.log(`[discovery] creating job without externalId`);
        await prisma.recommendedJob.create({ data });
        console.log(`[discovery] create successful`);
      }
      jobsSaved += 1;
      console.log(`[discovery] successfully saved job: ${job.title} at ${job.company}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.error(`[discovery] save failed: ${job.company} / ${job.title} / ${message}`);
      console.error(`[discovery] error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      console.error(`[discovery] job data:`, JSON.stringify({
        title: job.title,
        company: job.company,
        roleFamily: job.roleFamily,
        isTargetRole: job.isTargetRole,
        queryMatch: job.queryMatch,
        locationCategory: job.locationCategory,
        locationEligible: job.locationEligible,
        seniorityLevel: job.seniorityLevel,
        seniorityAllowed: job.seniorityAllowed
      }, null, 2));
    }
  }

  console.log(`[discovery] saved: ${jobsSaved}`);

  const topMatches = topJobs.slice(0, 5).map((j) => ({
    company: j.company,
    title: j.title,
    matchScore: j.matchScore,
  }));

  console.log("[discovery] top matches:");
  for (const m of topMatches) {
    console.log(`  ${m.company} — ${m.title} (${m.matchScore})`);
  }

  return {
    providersRun: providersUsed.size,
    companiesScanned,
    jobsFetched,
    afterDedupe: uniqueJobs.length,
    jobsSaved,
    topMatches,
  };
}

export const DEFAULT_COMPANY_SOURCES: Array<
  Pick<CompanySource, "companyName" | "providerSlug"> & { provider: "GREENHOUSE" | "LEVER" | "ASHBY" }
> = [
  // Ashby
  { companyName: "Ashby", provider: "ASHBY", providerSlug: "ashby" },
  { companyName: "Linear", provider: "ASHBY", providerSlug: "linear" },
  { companyName: "Vercel", provider: "ASHBY", providerSlug: "vercel" },
  { companyName: "Supabase", provider: "ASHBY", providerSlug: "supabase" },
  { companyName: "Mercury", provider: "ASHBY", providerSlug: "mercury" },
  { companyName: "Retool", provider: "ASHBY", providerSlug: "retool" },
  { companyName: "Ramp", provider: "ASHBY", providerSlug: "ramp" },
  { companyName: "Warp", provider: "ASHBY", providerSlug: "warp" },
  
  // Spain/Europe Company Sources
  { companyName: "TravelPerk", provider: "GREENHOUSE", providerSlug: "travelperk" },
  { companyName: "Typeform", provider: "GREENHOUSE", providerSlug: "typeform" },
  { companyName: "Factorial", provider: "GREENHOUSE", providerSlug: "factorialhr" },
  { companyName: "Glovo", provider: "GREENHOUSE", providerSlug: "glovo" },
  { companyName: "Wallapop", provider: "GREENHOUSE", providerSlug: "wallapop" },
  { companyName: "GetYourGuide", provider: "GREENHOUSE", providerSlug: "getyourguide" },
  { companyName: "N26", provider: "GREENHOUSE", providerSlug: "n26" },
  { companyName: "Trade Republic", provider: "GREENHOUSE", providerSlug: "trade-republic" },
  { companyName: "Personio", provider: "GREENHOUSE", providerSlug: "personio" },
  { companyName: "Babbel", provider: "GREENHOUSE", providerSlug: "babbel" },
  { companyName: "Sennder", provider: "GREENHOUSE", providerSlug: "sennder" },
  { companyName: "Thoughtworks", provider: "GREENHOUSE", providerSlug: "thoughtworks" },
  { companyName: "Canonical", provider: "GREENHOUSE", providerSlug: "canonical" },
  { companyName: "Automattic", provider: "GREENHOUSE", providerSlug: "automattic" },
  { companyName: "Remote", provider: "GREENHOUSE", providerSlug: "remote-com" },
  { companyName: "Oyster", provider: "GREENHOUSE", providerSlug: "oysterhr" },
  { companyName: "Deel", provider: "GREENHOUSE", providerSlug: "deel" },
  { companyName: "Hotjar", provider: "GREENHOUSE", providerSlug: "hotjar" },
  { companyName: "Malt", provider: "GREENHOUSE", providerSlug: "malt" },
  { companyName: "Qonto", provider: "GREENHOUSE", providerSlug: "qonto" },
  { companyName: "Algolia", provider: "GREENHOUSE", providerSlug: "algolia" },
  { companyName: "Contentsquare", provider: "GREENHOUSE", providerSlug: "contentsquare" },
  // Lever (slugs verified against api.lever.co)
  { companyName: "Palantir", provider: "LEVER", providerSlug: "palantir" },
  { companyName: "Kraken", provider: "LEVER", providerSlug: "kraken" },
  { companyName: "Plaid", provider: "LEVER", providerSlug: "plaid" },
  { companyName: "Spotify", provider: "LEVER", providerSlug: "spotify" },
  { companyName: "Mistral AI", provider: "LEVER", providerSlug: "mistral" },
  { companyName: "Binance", provider: "LEVER", providerSlug: "binance" },
  { companyName: "Saronic", provider: "LEVER", providerSlug: "saronic" },
  { companyName: "Voleon", provider: "LEVER", providerSlug: "voleon" },
  // Greenhouse
  { companyName: "Stripe", provider: "GREENHOUSE", providerSlug: "stripe" },
  { companyName: "Airbnb", provider: "GREENHOUSE", providerSlug: "airbnb" },
  { companyName: "Spotify", provider: "GREENHOUSE", providerSlug: "spotify" },
  { companyName: "Zoom", provider: "GREENHOUSE", providerSlug: "zoom" },
  { companyName: "Figma", provider: "GREENHOUSE", providerSlug: "figma" },
  { companyName: "Notion", provider: "GREENHOUSE", providerSlug: "notion" },
  { companyName: "Datadog", provider: "GREENHOUSE", providerSlug: "datadog" },
  { companyName: "Reddit", provider: "GREENHOUSE", providerSlug: "reddit" },
];

export async function ensureCompanySources(): Promise<void> {
  const count = await prisma.companySource.count();
  if (count > 0) return;

  console.log("[discovery] seeding default company sources...");
  for (const source of DEFAULT_COMPANY_SOURCES) {
    await prisma.companySource.upsert({
      where: {
        provider_providerSlug: {
          provider: source.provider,
          providerSlug: source.providerSlug,
        },
      },
      create: {
        companyName: source.companyName,
        provider: source.provider,
        providerSlug: source.providerSlug,
        enabled: true,
        priority: 0,
      },
      update: {},
    });
  }
  console.log(`[discovery] seeded ${DEFAULT_COMPANY_SOURCES.length} company sources`);
}
