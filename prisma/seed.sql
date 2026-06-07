-- ============================================================
-- Trading Journal — Mock Seed Data
-- Run against an empty database after migrations have been applied.
-- All user passwords are "Password123!"
-- ============================================================

BEGIN;

-- -------------------------------------------------------
-- SYMBOLS
-- -------------------------------------------------------
INSERT INTO "Symbol" ("name", "category") VALUES
  ('EUR', 'FOREX'),
  ('USD', 'FOREX'),
  ('GBP', 'FOREX');

-- -------------------------------------------------------
-- USERS
-- id 1 = Admin  |  id 2 = Alice  |  id 3 = Bob
-- -------------------------------------------------------
INSERT INTO "User" ("name", "email", "password", "role", "createdAt", "updatedAt") VALUES
  ('Admin User',   'admin@tradingjournal.dev', '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'ADMIN', NOW(), NOW()),
  ('Alice Morgan', 'alice@tradingjournal.dev', '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'USER',  NOW(), NOW()),
  ('Bob Carter',   'bob@tradingjournal.dev',   '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'USER',  NOW(), NOW());

-- -------------------------------------------------------
-- ACCOUNTS (2 per user = 6 total)
-- Equity stored in cents: $50,000 = 5,000,000
-- Admin:  id 1-2  |  Alice: id 3-4  |  Bob: id 5-6
-- -------------------------------------------------------
INSERT INTO "Account" ("userId", "name", "type", "currency", "startingEquity", "targetEquity", "createdAt", "updatedAt") VALUES
  (1, 'Capital Account', 'CAPITAL', 'USD', 5000000,  7500000,  NOW(), NOW()),  -- $50,000 → $75,000
  (1, 'Prop Challenge',  'PROP',    'EUR', 10000000, 11000000, NOW(), NOW()),  -- $100,000 → $110,000
  (2, 'Main Account',    'CAPITAL', 'USD', 2500000,  5000000,  NOW(), NOW()),  -- $25,000 → $50,000
  (2, 'Prop Account',    'PROP',    'GBP', 5000000,  5500000,  NOW(), NOW()),  -- $50,000 → $55,000
  (3, 'Trading Account', 'CAPITAL', 'EUR', 1000000,  2000000,  NOW(), NOW()),  -- $10,000 → $20,000
  (3, 'Prop Firm',       'PROP',    'USD', 2500000,  2750000,  NOW(), NOW());  -- $25,000 → $27,500

-- -------------------------------------------------------
-- TRADES (5 per account = 30 total)
-- symbolId: 1=EUR  2=USD  3=GBP
-- pnl / commission in cents  ($350.00 = 35000)
-- risk in pips               (1.50% = 150)
-- -------------------------------------------------------

-- Account 1 — Admin, Capital Account
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (1, 1,  35000, 150, 750,  'WIN',         'LONG',  'H1',  'FVG',         'Clean impulse, textbook FVG fill',     NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '4 hours',   NOW(), NOW()),
  (1, 2, -18000, 120, 600,  'LOSE',        'SHORT', 'H4',  'SNR',         'S&R flip failed, stopped out',         NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days' + INTERVAL '2 hours',   NOW(), NOW()),
  (1, 3,  12000, 100, 500,  'WIN',         'LONG',  'H1',  'IDM',         NULL,                                   NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '6 hours',   NOW(), NOW()),
  (1, 1,      0, 180, 700,  'BE',          'SHORT', 'D1',  'MarketEntry', 'Moved SL to BE before reversal',       NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days' + INTERVAL '24 hours',  NOW(), NOW()),
  (1, 2,   NULL, 200, NULL, 'IN_PROGRESS', 'LONG',  'M15', 'FVG',         'Watching for M15 displacement',        NOW() - INTERVAL '1 day',  NULL,                                              NOW(), NOW());

-- Account 2 — Admin, Prop Challenge
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (2, 3,  48000, 160, 800,  'WIN',         'LONG',  'H4',  'SNR',         'Break and retest with volume confirmation', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days' + INTERVAL '8 hours',   NOW(), NOW()),
  (2, 1, -22000, 140, 700,  'LOSE',        'SHORT', 'H1',  'FVG',         'FVG too close to HTF resistance',           NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days' + INTERVAL '3 hours',   NOW(), NOW()),
  (2, 2,  18000, 120, 600,  'WIN',         'LONG',  'D1',  'IDM',         NULL,                                        NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '48 hours',  NOW(), NOW()),
  (2, 3,  -9000, 110, 550,  'LOSE',        'SHORT', 'M15', 'MarketEntry', 'Fakeout on news release',                   NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days' + INTERVAL '30 minutes', NOW(), NOW()),
  (2, 1,   NULL, 190, NULL, 'IN_PROGRESS', 'LONG',  'H1',  'SNR',         'HTF demand zone, waiting for entry',        NOW() - INTERVAL '2 days',  NULL,                                              NOW(), NOW());

-- Account 3 — Alice, Main Account
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (3, 2,  27000, 130, 650,  'WIN',         'LONG',  'H1',  'FVG',         'Perfect entry on FVG retest',           NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days' + INTERVAL '5 hours',   NOW(), NOW()),
  (3, 1, -14000, 115, 580,  'LOSE',        'LONG',  'H4',  'SNR',         'SNR level rejected, stop hit',          NOW() - INTERVAL '23 days', NOW() - INTERVAL '23 days' + INTERVAL '1 hour',    NOW(), NOW()),
  (3, 3,  31000, 175, 875,  'WIN',         'SHORT', 'D1',  'IDM',         NULL,                                    NOW() - INTERVAL '17 days', NOW() - INTERVAL '17 days' + INTERVAL '72 hours',  NOW(), NOW()),
  (3, 2,      0, 140, 700,  'BE',          'LONG',  'H1',  'FVG',         'Protected capital, moved to BE',        NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '6 hours',   NOW(), NOW()),
  (3, 1,   NULL, 160, NULL, 'IN_PROGRESS', 'SHORT', 'M15', 'MarketEntry', 'Bearish OB on M15, managing trade',     NOW() - INTERVAL '3 days',  NULL,                                              NOW(), NOW());

-- Account 4 — Alice, Prop Account
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (4, 3,  55000, 200, 1000, 'WIN',         'LONG',  'W1',  'SNR',         'Weekly S&R confluence, 2.5R winner',      NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days' + INTERVAL '5 days',     NOW(), NOW()),
  (4, 1, -26000, 170, 850,  'LOSE',        'SHORT', 'H4',  'FVG',         'Counter-trend trade, lesson learned',     NOW() - INTERVAL '26 days', NOW() - INTERVAL '26 days' + INTERVAL '4 hours',    NOW(), NOW()),
  (4, 2,  19000, 125, 625,  'WIN',         'LONG',  'H1',  'IDM',         NULL,                                      NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days' + INTERVAL '7 hours',    NOW(), NOW()),
  (4, 3,  -8500, 105, 525,  'LOSE',        'SHORT', 'M15', 'MarketEntry', 'Premature entry, needed better fill',    NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days' + INTERVAL '45 minutes',  NOW(), NOW()),
  (4, 1,   NULL, 180, NULL, 'IN_PROGRESS', 'LONG',  'H4',  'FVG',         'H4 FVG holding, partial TP taken',       NOW() - INTERVAL '4 days',  NULL,                                               NOW(), NOW());

-- Account 5 — Bob, Trading Account
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (5, 1,  21000, 145, 725,  'WIN',         'SHORT', 'H1',  'SNR',         'Supply zone reaction confirmed',         NOW() - INTERVAL '31 days', NOW() - INTERVAL '31 days' + INTERVAL '3 hours',   NOW(), NOW()),
  (5, 2, -16000, 135, 675,  'LOSE',        'LONG',  'H4',  'IDM',         'IDM failed on weak structure',           NOW() - INTERVAL '24 days', NOW() - INTERVAL '24 days' + INTERVAL '2 hours',   NOW(), NOW()),
  (5, 3,  38000, 185, 925,  'WIN',         'LONG',  'D1',  'FVG',         NULL,                                     NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days' + INTERVAL '48 hours',  NOW(), NOW()),
  (5, 1,      0, 130, 650,  'BE',          'SHORT', 'H1',  'MarketEntry', 'Secured BE on volatility spike',         NOW() - INTERVAL '9 days',  NOW() - INTERVAL '9 days'  + INTERVAL '5 hours',   NOW(), NOW()),
  (5, 2,   NULL, 155, NULL, 'IN_PROGRESS', 'LONG',  'H1',  'SNR',         'Accumulation phase, scaling in',         NOW() - INTERVAL '2 days',  NULL,                                              NOW(), NOW());

-- Account 6 — Bob, Prop Firm
INSERT INTO "Trade" ("accountId", "symbolId", "pnl", "risk", "commission", "status", "direction", "entryTF", "setup", "notes", "openedAt", "closedAt", "createdAt", "updatedAt") VALUES
  (6, 2,  44000, 195, 975,  'WIN',         'LONG',  'H4',  'FVG',         'Institutional FVG, high conviction',   NOW() - INTERVAL '33 days', NOW() - INTERVAL '33 days' + INTERVAL '6 hours',   NOW(), NOW()),
  (6, 3, -20000, 150, 750,  'LOSE',        'SHORT', 'H1',  'SNR',         'News spike invalidated setup',          NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days' + INTERVAL '1 hour',    NOW(), NOW()),
  (6, 1,  15000, 110, 550,  'WIN',         'LONG',  'D1',  'IDM',         NULL,                                    NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days' + INTERVAL '24 hours',  NOW(), NOW()),
  (6, 2, -11000, 125, 625,  'LOSE',        'SHORT', 'M15', 'MarketEntry', 'Entered too early on M15 signal',      NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days' + INTERVAL '20 minutes', NOW(), NOW()),
  (6, 3,   NULL, 170, NULL, 'IN_PROGRESS', 'LONG',  'H1',  'FVG',         'Holding overnight, SL moved to entry', NOW() - INTERVAL '1 day',   NULL,                                              NOW(), NOW());

-- -------------------------------------------------------
-- TRANSACTIONS (2 per account = 12 total)
-- amount in cents  ($50,000 = 5,000,000)
-- -------------------------------------------------------
INSERT INTO "Transaction" ("accountId", "type", "amount", "note", "occurredAt", "createdAt", "updatedAt") VALUES
  -- Account 1 — Admin, Capital Account
  (1, 'DEPOSIT',    5000000,  'Initial capital deposit',           NOW() - INTERVAL '60 days', NOW(), NOW()),
  (1, 'ADJUSTMENT', -50000,   'Broker fee adjustment',             NOW() - INTERVAL '15 days', NOW(), NOW()),
  -- Account 2 — Admin, Prop Challenge
  (2, 'DEPOSIT',    10000000, 'Prop firm funded account',          NOW() - INTERVAL '60 days', NOW(), NOW()),
  (2, 'WITHDRAWAL', 200000,   'Profit withdrawal after phase',     NOW() - INTERVAL '10 days', NOW(), NOW()),
  -- Account 3 — Alice, Main Account
  (3, 'DEPOSIT',    2500000,  'Initial capital deposit',           NOW() - INTERVAL '55 days', NOW(), NOW()),
  (3, 'DEPOSIT',    500000,   'Top-up deposit',                    NOW() - INTERVAL '20 days', NOW(), NOW()),
  -- Account 4 — Alice, Prop Account
  (4, 'DEPOSIT',    5000000,  'Prop challenge funded',             NOW() - INTERVAL '50 days', NOW(), NOW()),
  (4, 'ADJUSTMENT', -75000,   'Platform subscription fee',         NOW() - INTERVAL '5 days',  NOW(), NOW()),
  -- Account 5 — Bob, Trading Account
  (5, 'DEPOSIT',    1000000,  'Starting capital',                  NOW() - INTERVAL '45 days', NOW(), NOW()),
  (5, 'WITHDRAWAL', 200000,   'Partial profit withdrawal',         NOW() - INTERVAL '7 days',  NOW(), NOW()),
  -- Account 6 — Bob, Prop Firm
  (6, 'DEPOSIT',    2500000,  'Prop firm account funded',          NOW() - INTERVAL '45 days', NOW(), NOW()),
  (6, 'ADJUSTMENT', 100000,   'Drawdown correction credit',        NOW() - INTERVAL '3 days',  NOW(), NOW());

COMMIT;
