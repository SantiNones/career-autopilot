import { NextResponse } from "next/server";

import { parseResume } from "@/server/resumeParsing";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { rawText?: string };
    const rawText = body.rawText?.trim() ?? "";
    if (!rawText) {
      return NextResponse.json({ error: "rawText is required" }, { status: 400 });
    }
    const parsed = parseResume(rawText);
    return NextResponse.json({ parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
