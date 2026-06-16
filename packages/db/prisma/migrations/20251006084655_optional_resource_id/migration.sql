-- DropForeignKey
ALTER TABLE "CodeBuildJobs" DROP CONSTRAINT "CodeBuildJobs_resourceId_fkey";

-- AlterTable
ALTER TABLE "CodeBuildJobs" ALTER COLUMN "resourceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CodeBuildJobs" ADD CONSTRAINT "CodeBuildJobs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
