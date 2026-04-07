-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT,
    "headline" TEXT,
    "location" TEXT,
    "languages" JSONB
);

-- CreateTable
CREATE TABLE "CandidatePreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "targetTitles" JSONB,
    "positiveKeywords" JSONB,
    "negativeKeywords" JSONB,
    "minNetEurPerMonth" INTEGER,
    "preferredCountries" JSONB,
    "preferredCities" JSONB,
    "preferredWorkMode" TEXT,
    "targetSeniority" TEXT,
    CONSTRAINT "CandidatePreferences_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPosting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    "postedAt" DATETIME,
    "scrapedAt" DATETIME,
    "rawHtml" TEXT,
    "rawText" TEXT,
    "parsedJson" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SOURCED'
);

-- CreateTable
CREATE TABLE "JobEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobPostingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
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
    CONSTRAINT "JobEvaluation_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "appliedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Application_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ApplicationMaterial_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME,
    "endedAt" DATETIME
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    CONSTRAINT "AutomationLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePreferences_userProfileId_key" ON "CandidatePreferences"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPosting_sourceUrl_key" ON "JobPosting"("sourceUrl");
