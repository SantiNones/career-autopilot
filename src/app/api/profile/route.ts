import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

type ProfilePayload = {
  fullName?: string | null;
  headline?: string | null;
  location?: string | null;
  languages?: string[] | null;
  preferences?: {
    targetTitles?: string[] | null;
    positiveKeywords?: string[] | null;
    negativeKeywords?: string[] | null;
    minNetEurPerMonth?: number | null;
    preferredCountries?: string[] | null;
    preferredCities?: string[] | null;
    preferredWorkMode?: string | null;
    targetSeniority?: string | null;
  } | null;
};

export async function GET() {
  const profile = await prisma.userProfile.findFirst({
    include: { preferences: true },
    orderBy: { createdAt: "asc" },
  });

  if (!profile) {
    const created = await prisma.userProfile.create({
      data: {
        fullName: null,
        headline: null,
        location: null,
        languages: [],
        preferences: { create: {} },
      },
      include: { preferences: true },
    });
    return NextResponse.json({ profile: created });
  }

  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProfilePayload;

    const existing = await prisma.userProfile.findFirst({
      include: { preferences: true },
      orderBy: { createdAt: "asc" },
    });

    const profile =
      existing ??
      (await prisma.userProfile.create({
        data: {
          fullName: null,
          headline: null,
          location: null,
          languages: [],
          preferences: { create: {} },
        },
        include: { preferences: true },
      }));

    const updated = await prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        fullName: body.fullName ?? null,
        headline: body.headline ?? null,
        location: body.location ?? null,
        languages: body.languages ?? [],
        preferences: {
          upsert: {
            create: {
              targetTitles: body.preferences?.targetTitles ?? [],
              positiveKeywords: body.preferences?.positiveKeywords ?? [],
              negativeKeywords: body.preferences?.negativeKeywords ?? [],
              minNetEurPerMonth: body.preferences?.minNetEurPerMonth ?? null,
              preferredCountries: body.preferences?.preferredCountries ?? [],
              preferredCities: body.preferences?.preferredCities ?? [],
              preferredWorkMode: body.preferences?.preferredWorkMode ?? null,
              targetSeniority: body.preferences?.targetSeniority ?? null,
            },
            update: {
              targetTitles: body.preferences?.targetTitles ?? [],
              positiveKeywords: body.preferences?.positiveKeywords ?? [],
              negativeKeywords: body.preferences?.negativeKeywords ?? [],
              minNetEurPerMonth: body.preferences?.minNetEurPerMonth ?? null,
              preferredCountries: body.preferences?.preferredCountries ?? [],
              preferredCities: body.preferences?.preferredCities ?? [],
              preferredWorkMode: body.preferences?.preferredWorkMode ?? null,
              targetSeniority: body.preferences?.targetSeniority ?? null,
            },
          },
        },
      },
      include: { preferences: true },
    });

    return NextResponse.json({ profile: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
