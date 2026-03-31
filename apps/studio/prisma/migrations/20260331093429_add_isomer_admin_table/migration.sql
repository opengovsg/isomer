-- CreateEnum
CREATE TYPE "IsomerAdminRole" AS ENUM ('Core', 'Migrator');

-- CreateTable
CREATE TABLE "IsomerAdmin" (
    "id" BIGSERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "IsomerAdminRole" NOT NULL,
    "expiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IsomerAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IsomerAdmin_userId_role_deletedAt_key" ON "IsomerAdmin"("userId", "role", "deletedAt");

-- AddForeignKey
ALTER TABLE "IsomerAdmin" ADD CONSTRAINT "IsomerAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
