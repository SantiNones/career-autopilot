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
