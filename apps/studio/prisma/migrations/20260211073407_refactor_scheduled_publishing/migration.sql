/*
  Warnings:

  - You are about to drop the column `scheduledAt` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledBy` on the `Resource` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ScheduledJobType" AS ENUM ('PublishResource', 'PushDocument');

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_scheduledBy_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "scheduledAt",
DROP COLUMN "scheduledBy";

-- CreateTable
CREATE TABLE "ScheduledJobs" (
    "id" BIGSERIAL NOT NULL,
    "type" "ScheduledJobType" NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "scheduledBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledJobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledJobs_id_idx" ON "ScheduledJobs"("id");

-- AddForeignKey
ALTER TABLE "ScheduledJobs" ADD CONSTRAINT "ScheduledJobs_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledJobs" ADD CONSTRAINT "ScheduledJobs_scheduledBy_fkey" FOREIGN KEY ("scheduledBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
