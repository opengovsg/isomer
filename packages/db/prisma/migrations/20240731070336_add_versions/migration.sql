/*
  Warnings:

  - You are about to drop the column `mainBlobId` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publishedVersionId]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_mainBlobId_fkey";

-- DropIndex
DROP INDEX "Resource_mainBlobId_key";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "mainBlobId",
ADD COLUMN     "publishedVersionId" BIGINT;

-- CreateTable
CREATE TABLE "Version" (
    "id" BIGSERIAL NOT NULL,
    "versionNum" INTEGER NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "blobId" BIGINT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedBy" TEXT NOT NULL,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Version_blobId_key" ON "Version"("blobId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_publishedVersionId_key" ON "Resource"("publishedVersionId");

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "Blob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_publishedBy_fkey" FOREIGN KEY ("publishedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "Version"("id") ON DELETE SET NULL ON UPDATE CASCADE;
