/*
  Warnings:

  - The primary key for the `Blob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Resource` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_draftBlobId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_mainBlobId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- AlterTable
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Blob_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Permission" ALTER COLUMN "resourceId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ALTER COLUMN "parentId" SET DATA TYPE BIGINT,
ALTER COLUMN "draftBlobId" SET DATA TYPE BIGINT,
ALTER COLUMN "mainBlobId" SET DATA TYPE BIGINT,
ADD CONSTRAINT "Resource_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_mainBlobId_fkey" FOREIGN KEY ("mainBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_draftBlobId_fkey" FOREIGN KEY ("draftBlobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
