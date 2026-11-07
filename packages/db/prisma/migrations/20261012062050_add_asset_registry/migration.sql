-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'REMOVAL_FAILED');

-- CreateEnum
CREATE TYPE "AssetLinkSource" AS ENUM ('RESOURCE', 'SITE_CONFIG', 'NAVBAR', 'FOOTER');

-- CreateTable
CREATE TABLE "Asset" (
    "id" BIGSERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "unreferencedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetLink" (
    "id" BIGSERIAL NOT NULL,
    "assetId" BIGINT NOT NULL,
    "resourceId" BIGINT,
    "source" "AssetLinkSource" NOT NULL,
    "usedInDraft" BOOLEAN NOT NULL DEFAULT false,
    "usedInPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_s3Key_key" ON "Asset"("s3Key");

-- CreateIndex
CREATE INDEX "Asset_siteId_idx" ON "Asset"("siteId");

-- CreateIndex
CREATE INDEX "AssetLink_resourceId_idx" ON "AssetLink"("resourceId");

-- CreateIndex
-- NULLS NOT DISTINCT, which Prisma cannot express, stops site-wide links
-- (null "resourceId") from repeating for the same asset and source.
CREATE UNIQUE INDEX "AssetLink_assetId_source_resourceId_key" ON "AssetLink"("assetId", "source", "resourceId") NULLS NOT DISTINCT;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLink" ADD CONSTRAINT "AssetLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetLink" ADD CONSTRAINT "AssetLink_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
-- "resourceId" is set iff the link points at a resource; site-wide sources
-- (SITE_CONFIG, NAVBAR, FOOTER) have none.
ALTER TABLE "AssetLink"
    ADD CONSTRAINT "AssetLink_resourceId_matches_source_check"
    CHECK (("source" = 'RESOURCE') = ("resourceId" IS NOT NULL));

-- AddCheckConstraint
-- Site-wide sources have no draft, so only resource links can be used in one.
ALTER TABLE "AssetLink"
    ADD CONSTRAINT "AssetLink_usedInDraft_resource_only_check"
    CHECK ("source" = 'RESOURCE' OR NOT "usedInDraft");

-- Auto-update updatedAt on row modification (matches other table patterns)
CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON "Asset"
  FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON "AssetLink"
  FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");
