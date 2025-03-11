-- CreateEnum
CREATE TYPE "AuditLogEvent" AS ENUM ('ResourceCreate', 'ResourceUpdate', 'ResourceDelete', 'ResourceMove', 'UserCreate', 'UserUpdate', 'UserDelete', 'Publish', 'Login', 'Logout', 'PermissionCreate', 'PermissionUpdate', 'PermissionDelete');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "AuditLogEvent" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,
    "delta" JSONB NOT NULL,
    "ipAddress" INET,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
