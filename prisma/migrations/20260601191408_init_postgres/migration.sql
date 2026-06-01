-- CreateEnum
CREATE TYPE "JobLabel" AS ENUM ('APPLY', 'MAYBE', 'SKIP');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('SOURCED', 'PARSED', 'SCORED', 'SHORTLISTED', 'MATERIALS_READY', 'APPLIED', 'INTERVIEW', 'REJECTED');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "location" TEXT,
    "languages" JSONB,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatePreferences" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "targetTitles" JSONB,
    "positiveKeywords" JSONB,
    "negativeKeywords" JSONB,
    "minNetEurPerMonth" INTEGER,
    "preferredCountries" JSONB,
    "preferredCities" JSONB,
    "preferredWorkMode" TEXT,
    "targetSeniority" TEXT,

    CONSTRAINT "CandidatePreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "companyName" TEXT,
    "title" TEXT,
    "location" TEXT,
    "workMode" TEXT,
    "language" TEXT,
    "salaryText" TEXT,
    "salaryMinEur" INTEGER,
    "salaryMaxEur" INTEGER,
    "currency" TEXT,
    "postedAt" TIMESTAMP(3),
    "scrapedAt" TIMESTAMP(3),
    "rawHtml" TEXT,
    "rawText" TEXT,
    "parsedJson" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'SOURCED',

    CONSTRAINT "JobPosting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEvaluation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobPostingId" TEXT NOT NULL,
    "label" "JobLabel" NOT NULL,
    "totalScore" INTEGER NOT NULL,
    "seniorityFit" INTEGER NOT NULL,
    "stackFit" INTEGER NOT NULL,
    "domainFit" INTEGER NOT NULL,
    "languageFit" INTEGER NOT NULL,
    "geographyFit" INTEGER NOT NULL,
    "salaryFit" INTEGER NOT NULL,
    "screeningFit" INTEGER NOT NULL,
    "honestyFit" INTEGER NOT NULL,
    "effortReward" INTEGER NOT NULL,
    "strategicValue" INTEGER NOT NULL,
    "reasons" JSONB,
    "risks" JSONB,
    "gaps" JSONB,
    "narrativeSuggestion" TEXT,
    "llmModel" TEXT,
    "llmPromptVersion" TEXT,

    CONSTRAINT "JobEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationMaterial" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ApplicationMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePreferences_userProfileId_key" ON "CandidatePreferences"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceUrl_key" ON "JobPosting"("sourceUrl");

-- AddForeignKey
ALTER TABLE "CandidatePreferences" ADD CONSTRAINT "CandidatePreferences_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEvaluation" ADD CONSTRAINT "JobEvaluation_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationMaterial" ADD CONSTRAINT "ApplicationMaterial_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
