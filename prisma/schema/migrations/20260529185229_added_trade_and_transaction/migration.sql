/*
  Warnings:

  - You are about to drop the column `currentEquity` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `execution` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `Trade` table. All the data in the column will be lost.
  - You are about to drop the column `riskBps` on the `Trade` table. All the data in the column will be lost.
  - You are about to alter the column `commission` on the `Trade` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to drop the column `tradeId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Tag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_TagToTrade` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,name]` on the table `Account` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `currency` on the `Account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Symbol` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `risk` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `setup` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `direction` on the `Trade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entryTF` on the `Trade` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ACCOUNT_TYPE" AS ENUM ('CAPITAL', 'PROP');

-- CreateEnum
CREATE TYPE "CURRENCY" AS ENUM ('USD', 'EUR', 'GBP');

-- CreateEnum
CREATE TYPE "CATEGORY" AS ENUM ('FOREX', 'CRYPTO', 'STOCKS', 'INDICES');

-- CreateEnum
CREATE TYPE "TRADE_STATUS" AS ENUM ('WIN', 'LOSE', 'BE', 'IN_PROGRESS');

-- CreateEnum
CREATE TYPE "DIRECTION" AS ENUM ('LONG', 'SHORT');

-- CreateEnum
CREATE TYPE "TIMEFRAME" AS ENUM ('M15', 'H1', 'H4', 'D1', 'W1');

-- CreateEnum
CREATE TYPE "EXECUTION_SETUP" AS ENUM ('IDM', 'SNR', 'FVG', 'MarketEntry');

-- CreateEnum
CREATE TYPE "TRANSACTION_TYPE" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ADJUSTMENT');

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_tradeId_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTrade" DROP CONSTRAINT "_TagToTrade_A_fkey";

-- DropForeignKey
ALTER TABLE "_TagToTrade" DROP CONSTRAINT "_TagToTrade_B_fkey";

-- DropIndex
DROP INDEX "Trade_accountId_result_idx";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "currentEquity",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "ACCOUNT_TYPE" NOT NULL,
ALTER COLUMN "targetEquity" DROP NOT NULL,
DROP COLUMN "currency",
ADD COLUMN     "currency" "CURRENCY" NOT NULL;

-- AlterTable
ALTER TABLE "Symbol" DROP COLUMN "category",
ADD COLUMN     "category" "CATEGORY" NOT NULL;

-- AlterTable
ALTER TABLE "Token" ADD CONSTRAINT "Token_pkey" PRIMARY KEY ("userId");

-- DropIndex
DROP INDEX "Token_userId_key";

-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "execution",
DROP COLUMN "result",
DROP COLUMN "riskBps",
ADD COLUMN     "risk" INTEGER NOT NULL,
ADD COLUMN     "setup" "EXECUTION_SETUP" NOT NULL,
ADD COLUMN     "status" "TRADE_STATUS" NOT NULL,
ALTER COLUMN "pnl" DROP NOT NULL,
ALTER COLUMN "commission" DROP NOT NULL,
ALTER COLUMN "commission" SET DATA TYPE INTEGER,
DROP COLUMN "direction",
ADD COLUMN     "direction" "DIRECTION" NOT NULL,
DROP COLUMN "entryTF",
ADD COLUMN     "entryTF" "TIMEFRAME" NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "tradeId",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "type",
ADD COLUMN     "type" "TRANSACTION_TYPE" NOT NULL;

-- DropTable
DROP TABLE "Tag";

-- DropTable
DROP TABLE "_TagToTrade";

-- DropEnum
DROP TYPE "AccountType";

-- DropEnum
DROP TYPE "Category";

-- DropEnum
DROP TYPE "Currency";

-- DropEnum
DROP TYPE "Direction";

-- DropEnum
DROP TYPE "ExecutionSetup";

-- DropEnum
DROP TYPE "Timeframe";

-- DropEnum
DROP TYPE "TradeResult";

-- DropEnum
DROP TYPE "TransactionType";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_name_key" ON "Account"("userId", "name");

-- CreateIndex
CREATE INDEX "Trade_accountId_status_idx" ON "Trade"("accountId", "status");
