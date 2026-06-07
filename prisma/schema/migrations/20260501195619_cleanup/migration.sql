/*
  Warnings:

  - The values [REAL] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `balance` on the `Account` table. All the data in the column will be lost.
  - Added the required column `currentEquity` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountType_new" AS ENUM ('LIVE', 'DEMO');
ALTER TABLE "Account" ALTER COLUMN "type" TYPE "AccountType_new" USING ("type"::text::"AccountType_new");
ALTER TYPE "AccountType" RENAME TO "AccountType_old";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";
DROP TYPE "public"."AccountType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "TradeResult" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "balance",
ADD COLUMN     "currentEquity" INTEGER NOT NULL,
ALTER COLUMN "currency" DROP DEFAULT;
