-- CreateEnum
CREATE TYPE "BuildStatusType" AS ENUM ('IN_PROGRESS', 'SUCCEEDED', 'FAILED', 'STOPPED');

-- CreateTable
CREATE TABLE "CodeBuildJobs" (
    "id" BIGSERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "status" "BuildStatusType" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeBuildJobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CodeBuildJobs_siteId_idx" ON "CodeBuildJobs"("siteId");

-- CreateIndex
CREATE INDEX "CodeBuildJobs_userId_idx" ON "CodeBuildJobs"("userId");

-- CreateIndex
CREATE INDEX "CodeBuildJobs_buildId_idx" ON "CodeBuildJobs"("buildId");

-- AddForeignKey
ALTER TABLE "CodeBuildJobs" ADD CONSTRAINT "CodeBuildJobs_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeBuildJobs" ADD CONSTRAINT "CodeBuildJobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
