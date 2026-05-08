-- CreateTable
CREATE TABLE "Redirect" (
    "id" BIGSERIAL NOT NULL,
    "siteId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redirect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Redirect_siteId_source_key" ON "Redirect"("siteId", "source");

-- CreateIndex
CREATE INDEX "Redirect_siteId_idx" ON "Redirect"("siteId");

-- AddForeignKey
ALTER TABLE "Redirect" ADD CONSTRAINT "Redirect_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Auto-update updatedAt on row modification (matches other table patterns)
CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON "Redirect"
  FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");
