import { NextResponse } from "next/server";

import { MaterialType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { generateMaterials } from "@/server/materialGeneration";
import { generateOpenAiMaterials } from "@/server/openaiMaterials";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;

    // Selection flags — default all true so existing callers without a body still work
    const body = await req.json().catch(() => ({})) as {
      generateCv?: boolean;
      generateCoverLetter?: boolean;
      generateRecruiterMessage?: boolean;
      generateScreeningAnswers?: boolean;
    };
    const generateCv              = body.generateCv              ?? true;
    const generateCoverLetter     = body.generateCoverLetter     ?? true;
    const generateRecruiterMessage= body.generateRecruiterMessage?? true;
    const generateScreeningAnswers= body.generateScreeningAnswers?? true;

    if (!generateCv && !generateCoverLetter && !generateRecruiterMessage && !generateScreeningAnswers) {
      return NextResponse.json({ error: "Select at least one material." }, { status: 400 });
    }

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

    const profileArg = profile ?? { fullName: null, headline: null, location: null, phone: null, email: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, languages: [] };
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

    // Only persist the material types the user selected; others remain untouched.
    const materialTypeMap: Partial<Record<string, string>> = {
      ...(generateCv              ? { TAILORED_CV:        generated.tailoredCv        } : {}),
      ...(generateCoverLetter     ? { COVER_LETTER:       generated.coverLetter       } : {}),
      ...(generateRecruiterMessage? { RECRUITER_MESSAGE:  generated.recruiterMessage  } : {}),
      ...(generateScreeningAnswers? { SCREENING_ANSWERS:  generated.screeningAnswers  } : {}),
    };

    const results = [];

    for (const [typeStr, content] of Object.entries(materialTypeMap) as Array<[string, string]>) {
      const type = typeStr as MaterialType;
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
