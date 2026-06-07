import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { DiscoveredJob, DiscoveryResult, JobProvider } from "./types";
import { analyzeJobFit } from "../fitAnalysis";

interface ScoredJob extends DiscoveredJob {
  matchScore: number;
  fitAnalysis: ReturnType<typeof analyzeJobFit>;
}

export class JobDiscoveryService {
  private providers: JobProvider[];

  constructor(providers: JobProvider[]) {
    this.providers = providers;
  }

  async discoverJobs(): Promise<{
    totalFetched: number;
    afterDedupe: number;
    saved: number;
    topMatches: Array<{ title: string; company: string; score: number }>;
  }> {
    console.log("[discovery] starting job discovery...");

    // 1. Fetch jobs from all providers
    const discoveryResults = await this.fetchFromAllProviders();
    const totalFetched = discoveryResults.reduce((sum, r) => sum + r.jobsFetched, 0);

    console.log(`[discovery] total fetched: ${totalFetched}`);

    // 2. Normalize and deduplicate
    const uniqueJobs = this.deduplicateJobs(
      discoveryResults.flatMap((r) => r.jobs)
    );

    console.log(`[discovery] after dedupe: ${uniqueJobs.length}`);

    // 3. Get candidate profile and resume for scoring
    const [profile, resume] = await Promise.all([
      prisma.userProfile.findFirst({
        include: { preferences: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.resumeMaster.findFirst({
        orderBy: { createdAt: "asc" },
      }),
    ]);

    if (!profile && !resume) {
      console.log("[discovery] no candidate data found, skipping scoring");
      return {
        totalFetched,
        afterDedupe: uniqueJobs.length,
        saved: 0,
        topMatches: [],
      };
    }

    // 4. Score jobs using existing Fit Analysis
    const scoredJobs = this.scoreJobs(uniqueJobs, profile, resume);

    // 5. Sort by score and take top 20
    const topJobs = scoredJobs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    // 6. Clear old recommendations and save new ones
    await prisma.recommendedJob.deleteMany({});

    for (const job of topJobs) {
      await prisma.recommendedJob.create({
        data: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          applyUrl: job.applyUrl,
          source: job.source,
          matchScore: job.matchScore,
          fitAnalysis: job.fitAnalysis as Prisma.InputJsonValue,
        },
      });
    }

    const topMatches = topJobs.slice(0, 5).map((j) => ({
      title: j.title,
      company: j.company,
      score: j.matchScore,
    }));

    console.log("[discovery] top matches:");
    topMatches.forEach((m) => {
      console.log(`  ${m.company} ${m.title} (${m.score})`);
    });

    console.log(`[discovery] complete: saved ${topJobs.length} recommended jobs`);

    return {
      totalFetched,
      afterDedupe: uniqueJobs.length,
      saved: topJobs.length,
      topMatches,
    };
  }

  private async fetchFromAllProviders(): Promise<DiscoveryResult[]> {
    const results: DiscoveryResult[] = [];

    for (const provider of this.providers) {
      try {
        const jobs = await provider.fetchJobs();
        results.push({
          provider: provider.name,
          jobsFetched: jobs.length,
          jobs,
        });
      } catch (error) {
        console.error(`[discovery] provider ${provider.name} failed:`, error);
        results.push({
          provider: provider.name,
          jobsFetched: 0,
          jobs: [],
        });
      }
    }

    return results;
  }

  private deduplicateJobs(jobs: DiscoveredJob[]): DiscoveredJob[] {
    const seen = new Map<string, DiscoveredJob>();

    for (const job of jobs) {
      // Create a unique key based on company, title (normalized)
      const normalizedTitle = job.title.toLowerCase().trim();
      const normalizedCompany = job.company.toLowerCase().trim();
      const key = `${normalizedCompany}:${normalizedTitle}`;

      // Keep the one with longer description (more complete data)
      const existing = seen.get(key);
      if (!existing || (job.description?.length || 0) > (existing.description?.length || 0)) {
        seen.set(key, job);
      }
    }

    return Array.from(seen.values());
  }

  private scoreJobs(
    jobs: DiscoveredJob[],
    profile: Awaited<ReturnType<typeof prisma.userProfile.findFirst>>,
    resume: Awaited<ReturnType<typeof prisma.resumeMaster.findFirst>>
  ): ScoredJob[] {
    const profileInput: Parameters<typeof analyzeJobFit>[1] = {
      headline: profile?.headline ?? null,
      location: profile?.location ?? null,
      languages: (profile?.languages as string[]) ?? [],
      preferences: profile?.preferences
        ? {
            targetTitles: (profile.preferences.targetTitles as string[]) ?? [],
            targetSeniority: profile.preferences.targetSeniority ?? null,
          }
        : null,
    };

    const resumeInput: Parameters<typeof analyzeJobFit>[2] = resume ?? {
      summary: null,
      experience: null,
      projects: null,
      skills: null,
      education: null,
      languages: null,
      links: null,
    };

    return jobs.map((job) => {
      const jobInput = {
        title: job.title,
        companyName: job.company,
        rawText: job.description,
      };

      const fitAnalysis = analyzeJobFit(jobInput, profileInput, resumeInput);

      return {
        ...job,
        matchScore: fitAnalysis.confidenceScore,
        fitAnalysis,
      };
    });
  }
}
