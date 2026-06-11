import type { CompanySource } from "@prisma/client";

import { stripHtml, type DiscoveredJob, type JobProvider } from "../types";

interface LeverJob {
  id: string;
  text: string;
  categories?: {
    location?: string;
    department?: string;
    team?: string;
  };
  description?: string;
  descriptionPlain?: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
}

export const leverProvider: JobProvider = {
  provider: "lever",

  async fetchJobs(source: CompanySource): Promise<DiscoveredJob[]> {
    const slug = source.providerSlug;
    const response = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { headers: { Accept: "application/json" } }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Lever returns a raw array of postings
    const data: LeverJob[] = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("unexpected response shape");
    }

    return data.map((job): DiscoveredJob => ({
      title: job.text,
      company: source.companyName,
      location: job.categories?.location || "Not specified",
      description: (job.descriptionPlain ?? stripHtml(job.description ?? "")).slice(0, 4000),
      applyUrl: job.applyUrl || job.hostedUrl,
      source: `lever:${slug}`,
      provider: "lever",
      providerSlug: slug,
      externalId: job.id,
      postedAt: job.createdAt ? new Date(job.createdAt) : null,
    }));
  },
};
