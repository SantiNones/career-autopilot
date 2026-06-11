import type { CompanySource } from "@prisma/client";

import { stripHtml, type DiscoveredJob, type JobProvider } from "../types";

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string } | null;
  content: string;
  absolute_url: string;
  updated_at: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export const greenhouseProvider: JobProvider = {
  provider: "greenhouse",

  async fetchJobs(source: CompanySource): Promise<DiscoveredJob[]> {
    const slug = source.providerSlug;
    const response = await fetch(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data: GreenhouseResponse = await response.json();

    return (data.jobs ?? []).map((job): DiscoveredJob => ({
      title: job.title,
      company: source.companyName,
      location: job.location?.name || "Not specified",
      description: stripHtml(job.content ?? "").slice(0, 4000),
      applyUrl: job.absolute_url,
      source: `greenhouse:${slug}`,
      provider: "greenhouse",
      providerSlug: slug,
      externalId: String(job.id),
      postedAt: job.updated_at ? new Date(job.updated_at) : null,
    }));
  },
};
