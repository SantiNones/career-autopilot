import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const existing = await prisma.application.findFirst({
      where: { jobPostingId: id },
      orderBy: { createdAt: "asc" },
    });

    if (existing) {
      await prisma.application.update({
        where: { id: existing.id },
        data: { status: "applied", appliedAt: new Date() },
      });
    } else {
      await prisma.application.create({
        data: {
          jobPostingId: id,
          status: "applied",
          appliedAt: new Date(),
        },
      });
    }

    await prisma.jobPosting.update({
      where: { id },
      data: { status: "APPLIED" },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
