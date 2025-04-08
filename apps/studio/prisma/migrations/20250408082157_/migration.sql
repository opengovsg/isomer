/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `ResourcePermission` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,siteId,resourceId]` on the table `ResourcePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ResourcePermission_userId_siteId_resourceId_deletedAt_key";

-- DropIndex
DROP INDEX "User_email_deletedAt_key";

-- AlterTable
ALTER TABLE "ResourcePermission" DROP COLUMN "deletedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "deletedAt";

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePermission_userId_siteId_resourceId_key" ON "ResourcePermission"("userId", "siteId", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
