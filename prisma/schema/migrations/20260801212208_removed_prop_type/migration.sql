/*
  Warnings:

  - You are about to drop the column `target_equity` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "target_equity",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "ACCOUNT_TYPE";
