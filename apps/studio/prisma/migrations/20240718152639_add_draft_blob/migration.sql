/*
  Warnings:

  - You are about to drop the column `blobId` on the `Resource` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mainBlobId]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[draftBlobId]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceState" AS ENUM ('Draft', 'Published');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('Page', 'Folder');

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_blobId_fkey";

-- DropIndex
DROP INDEX "Resource_blobId_key";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "blobId",
ADD COLUMN     "draftBlobId" INTEGER,
ADD COLUMN     "mainBlobId" INTEGER,
ADD COLUMN     "state" "ResourceState" DEFAULT 'Draft',
ADD COLUMN     "type" "ResourceType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Resource_mainBlobId_key" ON "Resource"("mainBlobId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_draftBlobId_key" ON "Resource"("draftBlobId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_mainBlobId_fkey" FOREIGN KEY ("mainBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_draftBlobId_fkey" FOREIGN KEY ("draftBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
