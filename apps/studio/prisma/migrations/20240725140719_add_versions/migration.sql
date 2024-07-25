/*
  Warnings:

  - You are about to drop the column `mainBlobId` on the `Resource` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_mainBlobId_fkey";

-- DropIndex
DROP INDEX "Resource_mainBlobId_key";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "mainBlobId",
ADD COLUMN     "versionId" BIGINT;

-- CreateTable
CREATE TABLE "Version" (
    "id" BIGSERIAL NOT NULL,
    "versionNum" BIGINT NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "blobId" BIGINT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Version_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Version_resourceId_key" ON "Version"("resourceId");

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Version" ADD CONSTRAINT "Version_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "Blob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
