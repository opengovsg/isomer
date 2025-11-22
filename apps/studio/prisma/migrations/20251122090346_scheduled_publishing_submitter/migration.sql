-- AlterTable
ALTER TABLE "CodeBuildJobs" ALTER COLUMN "buildId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "scheduledBy" TEXT;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_scheduledBy_fkey" FOREIGN KEY ("scheduledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
