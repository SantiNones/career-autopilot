import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { generateCandidateIntelligence } from "@/server/candidateIntelligence/candidateIntelligenceGenerator";

export async function POST() {
  try {
    console.log("[candidate-intelligence] Starting analysis");

    // Get user profile
    const userProfile = await prisma.userProfile.findFirst({
      include: {
        preferences: true,
        candidateIntelligence: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("[candidate-intelligence] User profile found:", userProfile.id);

    // Get resume and experience insight
    const resumeMaster = await prisma.resumeMaster.findFirst({
      include: {
        experienceInsight: true,
      },
    });

    console.log("[candidate-intelligence] Resume found:", !!resumeMaster);
    console.log("[candidate-intelligence] Experience insight found:", !!resumeMaster?.experienceInsight);

    // Check if we have experience insight
    if (!resumeMaster?.experienceInsight) {
      return NextResponse.json(
        { 
          error: "Experience Intelligence required",
          message: "Run Experience Intelligence first for better results."
        },
        { status: 400 }
      );
    }

    // Generate candidate intelligence
    const candidateIntelligence = await generateCandidateIntelligence(
      userProfile,
      resumeMaster,
      resumeMaster.experienceInsight
    );

    console.log("[candidate-intelligence] Generated role families:", candidateIntelligence.primaryRoleFamilies);
    console.log("[candidate-intelligence] Project evidence count:", 
      Array.isArray(candidateIntelligence.projectEvidence) ? candidateIntelligence.projectEvidence.length : 0);
    console.log("[candidate-intelligence] Risk areas:", 
      Array.isArray(candidateIntelligence.riskAreas) ? candidateIntelligence.riskAreas.length : 0);

    // Save to database
    const saved = await prisma.candidateIntelligence.upsert({
      where: {
        userProfileId: userProfile.id,
      },
      update: {
        ...candidateIntelligence,
        analyzedAt: new Date(),
      },
      create: {
        userProfileId: userProfile.id,
        ...candidateIntelligence,
        analyzedAt: new Date(),
      },
    });

    console.log("[candidate-intelligence] Saved to database:", saved.id);

    return NextResponse.json({
      success: true,
      candidateIntelligence: saved,
    });

  } catch (error) {
    console.error("[candidate-intelligence] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const userProfile = await prisma.userProfile.findFirst({
      include: {
        candidateIntelligence: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      candidateIntelligence: userProfile.candidateIntelligence,
      hasAnalysis: !!userProfile.candidateIntelligence,
    });

  } catch (error) {
    console.error("[candidate-intelligence] GET error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
