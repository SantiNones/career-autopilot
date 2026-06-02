import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function POST(
  _req: Request,
  props: { params: Promise<{ id: string; materialId: string }> },
) {
  try {
    const { materialId } = await props.params;
    const mat = await prisma.jobMaterial.update({
      where: { id: materialId },
      data: { status: "REVIEWED" },
    });
    return NextResponse.json({ ok: true, material: mat });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
