import { NextResponse } from "next/server";
import { runCapabilityBenchmark } from "@/validation/capabilityBenchmark";

export const maxDuration = 300;

export async function POST() {
  try {
    const { report, results } = await runCapabilityBenchmark();
    return NextResponse.json({ success: true, report, results });
  } catch (error) {
    console.error("[capability-benchmark] Run failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
