/*
  Warnings:

  - Added the required column `prefix` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VerificationToken" ADD COLUMN     "prefix" TEXT NOT NULL;
