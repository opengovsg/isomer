/*
  Warnings:

  - The primary key for the `Blob` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Blob` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Footer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Footer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Navbar` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Navbar` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Permission` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Permission` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Resource` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Resource` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parentId` column on the `Resource` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `blobId` column on the `Resource` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Site` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Site` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `SiteMember` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `siteId` on the `Footer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `siteId` on the `Navbar` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resourceId` on the `Permission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `Permission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `siteId` on the `Resource` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `SiteMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `siteId` on the `SiteMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Footer" DROP CONSTRAINT "Footer_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Navbar" DROP CONSTRAINT "Navbar_siteId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_userId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_blobId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteMember" DROP CONSTRAINT "SiteMember_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteMember" DROP CONSTRAINT "SiteMember_userId_fkey";

-- AlterTable
ALTER TABLE "Blob" DROP CONSTRAINT "Blob_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Blob_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Footer" DROP CONSTRAINT "Footer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL,
ADD CONSTRAINT "Footer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Navbar" DROP CONSTRAINT "Navbar_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL,
ADD CONSTRAINT "Navbar_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Permission" DROP CONSTRAINT "Permission_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "resourceId",
ADD COLUMN     "resourceId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "Permission_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL,
DROP COLUMN "parentId",
ADD COLUMN     "parentId" INTEGER,
DROP COLUMN "blobId",
ADD COLUMN     "blobId" INTEGER,
ADD CONSTRAINT "Resource_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Site" DROP CONSTRAINT "Site_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Site_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SiteMember" DROP CONSTRAINT "SiteMember_pkey",
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
DROP COLUMN "siteId",
ADD COLUMN     "siteId" INTEGER NOT NULL,
ADD CONSTRAINT "SiteMember_pkey" PRIMARY KEY ("siteId", "userId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Footer_siteId_key" ON "Footer"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Navbar_siteId_key" ON "Navbar"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_blobId_key" ON "Resource"("blobId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "Blob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Navbar" ADD CONSTRAINT "Navbar_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Footer" ADD CONSTRAINT "Footer_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMember" ADD CONSTRAINT "SiteMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMember" ADD CONSTRAINT "SiteMember_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
