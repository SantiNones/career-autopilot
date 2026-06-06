-- CreateTable
CREATE TABLE "ExperienceInsight" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resumeMasterId" TEXT NOT NULL,
    "insights" JSONB NOT NULL,

    CONSTRAINT "ExperienceInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceInsight_resumeMasterId_key" ON "ExperienceInsight"("resumeMasterId");

-- AddForeignKey
ALTER TABLE "ExperienceInsight" ADD CONSTRAINT "ExperienceInsight_resumeMasterId_fkey" FOREIGN KEY ("resumeMasterId") REFERENCES "ResumeMaster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
