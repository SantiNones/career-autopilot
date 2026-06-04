import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateMaterials } from "@/server/materialGeneration";
import { generateOpenAiMaterials } from "@/server/openaiMaterials";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    const [job, profile, resume, rawFitAnalysis] = await Promise.all([
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
      prisma.fitAnalysis.findUnique({ where: { jobPostingId: id } }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const ev = job.evaluations[0] ?? null;
    const prefs = profile?.preferences ?? null;

    const fitAnalysis = rawFitAnalysis
      ? {
          recommendedAngle: rawFitAnalysis.recommendedAngle,
          jobFocus: rawFitAnalysis.jobFocus,
          matchingSkills: rawFitAnalysis.matchingSkills as string[],
          matchingProjects: rawFitAnalysis.matchingProjects as string[],
          strengths: rawFitAnalysis.strengths as string[],
          gaps: rawFitAnalysis.gaps as string[],
          confidenceScore: rawFitAnalysis.confidenceScore,
          seniorityDetected: rawFitAnalysis.seniorityDetected,
        }
      : null;

    const profileArg = profile ?? { fullName: null, headline: null, location: null, languages: [] };
    const hasOpenAiKey = !!process.env.OPENAI_API_KEY;

    type GeneratedMaterials = {
      tailoredCv: string;
      coverLetter: string;
      recruiterMessage: string;
      screeningAnswers: string;
    };

    let generated: GeneratedMaterials;
    // generatedBy stays "template" unless OpenAI succeeds; the badge in the UI reflects this.
    let generatedBy: "openai" | "template" = "template";

    // Deterministic fallback: if OPENAI_API_KEY is absent or the AI call fails, we always
    // produce usable materials from the template generator so the user is never blocked.
    if (hasOpenAiKey) {
      try {
        generated = await generateOpenAiMaterials({
          profile: profileArg,
          preferences: prefs,
          resume,
          job,
          evaluation: ev,
          fitAnalysis,
        });
        generatedBy = "openai";
      } catch (aiErr) {
        console.error("[generate-materials] OpenAI failed — falling back to template:", aiErr);
        generated = generateMaterials(job, profileArg, prefs, resume, ev, fitAnalysis);
      }
    } else {
      generated = generateMaterials(job, profileArg, prefs, resume, ev, fitAnalysis);
    }

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

    return NextResponse.json({ ok: true, materials: results, generatedBy });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
