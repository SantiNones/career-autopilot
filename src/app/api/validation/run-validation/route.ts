import { NextResponse } from "next/server";
import { generateValidationReport } from "@/validation/validationRunner";

export async function POST() {
  try {
    console.log("[validation-api] Starting validation run");
    
    const report = await generateValidationReport();
    
    console.log("[validation-api] Validation completed successfully");
    
    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("[validation-api] Validation failed:", error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
