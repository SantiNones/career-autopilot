"use client";

import { useRouter } from "next/navigation";

import { InlineDeleteButton } from "./InlineDeleteButton";
import { STATUS_COLORS, STATUS_LABELS } from "./StatusControls";
import type { AppStatus } from "./StatusControls";

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${color}`}
    >
      {score}
    </span>
  );
}

function LabelBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    APPLY: "bg-emerald-100 text-emerald-800",
    MAYBE: "bg-amber-100 text-amber-800",
    SKIP: "bg-rose-100 text-rose-800",
  };
  const style = styles[label] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export function JobTableRow({
  job,
}: {
  job: {
    id: string;
    title: string | null;
    companyName: string | null;
    source: string | null;
    createdAt: Date;
    applicationStatus: string;
    evaluations: Array<{ label: string; totalScore: number }>;
  };
}) {
  const router = useRouter();
  const ev = job.evaluations[0];
  const appStatus = job.applicationStatus as AppStatus;

  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-indigo-50/40"
      onClick={() => router.push(`/jobs/${job.id}`)}
    >
      <td className="px-5 py-3.5">
        {ev ? <ScorePill score={ev.totalScore} /> : <span className="text-zinc-300">—</span>}
      </td>
      <td className="px-5 py-3.5">
        {ev ? <LabelBadge label={ev.label} /> : <span className="text-zinc-300">—</span>}
      </td>
      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[appStatus]}`}
        >
          {STATUS_LABELS[appStatus]}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="font-medium text-zinc-900">{job.title ?? "(untitled)"}</div>
        {job.companyName && (
          <div className="mt-0.5 text-xs text-zinc-400">{job.companyName}</div>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
          {job.source ?? "manual"}
        </span>
      </td>
      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-400">
        {new Date(job.createdAt).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>
      <td className="px-5 py-3.5 text-right">
        <InlineDeleteButton jobId={job.id} />
      </td>
    </tr>
  );
}
