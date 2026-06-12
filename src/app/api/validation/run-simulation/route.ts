import { NextResponse } from "next/server";
import { runCalibrationSimulation } from "@/validation/calibrationSimulation";

export const maxDuration = 300;

export async function POST() {
  try {
    const { report, results } = await runCalibrationSimulation();
    return NextResponse.json({ success: true, report, results });
  } catch (error) {
    console.error("[calibration-sim] Run failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
