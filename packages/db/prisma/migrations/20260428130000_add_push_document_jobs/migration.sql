-- CreateTable
CREATE TABLE "PushDocumentJob" (
    "id" BIGSERIAL NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "scheduledBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushDocumentJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PushDocumentJob_scheduledAt_idx" ON "PushDocumentJob"("scheduledAt");

-- CreateIndex
CREATE INDEX "PushDocumentJob_resourceId_idx" ON "PushDocumentJob"("resourceId");

-- AddForeignKey
ALTER TABLE "PushDocumentJob" ADD CONSTRAINT "PushDocumentJob_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushDocumentJob" ADD CONSTRAINT "PushDocumentJob_scheduledBy_fkey" FOREIGN KEY ("scheduledBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
