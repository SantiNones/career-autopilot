const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupV12Preferences() {
  try {
    // Get the first user profile
    const profile = await prisma.userProfile.findFirst();
    
    if (!profile) {
      console.log('No user profile found');
      return;
    }

    console.log('Found user profile:', profile.id);

    // Update candidate preferences with V1.2 fields
    const updatedPrefs = await prisma.candidatePreferences.upsert({
      where: { userProfileId: profile.id },
      update: {
        preferredLocations: ["Barcelona", "Spain", "Europe", "European Union", "Remote Europe", "Remote Spain"],
        preferredCountries: ["Spain", "Netherlands", "Germany", "Ireland", "France", "Portugal"],
        remotePreference: "remote_or_hybrid",
        openToRelocation: false,
        targetRoleKeywords: ["junior developer", "full stack", "frontend", "backend", "product support", "technical support", "solutions engineer", "implementation specialist", "ai automation", "ai engineer", "forward deployed engineer", "developer relations", "customer engineer"],
        excludedRoleKeywords: ["senior", "staff", "principal", "lead", "director", "head of", "manager", "mobile engineer", "ios", "android", "embedded", "security engineer", "data scientist", "product manager", "sales", "account executive"],
        allowedSeniorities: ["internship", "new grad", "entry level", "junior", "associate", "mid"],
        excludedCountries: ["United States only", "US only", "Canada only"]
      },
      create: {
        userProfileId: profile.id,
        preferredLocations: ["Barcelona", "Spain", "Europe", "European Union", "Remote Europe", "Remote Spain"],
        preferredCountries: ["Spain", "Netherlands", "Germany", "Ireland", "France", "Portugal"],
        remotePreference: "remote_or_hybrid",
        openToRelocation: false,
        targetRoleKeywords: ["junior developer", "full stack", "frontend", "backend", "product support", "technical support", "solutions engineer", "implementation specialist", "ai automation", "ai engineer", "forward deployed engineer", "developer relations", "customer engineer"],
        excludedRoleKeywords: ["senior", "staff", "principal", "lead", "director", "head of", "manager", "mobile engineer", "ios", "android", "embedded", "security engineer", "data scientist", "product manager", "sales", "account executive"],
        allowedSeniorities: ["internship", "new grad", "entry level", "junior", "associate", "mid"],
        excludedCountries: ["United States only", "US only", "Canada only"]
      }
    });

    console.log('Updated V1.2 preferences:', updatedPrefs.id);
    console.log('Setup complete!');
    
  } catch (error) {
    console.error('Error setting up preferences:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupV12Preferences();
