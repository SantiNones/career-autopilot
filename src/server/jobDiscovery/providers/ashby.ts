import type { CompanySource } from "@prisma/client";

import { stripHtml, type DiscoveredJob, type JobProvider } from "../types";

interface AshbyJob {
  id: string;
  title: string;
  locationName?: string;
  location?: string;
  departmentName?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  employmentType?: string;
  isRemote?: boolean;
  jobUrl?: string;
  applyUrl?: string;
  jobPostingUrl?: string;
  publishedAt?: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export const ashbyProvider: JobProvider = {
  provider: "ashby",

  async fetchJobs(source: CompanySource): Promise<DiscoveredJob[]> {
    const slug = source.providerSlug;
    const response = await fetch(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=false`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: AshbyResponse = await response.json();

    return (data.jobs ?? []).map((job): DiscoveredJob => {
      const location = job.isRemote
        ? "Remote"
        : job.location || job.locationName || "Not specified";
      const applyUrl =
        job.applyUrl || job.jobUrl || job.jobPostingUrl || "";

      return {
        title: job.title,
        company: source.companyName,
        location,
        description: (job.descriptionPlain ?? stripHtml(job.descriptionHtml ?? "")).slice(0, 4000),
        applyUrl,
        source: `ashby:${slug}`,
        provider: "ashby",
        providerSlug: slug,
        externalId: job.id,
        postedAt: job.publishedAt ? new Date(job.publishedAt) : null,
      };
    });
  },
};
