-- CreateTable
CREATE TABLE "ResumeMaster" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rawText" TEXT,
    "summary" TEXT,
    "experience" TEXT,
    "projects" TEXT,
    "skills" TEXT,
    "education" TEXT,
    "languages" TEXT,
    "links" TEXT,

    CONSTRAINT "ResumeMaster_pkey" PRIMARY KEY ("id")
);
