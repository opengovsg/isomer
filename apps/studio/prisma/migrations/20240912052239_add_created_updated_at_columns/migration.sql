CREATE EXTENSION IF NOT EXISTS moddatetime;

-- AlterTable
ALTER TABLE "Blob" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Blob" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Footer" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Footer" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Navbar" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Navbar" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Permission" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Permission" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Resource" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Resource" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Site" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "SiteMember" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "SiteMember" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");

-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_timestamp BEFORE UPDATE ON "Version" FOR EACH ROW EXECUTE PROCEDURE moddatetime("updatedAt");