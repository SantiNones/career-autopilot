import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateTailoredResumeMarkdown } from "@/server/cvGenerator";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;

    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: { evaluations: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const profile = await prisma.userProfile.findFirst({
      include: { preferences: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "UserProfile not found" }, { status: 400 });
    }

    const md = generateTailoredResumeMarkdown({
      profile,
      prefs: profile.preferences,
      job: {
        title: job.title,
        companyName: job.companyName,
        rawText: job.rawText,
        sourceUrl: job.sourceUrl,
      },
    });

    const existingApplication = await prisma.application.findFirst({
      where: { jobPostingId: job.id },
      orderBy: { createdAt: "asc" },
    });

    const application =
      existingApplication ??
      (await prisma.application.create({
        data: {
          jobPostingId: job.id,
          status: "materials_ready",
        },
      }));

    const latest = await prisma.applicationMaterial.findFirst({
      where: { applicationId: application.id, type: "tailored_cv_md" },
      orderBy: { createdAt: "desc" },
    });

    const version = (latest?.version ?? 0) + 1;

    await prisma.applicationMaterial.create({
      data: {
        applicationId: application.id,
        type: "tailored_cv_md",
        content: md,
        version,
      },
    });

    return NextResponse.json({ ok: true, version });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
