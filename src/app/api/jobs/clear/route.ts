import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function DELETE() {
  try {
    const { count } = await prisma.jobPosting.deleteMany({});
    return NextResponse.json({ ok: true, deleted: count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
