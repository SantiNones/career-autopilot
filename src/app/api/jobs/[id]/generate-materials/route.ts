import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateMaterials } from "@/server/materialGeneration";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    const [job, profile, resume] = await Promise.all([
      prisma.jobPosting.findUnique({
        where: { id },
        include: {
          evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
      prisma.userProfile.findFirst({
        include: { preferences: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.resumeMaster.findFirst({ orderBy: { createdAt: "asc" } }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const ev = job.evaluations[0] ?? null;
    const prefs = profile?.preferences ?? null;

    const generated = generateMaterials(job, profile ?? { fullName: null, headline: null, location: null, languages: [] }, prefs, resume, ev);

    const materialTypeMap = {
      TAILORED_CV: generated.tailoredCv,
      COVER_LETTER: generated.coverLetter,
      RECRUITER_MESSAGE: generated.recruiterMessage,
      SCREENING_ANSWERS: generated.screeningAnswers,
    } as const;

    const results = [];

    for (const [type, content] of Object.entries(materialTypeMap) as Array<[keyof typeof materialTypeMap, string]>) {
      const existing = await prisma.jobMaterial.findFirst({
        where: { jobPostingId: id, type },
        orderBy: { version: "desc" },
      });

      const nextVersion = existing ? existing.version + 1 : 1;

      const mat = await prisma.jobMaterial.create({
        data: {
          jobPostingId: id,
          type,
          content,
          version: nextVersion,
          status: "DRAFT",
        },
      });
      results.push(mat);
    }

    return NextResponse.json({ ok: true, materials: results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
