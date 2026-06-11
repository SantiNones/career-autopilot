const { PrismaClient } = require('@prisma/client');
const { discoveryScoreJob } = require('./src/server/jobDiscovery/discoveryScoring.js');

const prisma = new PrismaClient();

async function debugV13() {
  try {
    // Get candidate preferences
    const prefs = await prisma.candidatePreferences.findFirst({
      orderBy: { createdAt: "asc" },
    });

    console.log('Preferences found:', prefs ? 'Yes' : 'No');

    // Test V1.3 scoring with a sample job
    const sampleJob = {
      title: "Software Engineer",
      company: "Test Company",
      location: "Remote - Spain",
      description: "Looking for a junior software engineer...",
      applyUrl: "https://example.com/apply",
      source: "test",
      provider: "test",
      providerSlug: "test"
    };

    console.log('\nTesting V1.3 scoring with sample job...');
    
    try {
      const score = discoveryScoreJob(sampleJob, prefs, "support");
      console.log('V1.3 scoring successful:', {
        matchScore: score.matchScore,
        label: score.label,
        roleFamily: score.roleIntent?.roleFamily,
        isTargetRole: score.roleIntent?.isTargetRole,
        queryMatch: score.queryMatch?.matches,
        locationEligible: score.locationEligibility.eligible,
        seniorityAllowed: score.seniorityClassification.allowed
      });
    } catch (error) {
      console.error('V1.3 scoring failed:', error.message);
      console.error('Stack trace:', error.stack);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugV13();
