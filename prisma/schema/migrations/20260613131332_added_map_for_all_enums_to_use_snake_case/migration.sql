/*
  Warnings:

  - The values [CAPITAL,PROP] on the enum `ACCOUNT_TYPE` will be removed. If these variants are still used in the database, this will fail.
  - The values [FOREX,CRYPTO,STOCKS,INDICES] on the enum `CATEGORY` will be removed. If these variants are still used in the database, this will fail.
  - The values [USD,EUR,GBP] on the enum `CURRENCY` will be removed. If these variants are still used in the database, this will fail.
  - The values [LONG,SHORT] on the enum `DIRECTION` will be removed. If these variants are still used in the database, this will fail.
  - The values [IDM,SNR,FVG,MarketEntry] on the enum `EXECUTION_SETUP` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,USER] on the enum `ROLE` will be removed. If these variants are still used in the database, this will fail.
  - The values [M15,H1,H4,D1,W1] on the enum `TIMEFRAME` will be removed. If these variants are still used in the database, this will fail.
  - The values [WIN,LOSE,BE,IN_PROGRESS] on the enum `TRADE_STATUS` will be removed. If these variants are still used in the database, this will fail.
  - The values [DEPOSIT,WITHDRAWAL,ADJUSTMENT] on the enum `TRANSACTION_TYPE` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ACCOUNT_TYPE_new" AS ENUM ('capital', 'prop');
ALTER TABLE "accounts" ALTER COLUMN "type" TYPE "ACCOUNT_TYPE_new" USING ("type"::text::"ACCOUNT_TYPE_new");
ALTER TYPE "ACCOUNT_TYPE" RENAME TO "ACCOUNT_TYPE_old";
ALTER TYPE "ACCOUNT_TYPE_new" RENAME TO "ACCOUNT_TYPE";
DROP TYPE "public"."ACCOUNT_TYPE_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CATEGORY_new" AS ENUM ('forex', 'crypto', 'stocks', 'indices');
ALTER TABLE "symbols" ALTER COLUMN "category" TYPE "CATEGORY_new" USING ("category"::text::"CATEGORY_new");
ALTER TYPE "CATEGORY" RENAME TO "CATEGORY_old";
ALTER TYPE "CATEGORY_new" RENAME TO "CATEGORY";
DROP TYPE "public"."CATEGORY_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "CURRENCY_new" AS ENUM ('usd', 'eur', 'gbp');
ALTER TABLE "accounts" ALTER COLUMN "currency" TYPE "CURRENCY_new" USING ("currency"::text::"CURRENCY_new");
ALTER TYPE "CURRENCY" RENAME TO "CURRENCY_old";
ALTER TYPE "CURRENCY_new" RENAME TO "CURRENCY";
DROP TYPE "public"."CURRENCY_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DIRECTION_new" AS ENUM ('long', 'short');
ALTER TABLE "trades" ALTER COLUMN "direction" TYPE "DIRECTION_new" USING ("direction"::text::"DIRECTION_new");
ALTER TYPE "DIRECTION" RENAME TO "DIRECTION_old";
ALTER TYPE "DIRECTION_new" RENAME TO "DIRECTION";
DROP TYPE "public"."DIRECTION_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EXECUTION_SETUP_new" AS ENUM ('idm', 'snr', 'fvg', 'market-entry');
ALTER TABLE "trades" ALTER COLUMN "setup" TYPE "EXECUTION_SETUP_new" USING ("setup"::text::"EXECUTION_SETUP_new");
ALTER TYPE "EXECUTION_SETUP" RENAME TO "EXECUTION_SETUP_old";
ALTER TYPE "EXECUTION_SETUP_new" RENAME TO "EXECUTION_SETUP";
DROP TYPE "public"."EXECUTION_SETUP_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ROLE_new" AS ENUM ('admin', 'user');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "ROLE_new" USING ("role"::text::"ROLE_new");
ALTER TYPE "ROLE" RENAME TO "ROLE_old";
ALTER TYPE "ROLE_new" RENAME TO "ROLE";
DROP TYPE "public"."ROLE_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TIMEFRAME_new" AS ENUM ('m15', 'h1', 'h4', 'd1', 'w1');
ALTER TABLE "trades" ALTER COLUMN "entry_tf" TYPE "TIMEFRAME_new" USING ("entry_tf"::text::"TIMEFRAME_new");
ALTER TYPE "TIMEFRAME" RENAME TO "TIMEFRAME_old";
ALTER TYPE "TIMEFRAME_new" RENAME TO "TIMEFRAME";
DROP TYPE "public"."TIMEFRAME_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TRADE_STATUS_new" AS ENUM ('win', 'lose', 'be', 'in-progress');
ALTER TABLE "trades" ALTER COLUMN "status" TYPE "TRADE_STATUS_new" USING ("status"::text::"TRADE_STATUS_new");
ALTER TYPE "TRADE_STATUS" RENAME TO "TRADE_STATUS_old";
ALTER TYPE "TRADE_STATUS_new" RENAME TO "TRADE_STATUS";
DROP TYPE "public"."TRADE_STATUS_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TRANSACTION_TYPE_new" AS ENUM ('deposit', 'withdrawal', 'adjustment');
ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "TRANSACTION_TYPE_new" USING ("type"::text::"TRANSACTION_TYPE_new");
ALTER TYPE "TRANSACTION_TYPE" RENAME TO "TRANSACTION_TYPE_old";
ALTER TYPE "TRANSACTION_TYPE_new" RENAME TO "TRANSACTION_TYPE";
DROP TYPE "public"."TRANSACTION_TYPE_old";
COMMIT;

-- DropIndex
DROP INDEX "accounts_user_id_idx";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user';

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_key" ON "accounts"("name");

-- CreateIndex
CREATE INDEX "trades_account_id_closed_at_idx" ON "trades"("account_id", "closed_at");

-- CreateIndex
CREATE INDEX "transactions_account_id_type_idx" ON "transactions"("account_id", "type");
