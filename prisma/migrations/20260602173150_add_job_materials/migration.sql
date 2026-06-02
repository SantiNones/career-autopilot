-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('TAILORED_CV', 'COVER_LETTER', 'RECRUITER_MESSAGE', 'SCREENING_ANSWERS');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'REVIEWED');

-- CreateTable
CREATE TABLE "JobMaterial" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "content" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "MaterialStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "JobMaterial_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobMaterial" ADD CONSTRAINT "JobMaterial_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
