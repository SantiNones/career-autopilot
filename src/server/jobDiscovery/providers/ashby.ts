import type { DiscoveredJob, JobProvider } from "../types";

interface AshbyJob {
  id: string;
  title: string;
  locationName: string;
  departmentName: string;
  descriptionHtml: string;
  employmentType: string;
  isRemote: boolean;
  jobPostingUrl: string;
  publishedAt: string;
}

interface AshbyResponse {
  jobs: AshbyJob[];
}

export class AshbyProvider implements JobProvider {
  name = "ashby";

  private companies = [
    { id: "ashby", name: "Ashby" },
    { id: "linear", name: "Linear" },
    { id: "vercel", name: "Vercel" },
    { id: "supabase", name: "Supabase" },
    { id: "mercury", name: "Mercury" },
    { id: "retool", name: "Retool" },
    { id: "fountain", name: "Fountain" },
    { id: "descript", name: "Descript" },
    { id: "ramp", name: "Ramp" },
    { id: "warp", name: "Warp" },
  ];

  async fetchJobs(): Promise<DiscoveredJob[]> {
    const allJobs: DiscoveredJob[] = [];

    for (const company of this.companies) {
      try {
        const response = await fetch(
          `https://api.ashbyhq.com/posting-api/job-board/${company.id}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          console.log(`[discovery] ashby/${company.id}: skipped (status ${response.status})`);
          continue;
        }

        const data: AshbyResponse = await response.json();

        const jobs = data.jobs.map((job): DiscoveredJob => ({
          title: job.title,
          company: company.name,
          location: job.isRemote ? "Remote" : (job.locationName || "Not specified"),
          description: this.extractDescription(job.descriptionHtml),
          applyUrl: job.jobPostingUrl,
          source: `ashby:${company.id}`,
        }));

        allJobs.push(...jobs);
        console.log(`[discovery] ashby/${company.id}: fetched ${jobs.length} jobs`);
      } catch (error) {
        console.log(`[discovery] ashby/${company.id}: error - ${error instanceof Error ? error.message : "unknown"}`);
      }
    }

    console.log(`[discovery] ashby: total fetched ${allJobs.length}`);
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
