const { PrismaClient } = require('@prisma/client');

// Import the scoring function directly
const path = require('path');
const fs = require('fs');

// Read and eval the scoring file (quick test)
const scoringPath = path.join(__dirname, 'src/server/jobDiscovery/discoveryScoring.ts');
const scoringCode = fs.readFileSync(scoringPath, 'utf8');

const prisma = new PrismaClient();

async function debugScoring() {
  try {
    // Get candidate preferences
    const prefs = await prisma.candidatePreferences.findFirst({
      orderBy: { createdAt: "asc" },
    });

    console.log('Preferences found:', prefs ? 'Yes' : 'No');
    
    if (prefs) {
      console.log('V1.2 fields present:', {
        preferredLocations: prefs.preferredLocations ? 'Yes' : 'No',
        remotePreference: prefs.remotePreference ? 'Yes' : 'No',
        targetRoleKeywords: prefs.targetRoleKeywords ? 'Yes' : 'No',
        excludedRoleKeywords: prefs.excludedRoleKeywords ? 'Yes' : 'No',
        allowedSeniorities: prefs.allowedSeniorities ? 'Yes' : 'No'
      });
    }

    // Test scoring with a sample job
    const sampleJob = {
      title: "Software Engineer",
      company: "Test Company",
      location: "Remote - Spain",
      description: "Looking for a junior software engineer...",
      applyUrl: "https://example.com/apply",
      source: "test",
      provider: "test"
    };

    console.log('\nTesting scoring with sample job...');
    
    try {
      const score = discoveryScoreJob(sampleJob, prefs);
      console.log('Scoring successful:', {
        matchScore: score.matchScore,
        label: score.label,
        locationEligible: score.locationEligibility.eligible,
        seniorityAllowed: score.seniorityClassification.allowed
      });
    } catch (error) {
      console.error('Scoring failed:', error.message);
      console.error('Stack trace:', error.stack);
    }

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugScoring();
