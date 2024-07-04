/*
  Warnings:

  - You are about to drop the column `blobId` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publishedBlobId]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[draftBlobId]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_blobId_fkey";

-- DropIndex
DROP INDEX "Resource_blobId_key";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "blobId",
ADD COLUMN     "draftBlobId" INTEGER,
ADD COLUMN     "publishedBlobId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Resource_publishedBlobId_key" ON "Resource"("publishedBlobId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_draftBlobId_key" ON "Resource"("draftBlobId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_publishedBlobId_fkey" FOREIGN KEY ("publishedBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_draftBlobId_fkey" FOREIGN KEY ("draftBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
