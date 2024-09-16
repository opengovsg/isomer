/*
  Warnings:

  - A unique constraint covering the columns `[siteId,parentId,permalink]` on the table `Resource` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Resource_siteId_idx" ON "Resource"("siteId");

-- CreateIndex
CREATE INDEX "Resource_siteId_id_idx" ON "Resource"("siteId", "id");

-- CreateIndex
CREATE INDEX "Resource_siteId_id_parentId_idx" ON "Resource"("siteId", "id", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "Resource_siteId_parentId_permalink_key" ON "Resource"("siteId", "parentId", "permalink");
