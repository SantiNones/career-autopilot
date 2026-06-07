import type { DiscoveredJob, JobProvider } from "../types";

interface GreenhouseJob {
  id: number;
  title: string;
  location: {
    name: string;
  };
  content: string;
  absolute_url: string;
  updated_at: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

export class GreenhouseProvider implements JobProvider {
  name = "greenhouse";

  private boards = [
    "stripe",
    "airbnb",
    "netflix",
    "spotify",
    "zoom",
    "figma",
    "notion",
    "linear",
    "vercel",
    "supabase",
  ];

  async fetchJobs(): Promise<DiscoveredJob[]> {
    const allJobs: DiscoveredJob[] = [];

    for (const board of this.boards) {
      try {
        const response = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${board}/jobs`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          console.log(`[discovery] greenhouse/${board}: skipped (status ${response.status})`);
          continue;
        }

        const data: GreenhouseResponse = await response.json();

        const jobs = data.jobs.map((job): DiscoveredJob => ({
          title: job.title,
          company: board.charAt(0).toUpperCase() + board.slice(1),
          location: job.location?.name || "Remote",
          description: this.extractDescription(job.content),
          applyUrl: job.absolute_url,
          source: `greenhouse:${board}`,
        }));

        allJobs.push(...jobs);
        console.log(`[discovery] greenhouse/${board}: fetched ${jobs.length} jobs`);
      } catch (error) {
        console.log(`[discovery] greenhouse/${board}: error - ${error instanceof Error ? error.message : "unknown"}`);
      }
    }

    console.log(`[discovery] greenhouse: total fetched ${allJobs.length}`);
    return allJobs;
  }

  private extractDescription(html: string): string {
    // Simple HTML tag removal for description
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
  }
}
