-- CreateTable
CREATE TABLE "PreviewLink" (
    "id" BIGSERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreviewLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreviewLink_token_key" ON "PreviewLink"("token");

-- CreateIndex
CREATE INDEX "PreviewLink_siteId_idx" ON "PreviewLink"("siteId");

-- CreateIndex
CREATE INDEX "PreviewLink_resourceId_idx" ON "PreviewLink"("resourceId");

-- CreateIndex
CREATE INDEX "PreviewLink_createdBy_idx" ON "PreviewLink"("createdBy");

-- AddForeignKey
ALTER TABLE "PreviewLink" ADD CONSTRAINT "PreviewLink_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviewLink" ADD CONSTRAINT "PreviewLink_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviewLink" ADD CONSTRAINT "PreviewLink_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreviewLink" ADD CONSTRAINT "PreviewLink_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
