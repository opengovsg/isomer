/*
  Warnings:

  - A unique constraint covering the columns `[userId,siteId,resourceId,deletedAt]` on the table `ResourcePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,deletedAt]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ResourcePermission_userId_siteId_resourceId_role_key";

-- DropIndex
DROP INDEX "User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePermission_userId_siteId_resourceId_deletedAt_key" ON "ResourcePermission"("userId", "siteId", "resourceId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_deletedAt_key" ON "User"("email", "deletedAt");
