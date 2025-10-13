/*
  Warnings:

  - A unique constraint covering the columns `[resourceId,versionNum]` on the table `Version` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Version_resourceId_versionNum_key" ON "Version"("resourceId", "versionNum");
