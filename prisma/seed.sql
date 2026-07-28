-- ============================================================
-- Trading Journal — Seed Data
-- Run against an empty database after migrations have been applied.
-- All user passwords are "Password123!"
--
-- Users:
--   admin@tradingjournal.dev — role admin — 1 account, no trades/transactions
--   user@tradingjournal.dev  — role user  — 2 accounts (capital + prop),
--                                            each with several trades and transactions
--
-- HOW THIS SCRIPT WORKS
-- ---------------------
-- Instead of writing every row by hand, each INSERT uses two tricks:
--
--   1. generate_series(1, N) — produces a table of integers from 1 to N.
--      Each integer becomes one row in the result (one trade, one
--      transaction, etc.).
--
--   2. CROSS JOIN — combines every row from one table with every row
--      from another. Here we cross-join the single account row with
--      the series of numbers, so we get exactly N rows, each carrying
--      the account's id alongside the current number.
--
-- Inside SELECT, CASE expressions use the modulo operator (%) to spread
-- values evenly across rows:
--   trade_number % 9  cycles 0-8, which we map to WIN/LOSE/BE groups.
--   trade_number % 3  cycles symbols across EUR/USD, GBP/USD, GER40.
--
-- A WITH ... AS (...) block (called a CTE) lets us name intermediate
-- results so the final INSERT SELECT is easier to read and we can
-- reference a computed column (e.g. opened_at) without repeating the
-- formula.
--
-- Symbol IDs (assigned by the INSERT below):
--   1 = EUR/USD   2 = GBP/USD   3 = GER40
-- ============================================================

BEGIN;

-- -------------------------------------------------------
-- SYMBOLS
-- -------------------------------------------------------
INSERT INTO symbols (name, category) VALUES
    ('EUR/USD', 'forex'),
    ('GBP/USD', 'forex'),
    ('GER40',   'indices');

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES
    ('Admin User',   'admin@tradingjournal.dev', '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'admin', NOW(), NOW()),
    ('Regular User', 'user@tradingjournal.dev',  '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'user',  NOW(), NOW());

-- -------------------------------------------------------
-- ACCOUNTS
-- starting_equity and target_equity are stored in cents.
-- e.g. 5000000 = $50,000.00
-- Account names must be unique per user (see accounts @@unique([userId, name])).
--
--   Admin · Capital Account — empty, no trades/transactions
--   User  · Capital Account — capital, usd
--   User  · Prop Challenge  — prop, eur
-- -------------------------------------------------------
INSERT INTO accounts (user_id, name, type, currency, starting_equity, target_equity, created_at, updated_at) VALUES
    ((SELECT id FROM users WHERE email = 'admin@tradingjournal.dev'), 'Capital Account', 'capital', 'usd', 10000000, 12000000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'user@tradingjournal.dev'),  'Capital Account', 'capital', 'usd',  5000000,  7500000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'user@tradingjournal.dev'),  'Prop Challenge',  'prop',    'eur', 10000000, 11000000, NOW(), NOW());

