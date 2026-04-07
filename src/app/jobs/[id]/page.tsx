import Link from "next/link";

import { prisma } from "@/lib/db";
import { GenerateCvButton } from "@/components/GenerateCvButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
      applications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { materials: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
    },
  });

  if (!job) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-sm text-zinc-600">Job not found.</p>
        <Link href="/" className="text-sm font-medium underline">
          Back
        </Link>
      </main>
    );
  }

  const ev = job.evaluations[0] ?? null;
  const latestMaterial = job.applications[0]?.materials[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/" className="text-sm text-zinc-600 hover:underline">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {job.title ?? "(untitled job)"}
          </h1>
          <p className="text-sm text-zinc-600">
            {job.companyName ?? "-"} · {job.source ?? "-"}
          </p>
          <a
            className="text-sm text-zinc-900 underline"
            href={job.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs">
              {ev ? ev.label : "-"}
            </span>
            <span className="text-sm font-medium">
              Score: {ev ? ev.totalScore : "-"}
            </span>
          </div>
          <GenerateCvButton jobId={job.id} />
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium">Scoring</h2>
          {ev ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>Seniority</div>
              <div className="text-right">{ev.seniorityFit}</div>
              <div>Stack</div>
              <div className="text-right">{ev.stackFit}</div>
              <div>Screening</div>
              <div className="text-right">{ev.screeningFit}</div>
              <div>Honesty</div>
              <div className="text-right">{ev.honestyFit}</div>
              <div>Effort/Reward</div>
              <div className="text-right">{ev.effortReward}</div>
              <div>Strategic</div>
              <div className="text-right">{ev.strategicValue}</div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">No evaluation yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-medium">Top reasons / risks / gaps</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <div>
              <div className="text-xs font-medium text-zinc-600">Reasons</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-zinc-50 p-2 text-xs">
                {JSON.stringify(ev?.reasons ?? [], null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-600">Risks</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-zinc-50 p-2 text-xs">
                {JSON.stringify(ev?.risks ?? [], null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-xs font-medium text-zinc-600">Gaps</div>
              <pre className="mt-1 whitespace-pre-wrap rounded-md bg-zinc-50 p-2 text-xs">
                {JSON.stringify(ev?.gaps ?? [], null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium">Tailored CV (latest)</h2>
        {latestMaterial?.content ? (
          <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs">
            {latestMaterial.content}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">
            No tailored CV generated yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-medium">Extracted raw text (preview)</h2>
        <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md bg-zinc-50 p-3 text-xs">
          {(job.rawText ?? "").slice(0, 12000)}
        </pre>
      </section>
    </main>
  );
}
