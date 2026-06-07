import { NextResponse } from "next/server";

import { JobDiscoveryService } from "@/server/jobDiscovery/service";
import { GreenhouseProvider } from "@/server/jobDiscovery/providers/greenhouse";
import { LeverProvider } from "@/server/jobDiscovery/providers/lever";
import { AshbyProvider } from "@/server/jobDiscovery/providers/ashby";

export async function POST(): Promise<NextResponse> {
  try {
    console.log("[discovery] API: starting job discovery");

    const providers = [
      new GreenhouseProvider(),
      new LeverProvider(),
      new AshbyProvider(),
    ];

    const service = new JobDiscoveryService(providers);
    const result = await service.discoverJobs();

    console.log("[discovery] API: complete", result);

    return NextResponse.json({
      success: true,
      totalFetched: result.totalFetched,
      afterDedupe: result.afterDedupe,
      saved: result.saved,
      topMatches: result.topMatches,
    });
  } catch (error) {
    console.error("[discovery] API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
