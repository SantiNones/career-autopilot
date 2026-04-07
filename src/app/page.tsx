import Link from "next/link";

import { prisma } from "@/lib/db";
import { IngestJobForm } from "@/components/IngestJobForm";
import { RescoreButton } from "@/components/RescoreButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10 text-zinc-900">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Career Autopilot
          </h1>
          <p className="text-sm text-zinc-600">
            MVP: ingest a job URL, parse, score, classify, and generate a tailored
            CV.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/profile"
              className="text-sm font-medium text-zinc-900 underline"
            >
              Edit profile
            </Link>
            <RescoreButton />
          </div>
        </header>

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <IngestJobForm />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-sm font-medium">Job postings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-2">Score</th>
                  <th className="px-4 py-2">Label</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  const ev = job.evaluations[0];
                  return (
                    <tr key={job.id} className="border-t border-zinc-100">
                      <td className="px-4 py-2">
                        {ev ? ev.totalScore : "-"}
                      </td>
                      <td className="px-4 py-2">
                        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs">
                          {ev ? ev.label : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="font-medium text-zinc-900 hover:underline"
                        >
                          {job.title ?? job.sourceUrl}
                        </Link>
                      </td>
                      <td className="px-4 py-2">{job.companyName ?? "-"}</td>
                      <td className="px-4 py-2">{job.source ?? "-"}</td>
                      <td className="px-4 py-2 text-zinc-600">
                        {job.createdAt.toISOString().slice(0, 10)}
                      </td>
                    </tr>
                  );
                })}
                {jobs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-zinc-500" colSpan={6}>
                      No jobs yet. Paste a URL above.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
