import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import type { ApplicationStatus } from "@prisma/client";

const VALID_STATUSES: ApplicationStatus[] = [
  "DISCOVERED",
  "APPLY",
  "MAYBE",
  "SKIP",
  "APPLIED",
  "INTERVIEW",
  "REJECTED",
  "OFFER",
];

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as { applicationStatus?: string };
    const incoming = body.applicationStatus as ApplicationStatus;

    if (!VALID_STATUSES.includes(incoming)) {
      return NextResponse.json({ error: "Invalid applicationStatus" }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: { applicationStatus: incoming },
      select: { id: true, applicationStatus: true },
    });

    return NextResponse.json({ ok: true, applicationStatus: updated.applicationStatus });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
