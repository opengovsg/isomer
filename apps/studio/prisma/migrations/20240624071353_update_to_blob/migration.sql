/*
  Warnings:

  - You are about to drop the column `contactUsLink` on the `Footer` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackFormLink` on the `Footer` table. All the data in the column will be lost.
  - You are about to drop the column `privacyStatementLink` on the `Footer` table. All the data in the column will be lost.
  - You are about to drop the column `termsOfUseLink` on the `Footer` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Navbar` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Navbar` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Navbar` table. All the data in the column will be lost.
  - You are about to drop the `NavbarItems` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `Footer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Navbar` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "NavbarItems" DROP CONSTRAINT "NavbarItems_navbarId_fkey";

-- AlterTable
ALTER TABLE "Footer" DROP COLUMN "contactUsLink",
DROP COLUMN "feedbackFormLink",
DROP COLUMN "privacyStatementLink",
DROP COLUMN "termsOfUseLink",
ADD COLUMN     "content" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Navbar" DROP COLUMN "description",
DROP COLUMN "name",
DROP COLUMN "url",
ADD COLUMN     "content" JSONB NOT NULL;

-- DropTable
DROP TABLE "NavbarItems";
