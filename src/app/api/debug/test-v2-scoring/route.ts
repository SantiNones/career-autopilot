import { NextRequest, NextResponse } from "next/server";
import { analyzeFitV2 } from "@/server/jobScoring/fitAnalysisV2";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // Test V2 scoring on a few real job examples
    const testJobs = [
      {
        title: "Technical Support Engineer - Use Cases",
        company: "Mistral AI",
        description: "We are looking for a Technical Support Engineer with 3+ years of experience in technical support, software engineering, and LLM experience. You will work with enterprise customers, troubleshoot AI/ML workflows, manage data pipelines, and work with Intercom. Must have GDPR/security best practices knowledge.",
        location: "Paris"
      },
      {
        title: "Applied Scientist - AI Research",
        company: "Mistral AI", 
        description: "We are seeking an Applied Scientist with 5+ years of experience in scientific domain expertise, first-author publications, AI/ML track record, and experience with PyTorch/TensorFlow. Must have scientific computing background and machine learning/deep learning expertise. PhD required.",
        location: "Paris"
      },
      {
        title: "Solutions Engineer - DACH",
        company: "Ashby",
        description: "Looking for a Solutions Engineer with 5+ years of enterprise pre-sales experience. Must have enterprise deal cycle experience and be fluent in German and English. Customer-facing role requiring technical consulting skills.",
        location: "Germany"
      }
    ];

    // Get candidate preferences
    const prefs = await prisma.candidatePreferences.findFirst({
      where: { userProfileId: "default" }
    });

    const results = testJobs.map(job => {
      const jobText = `${job.title} ${job.description}`;
      const v2Analysis = analyzeFitV2(jobText, prefs, 100, {
        yearsExperience: 3,
        technologies: ['javascript', 'typescript', 'python', 'react', 'node.js'],
        domains: ['software engineering'],
        credentials: [],
        languages: ['English'],
        location: 'Spain',
        openToRelocation: prefs?.openToRelocation || false,
        preferredCountries: [],
        excludedCountries: [],
        projects: ['AI-powered applications', 'Full-stack web development'],
        customerFacingExperience: true,
        narrativeStrength: 75,
        adjacentSkills: ['AI/ML', 'Product development', 'Technical consulting']
      });

      return {
        title: job.title,
        company: job.company,
        discoveryScore: v2Analysis.discoveryScore,
        fitScore: v2Analysis.fitScore,
        positionabilityScore: v2Analysis.positionabilityScore,
        finalVerdict: v2Analysis.finalVerdict,
        fitReasons: v2Analysis.fitReasons.slice(0, 3),
        fitRisks: v2Analysis.fitRisks.slice(0, 3),
        fitGaps: v2Analysis.fitGaps.slice(0, 3),
        experienceFit: v2Analysis.fitBreakdown.experienceFit,
        seniorityFit: v2Analysis.fitBreakdown.seniorityFit,
        stackFit: v2Analysis.fitBreakdown.stackFit,
        domainFit: v2Analysis.fitBreakdown.domainFit,
        geographyFit: v2Analysis.fitBreakdown.geographyFit,
        languageFit: v2Analysis.fitBreakdown.languageFit,
        honestyFit: v2Analysis.fitBreakdown.honestyFit
      };
    });

    return NextResponse.json({
      success: true,
      testResults: results
    });

  } catch (error) {
    console.error('[debug-v2-scoring] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
