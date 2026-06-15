/*
  Warnings:

  - The primary key for the `ResourcePermission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId,siteId,resourceId,role]` on the table `ResourcePermission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ResourcePermission" DROP CONSTRAINT "ResourcePermission_pkey",
ADD COLUMN     "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "ResourcePermission_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePermission_userId_siteId_resourceId_role_key" ON "ResourcePermission"("userId", "siteId", "resourceId", "role");
