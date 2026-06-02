export type PipelineMetrics = {
  total: number;
  applyLabel: number;
  maybeLabel: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected: number;
  interviewRate: number;
  offerRate: number;
};

type JobLike = {
  evaluations: Array<{ label: string }>;
  applicationStatus: string;
};

export function calculateMetrics(jobs: JobLike[]): PipelineMetrics {
  const total = jobs.length;
  const applyLabel = jobs.filter((j) => j.evaluations[0]?.label === "APPLY").length;
  const maybeLabel = jobs.filter((j) => j.evaluations[0]?.label === "MAYBE").length;
  const applied = jobs.filter((j) => j.applicationStatus === "APPLIED").length;
  const interviews = jobs.filter((j) => j.applicationStatus === "INTERVIEW").length;
  const offers = jobs.filter((j) => j.applicationStatus === "OFFER").length;
  const rejected = jobs.filter((j) => j.applicationStatus === "REJECTED").length;

  const interviewRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;

  return {
    total,
    applyLabel,
    maybeLabel,
    applied,
    interviews,
    offers,
    rejected,
    interviewRate,
    offerRate,
  };
}

export function isActiveApplication(applicationStatus: string): boolean {
  return ["APPLIED", "INTERVIEW", "OFFER"].includes(applicationStatus);
}
