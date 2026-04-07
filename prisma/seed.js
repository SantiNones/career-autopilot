/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.userProfile.findFirst({
    include: { preferences: true },
  });

  if (existing) {
    console.log("Seed skipped: UserProfile already exists", { id: existing.id });
    return;
  }

  const profile = await prisma.userProfile.create({
    data: {
      fullName: "Santi",
      headline: "Junior Full-Stack Developer (React / Python)",
      location: "Barcelona, Spain",
      languages: ["es", "en"],
      preferences: {
        create: {
          targetTitles: [
            "Junior Frontend Developer",
            "Junior Full-Stack Developer",
            "React Developer Junior",
            "Python Developer Junior",
            "Technical Support",
            "Customer/Technical Onboarding",
            "AI Operations",
          ],
          positiveKeywords: [
            "react",
            "javascript",
            "typescript",
            "python",
            "flask",
            "postgresql",
            "junior",
            "frontend",
            "full-stack",
            "support",
          ],
          negativeKeywords: ["senior", "lead", "principal", "staff", "10+ years"],
          minNetEurPerMonth: 2000,
          preferredCountries: ["ES"],
          preferredCities: ["Barcelona"],
          preferredWorkMode: "remote_or_hybrid",
          targetSeniority: "junior",
        },
      },
    },
  });

  console.log("Seeded UserProfile", { id: profile.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
