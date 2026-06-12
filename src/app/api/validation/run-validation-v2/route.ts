import { NextResponse } from "next/server";
import { runValidationV2 } from "@/validation/validationRunnerV2";

export const maxDuration = 300;

export async function POST() {
  try {
    const { results, report } = await runValidationV2();
    return NextResponse.json({ success: true, report, results });
  } catch (error) {
    console.error("[validation-v2] Run failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
