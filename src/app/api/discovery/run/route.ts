import { NextResponse } from "next/server";

import { ensureCompanySources, runDiscovery } from "@/server/jobDiscovery/discoveryService";

export const maxDuration = 120;

export async function POST(): Promise<NextResponse> {
  try {
    await ensureCompanySources();
    const summary = await runDiscovery();
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error("[discovery] run failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
