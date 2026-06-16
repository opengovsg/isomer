-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_parentId_fkey";

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
