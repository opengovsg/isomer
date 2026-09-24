/*
  Warnings:

  - You are about to drop the `SiteMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SiteMember" DROP CONSTRAINT "SiteMember_siteId_fkey";

-- DropForeignKey
ALTER TABLE "SiteMember" DROP CONSTRAINT "SiteMember_userId_fkey";

-- DropTable
DROP TABLE "SiteMember";
