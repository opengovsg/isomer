/*
  Warnings:

  - You are about to drop the column `Config` on the `Site` table. All the data in the column will be lost.
  - Added the required column `config` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Site" DROP COLUMN "Config",
ADD COLUMN     "config" JSONB NOT NULL;
