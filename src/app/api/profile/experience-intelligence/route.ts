import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export type ExperienceInsightEntry = {
  company: string;
  role: string;
  responsibilities: string[];
  skills: string[];
  keywords: string[];
  metrics: string[];
  transferableNarratives: string[];
  workEnvironment: string[];
  professionalThemes: string[];
};

export async function GET() {
  try {
    const resume = await prisma.resumeMaster.findFirst({ orderBy: { createdAt: "asc" } });
    if (!resume) {
      return NextResponse.json({ insights: null });
    }

    const record = await prisma.experienceInsight.findUnique({
      where: { resumeMasterId: resume.id },
    });

    return NextResponse.json({
      insights: record ? (record.insights as ExperienceInsightEntry[]) : null,
      analyzedAt: record?.updatedAt ?? null,
    });
  } catch (e) {
    console.error("[experience-intelligence GET]", e);
    return NextResponse.json({ error: "Failed to load insights" }, { status: 500 });
  }
}
