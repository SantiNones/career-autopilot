import type { DiscoveredJob, JobProvider } from "../types";

interface LeverJob {
  id: string;
  text: string;
  categories: {
    location?: string;
    department?: string;
    team?: string;
  };
  description: string;
  hostedUrl: string;
  applyUrl: string;
  createdAt: number;
}

interface LeverResponse {
  jobs: LeverJob[];
}

export class LeverProvider implements JobProvider {
  name = "lever";

  private companies = [
    "notion",
    "figma",
    "linear",
    "raycast",
    "vercel",
    "supabase",
    "airbyte",
    "retool",
    "merge",
    "resend",
  ];

  async fetchJobs(): Promise<DiscoveredJob[]> {
    const allJobs: DiscoveredJob[] = [];

    for (const company of this.companies) {
      try {
        const response = await fetch(
          `https://api.lever.co/v0/postings/${company}?mode=json`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          console.log(`[discovery] lever/${company}: skipped (status ${response.status})`);
          continue;
        }

        const data: LeverResponse = await response.json();

        const jobs = data.jobs.map((job): DiscoveredJob => ({
          title: job.text,
          company: company.charAt(0).toUpperCase() + company.slice(1),
          location: job.categories?.location || "Remote",
          description: this.extractDescription(job.description),
          applyUrl: job.applyUrl || job.hostedUrl,
          source: `lever:${company}`,
        }));

        allJobs.push(...jobs);
        console.log(`[discovery] lever/${company}: fetched ${jobs.length} jobs`);
      } catch (error) {
        console.log(`[discovery] lever/${company}: error - ${error instanceof Error ? error.message : "unknown"}`);
      }
    }

    console.log(`[discovery] lever: total fetched ${allJobs.length}`);
    return allJobs;
  }

  private extractDescription(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }
}
