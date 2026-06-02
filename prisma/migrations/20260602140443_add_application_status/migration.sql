-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DISCOVERED', 'APPLY', 'MAYBE', 'SKIP', 'APPLIED', 'INTERVIEW', 'REJECTED', 'OFFER');

-- AlterTable
ALTER TABLE "JobPosting" ADD COLUMN     "applicationStatus" "ApplicationStatus" NOT NULL DEFAULT 'DISCOVERED';
