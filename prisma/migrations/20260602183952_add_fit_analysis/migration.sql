-- CreateTable
CREATE TABLE "FitAnalysis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "gaps" JSONB NOT NULL,
    "matchingSkills" JSONB NOT NULL,
    "matchingProjects" JSONB NOT NULL,
    "recommendedAngle" TEXT NOT NULL,
    "companyType" TEXT NOT NULL,
    "jobFocus" TEXT NOT NULL,
    "seniorityDetected" TEXT NOT NULL,
    "confidenceScore" INTEGER NOT NULL,

    CONSTRAINT "FitAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitAnalysis_jobPostingId_key" ON "FitAnalysis"("jobPostingId");

-- AddForeignKey
ALTER TABLE "FitAnalysis" ADD CONSTRAINT "FitAnalysis_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
