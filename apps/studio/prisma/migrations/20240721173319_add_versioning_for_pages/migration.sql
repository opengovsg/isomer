-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ResourceVersions" (
    "id" SERIAL NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "blobId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,

    CONSTRAINT "ResourceVersions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResourceVersions" ADD CONSTRAINT "ResourceVersions_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceVersions" ADD CONSTRAINT "ResourceVersions_blobId_fkey" FOREIGN KEY ("blobId") REFERENCES "Blob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
