-- CreateTable
CREATE TABLE "ResourcePermission" (
    "userId" TEXT NOT NULL,
    "siteId" INTEGER NOT NULL,
    "resourceId" BIGINT NOT NULL,
    "role" "RoleType" NOT NULL,

    CONSTRAINT "ResourcePermission_pkey" PRIMARY KEY ("siteId","userId","resourceId")
);

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePermission" ADD CONSTRAINT "ResourcePermission_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
