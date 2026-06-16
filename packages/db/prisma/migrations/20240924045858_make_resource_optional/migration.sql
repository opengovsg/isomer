/*
  Warnings:

  - The primary key for the `ResourcePermission` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ResourcePermission" DROP CONSTRAINT "ResourcePermission_resourceId_fkey";

-- AlterTable
ALTER TABLE "ResourcePermission" DROP CONSTRAINT "ResourcePermission_pkey",
ALTER COLUMN "resourceId" DROP NOT NULL,
ADD CONSTRAINT "ResourcePermission_pkey" PRIMARY KEY ("siteId", "userId");

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
