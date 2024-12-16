-- AlterEnum
ALTER TYPE "ResourceType" ADD VALUE 'CollectionMeta';

-- DropIndex
DROP INDEX "resource_title_trgm_idx";
