-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'Blog';

-- DropIndex
DROP INDEX "resource_title_trgm_idx";