-- ============================================================
-- TRADES
-- Admin's account is intentionally left empty.
--
-- Status distribution (same pattern for both of the user's accounts):
--   Rows where trade_number % 9 is 1,2,4,5,7  → WIN  (5 out of every 9)
--   Rows where trade_number % 9 is 3,6,8       → LOSE (3 out of every 9)
--   Rows where trade_number % 9 = 0            → BE   (1 out of every 9)
--   Last couple of rows (the highest numbers)   → IN_PROGRESS (no pnl, no closed_at)
--
-- For the 25-trade account: rows 1-23 are closed (~12W 8L 3BE), rows 24-25 are IN_PROGRESS.
-- For the 15-trade account: rows 1-13 are closed (~7W 4L 2BE),  rows 14-15 are IN_PROGRESS.
--
-- Opened dates are spread evenly across the account's date window:
--   NOW() - (window_days - (i-1) * window_days/total) days
--   i=1 lands at the start of the window (oldest), i=total at the end (newest).
-- ============================================================

-- -------------------------------------------------------
-- User · Capital Account — 25 trades spread over 60 days
-- -------------------------------------------------------
WITH
    -- Resolve the account we want to populate to a single id.
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Capital Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'user@tradingjournal.dev')
    ),

    -- Produce 25 integers (1 … 25); each becomes one trade row.
    -- CROSS JOIN with target_account attaches the account id to every number.
    -- We also pre-compute opened_at here so closed_at can reference it directly.
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            -- Spread evenly: trade 1 opens 60 days ago, trade 25 opens ~1-2 days ago.
            NOW() - CAST(60.0 - (trade_number.i - 1) * 60.0 / 25.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 25) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,

    -- Cycle through 3 symbols: 1=EUR/USD, 2=GBP/USD, 3=GER40
    ((i - 1) % 3) + 1  AS symbol_id,

    -- pnl in cents (100 = $1.00). NULL while a trade is still open.
    CASE
        WHEN i > 23                          THEN NULL   -- IN_PROGRESS
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000   -- WIN: $80–$270
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)  -- LOSE: -$40 to -$150
        ELSE                                      0                             -- BE
    END  AS pnl,

    -- Risk amount. Cycles between 100 and 190.
    (10 + i % 10) * 10  AS risk,

    -- Commission. NULL while open; otherwise $40–$90 in cents.
    CASE
        WHEN i > 23  THEN NULL
        ELSE              400 + (i % 10) * 50
    END  AS commission,

    -- Status enum
    CASE
        WHEN i > 23                          THEN 'in-progress'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'win'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'lose'
        ELSE                                      'be'
    END::"TRADE_STATUS"  AS status,

    -- Alternate LONG / SHORT every row
    CASE WHEN i % 2 = 1 THEN 'long' ELSE 'short' END::"DIRECTION"  AS direction,

    -- Cycle through 4 timeframes
    CASE i % 4
        WHEN 1 THEN 'h1'
        WHEN 2 THEN 'h4'
        WHEN 3 THEN 'd1'
        ELSE        'm15'
    END::"TIMEFRAME"  AS entry_tf,

    -- Cycle through 4 setups
    CASE i % 4
        WHEN 1 THEN 'fvg'
        WHEN 2 THEN 'snr'
        WHEN 3 THEN 'idm'
        ELSE        'market-entry'
    END::"EXECUTION_SETUP"  AS setup,

    NULL  AS notes,

    opened_at,

    -- closed_at: NULL for open trades; otherwise opened_at + a duration
    -- that matches the timeframe (M15 = short hold, D1 = long hold).
    CASE
        WHEN i > 23    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'   -- M15
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'   -- H1
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'  -- H4
        ELSE                opened_at + INTERVAL '36 hours'   -- D1
    END  AS closed_at,

    NOW(),
    NOW()

FROM trade_rows;

-- -------------------------------------------------------
-- User · Prop Challenge — 15 trades spread over 45 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Challenge'
          AND  user_id = (SELECT id FROM users WHERE email = 'user@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(45.0 - (trade_number.i - 1) * 45.0 / 15.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 15) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 13                          THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 13 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 13                          THEN 'in-progress'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'win'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'lose'
        ELSE                                      'be'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'long' ELSE 'short' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'h1' WHEN 2 THEN 'h4' WHEN 3 THEN 'd1' ELSE 'm15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'fvg' WHEN 2 THEN 'snr' WHEN 3 THEN 'idm' ELSE 'market-entry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 13    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- ============================================================
-- TRANSACTIONS
-- Admin's account is intentionally left empty.
--
-- Transaction types cycle in a repeating 5-step pattern:
--   tx_number % 5 = 1 → DEPOSIT
--   tx_number % 5 = 2 → DEPOSIT
--   tx_number % 5 = 3 → WITHDRAWAL
--   tx_number % 5 = 4 → ADJUSTMENT  (fees, swaps — always negative)
--   tx_number % 5 = 0 → WITHDRAWAL
--
-- Dates are spread evenly from the start of the account's date window
-- to today using the formula:
--   NOW() - (period_days * (total - i) / (total - 1)) days
--   tx 1 = oldest, tx N = most recent (today).
-- ============================================================

-- -------------------------------------------------------
-- User · Capital Account — 10 transactions over 60 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Capital Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'user@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,

    CASE tx_number.i % 5
        WHEN 1 THEN 'deposit'
        WHEN 2 THEN 'deposit'
        WHEN 3 THEN 'withdrawal'
        WHEN 4 THEN 'adjustment'
        ELSE        'withdrawal'
    END::"TRANSACTION_TYPE",

    -- Amounts in cents.  DEPOSIT: $2k–$9k.  WITHDRAWAL: $1k–$5k.  ADJUSTMENT: -$150 to -$750.
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END  AS amount,

    NULL  AS note,

    -- Spread evenly: tx 1 = 60 days ago, tx 10 = today.
    NOW() - CAST(60.0 * (10 - tx_number.i) / 9.0 AS INTEGER) * INTERVAL '1 day'  AS occurred_at,

    NOW(), NOW()

FROM target_account
CROSS JOIN generate_series(1, 10) AS tx_number(i);

-- -------------------------------------------------------
-- User · Prop Challenge — 6 transactions over 45 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Challenge'
          AND  user_id = (SELECT id FROM users WHERE email = 'user@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'deposit'
        WHEN 2 THEN 'deposit'
        WHEN 3 THEN 'withdrawal'
        WHEN 4 THEN 'adjustment'
        ELSE        'withdrawal'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    NOW() - CAST(45.0 * (6 - tx_number.i) / 5.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 6) AS tx_number(i);

COMMIT;
