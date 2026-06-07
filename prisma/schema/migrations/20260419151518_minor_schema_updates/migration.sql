/*
  Warnings:

  - The values [FEE,SWAP] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `contractSize` on the `Symbol` table. All the data in the column will be lost.
  - You are about to drop the column `digits` on the `Symbol` table. All the data in the column will be lost.
  - You are about to drop the column `pipValue` on the `Symbol` table. All the data in the column will be lost.
  - You are about to drop the column `tickSize` on the `Symbol` table. All the data in the column will be lost.
  - You are about to drop the column `entryPrice` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `exitPrice` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `lotSize` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `stopLoss` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `takeProfit` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `tradeStyle` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the `TradeImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExecutionSetup" AS ENUM ('IDM', 'SNR', 'FVG', 'MarketEntry');

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRADE_PNL', 'ADJUSTMENT');
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "TradeImage" DROP CONSTRAINT "TradeImage_tradeId_fkey";

-- AlterTable
ALTER TABLE "Account" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Symbol" DROP COLUMN "contractSize",
DROP COLUMN "digits",
DROP COLUMN "pipValue",
DROP COLUMN "tickSize";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "entryPrice",
DROP COLUMN "exitPrice",
DROP COLUMN "lotSize",
DROP COLUMN "stopLoss",
DROP COLUMN "takeProfit",
DROP COLUMN "tradeStyle",
ADD COLUMN     "execution" "ExecutionSetup"[],
ALTER COLUMN "commission" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "TradeImage";

-- DropEnum
DROP TYPE "TradeStyle";
