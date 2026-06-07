-- CreateTable
CREATE TABLE "PositioningProfile" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "jobPostingId" TEXT NOT NULL,
    "profile" JSONB NOT NULL,

    CONSTRAINT "PositioningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PositioningProfile_jobPostingId_key" ON "PositioningProfile"("jobPostingId");

-- AddForeignKey
ALTER TABLE "PositioningProfile" ADD CONSTRAINT "PositioningProfile_jobPostingId_fkey" FOREIGN KEY ("jobPostingId") REFERENCES "JobPosting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
