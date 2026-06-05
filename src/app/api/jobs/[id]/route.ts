import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.jobPosting.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      title?: string;
      companyName?: string;
      sourceUrl?: string;
    };

    const title = body.title?.trim();
    const companyName = body.companyName?.trim() ?? undefined;
    const sourceUrl = body.sourceUrl?.trim() ?? undefined;

    // Validation
    if (title !== undefined && title.length < 3) {
      return NextResponse.json(
        { error: "Job title must be at least 3 characters." },
        { status: 400 },
      );
    }
    if (sourceUrl) {
      try {
        new URL(sourceUrl);
      } catch {
        return NextResponse.json(
          { error: "Source URL is not a valid URL." },
          { status: 400 },
        );
      }
    }

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const updated = await prisma.jobPosting.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(companyName !== undefined ? { companyName } : {}),
        ...(sourceUrl !== undefined ? { sourceUrl } : {}),
      },
      select: { id: true, title: true, companyName: true, sourceUrl: true },
    });

    return NextResponse.json({ ok: true, job: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
