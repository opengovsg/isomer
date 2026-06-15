/*
  Warnings:

  - Added the required column `Config` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "Config" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "Navbar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Navbar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavbarItems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "navbarId" TEXT NOT NULL,

    CONSTRAINT "NavbarItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Footer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "contactUsLink" TEXT,
    "feedbackFormLink" TEXT,
    "privacyStatementLink" TEXT,
    "termsOfUseLink" TEXT,

    CONSTRAINT "Footer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Navbar_siteId_key" ON "Navbar"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Footer_siteId_key" ON "Footer"("siteId");

-- AddForeignKey
ALTER TABLE "Navbar" ADD CONSTRAINT "Navbar_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavbarItems" ADD CONSTRAINT "NavbarItems_navbarId_fkey" FOREIGN KEY ("navbarId") REFERENCES "Navbar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Footer" ADD CONSTRAINT "Footer_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
