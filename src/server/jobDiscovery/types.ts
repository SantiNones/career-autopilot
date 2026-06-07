export interface DiscoveredJob {
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  source: string;
}

export interface JobProvider {
  name: string;
  fetchJobs(): Promise<DiscoveredJob[]>;
}

export interface DiscoveryResult {
  provider: string;
  jobsFetched: number;
  jobs: DiscoveredJob[];
}
