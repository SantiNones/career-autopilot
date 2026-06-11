import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const jobs = await prisma.recommendedJob.findMany({
      orderBy: [{ matchScore: "desc" }, { discoveredAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("[discovery] recommended fetch failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
