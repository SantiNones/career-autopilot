import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET() {
  const resume = await prisma.resumeMaster.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ resume: resume ?? null });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      rawText?: string;
      summary?: string;
      experience?: string;
      projects?: string;
      skills?: string;
      education?: string;
      languages?: string;
      links?: string;
    };

    const existing = await prisma.resumeMaster.findFirst({
      orderBy: { createdAt: "asc" },
    });

    const data = {
      rawText: body.rawText ?? null,
      summary: body.summary ?? null,
      experience: body.experience ?? null,
      projects: body.projects ?? null,
      skills: body.skills ?? null,
      education: body.education ?? null,
      languages: body.languages ?? null,
      links: body.links ?? null,
    };

    const resume = existing
      ? await prisma.resumeMaster.update({ where: { id: existing.id }, data })
      : await prisma.resumeMaster.create({ data });

    return NextResponse.json({ resume });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
