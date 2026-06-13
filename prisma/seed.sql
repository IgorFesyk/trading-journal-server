-- ============================================================
-- Trading Journal — Seed Data
-- Run against an empty database after migrations have been applied.
-- All user passwords are "Password123!"
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
    ('EUR/USD', 'FOREX'),
    ('GBP/USD', 'FOREX'),
    ('GER40',   'INDICES');

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES
    ('Admin User', 'admin@tradingjournal.dev', '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'ADMIN', NOW(), NOW()),
    ('Bob Carter', 'bob@tradingjournal.dev',   '$2b$12$MhRwSY6DbOlU/EADnpuyrONZSfJ5.f3zgYMwzCuVc/OpztbPDO5vW', 'USER',  NOW(), NOW());

-- -------------------------------------------------------
-- ACCOUNTS  (3 per user)
-- starting_equity and target_equity are stored in cents.
-- e.g. 5000000 = $50,000.00
-- -------------------------------------------------------
INSERT INTO accounts (user_id, name, type, currency, starting_equity, target_equity, created_at, updated_at) VALUES
    ((SELECT id FROM users WHERE email = 'admin@tradingjournal.dev'), 'Capital Account', 'CAPITAL', 'USD',  5000000,  7500000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'admin@tradingjournal.dev'), 'Prop Challenge',  'PROP',    'EUR', 10000000, 11000000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'admin@tradingjournal.dev'), 'Demo Account',    'CAPITAL', 'USD', 10000000, 12000000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'bob@tradingjournal.dev'),   'Trading Account', 'CAPITAL', 'USD',  2500000,  5000000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'bob@tradingjournal.dev'),   'Prop Firm',       'PROP',    'GBP',  5000000,  5500000, NOW(), NOW()),
    ((SELECT id FROM users WHERE email = 'bob@tradingjournal.dev'),   'Swing Account',   'CAPITAL', 'EUR',  1000000,  2000000, NOW(), NOW());

-- ============================================================
-- TRADES
--
-- Status distribution (same pattern for every account):
--   Rows where trade_number % 9 is 1,2,4,5,7  → WIN  (5 out of every 9)
--   Rows where trade_number % 9 is 3,6,8       → LOSE (3 out of every 9)
--   Rows where trade_number % 9 = 0            → BE   (1 out of every 9)
--   Last few rows (the highest numbers)         → IN_PROGRESS (no pnl, no closed_at)
--
-- For a 50-trade account: rows 1-45 are closed (25W 15L 5BE), rows 46-50 are IN_PROGRESS.
-- For a 25-trade account: rows 1-23 are closed (approx 12W 8L 3BE), rows 24-25 are IN_PROGRESS.
-- For a 10-trade account: rows 1-9  are closed (5W 3L 1BE),         row  10    is IN_PROGRESS.
--
-- Opened dates are spread evenly across the account's date window:
--   NOW() - (window_days - (i-1) * window_days/total) days
--   i=1 lands at the start of the window (oldest), i=total at the end (newest).
-- ============================================================

-- -------------------------------------------------------
-- Admin · Capital Account — 50 trades spread over 90 days
-- -------------------------------------------------------
WITH
    -- Resolve the account we want to populate to a single id.
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Capital Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    ),

    -- Produce 50 integers (1 … 50); each becomes one trade row.
    -- CROSS JOIN with target_account attaches the account id to every number.
    -- We also pre-compute opened_at here so closed_at can reference it directly.
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            -- Spread evenly: trade 1 opens 90 days ago, trade 50 opens ~1-2 days ago.
            NOW() - CAST(90.0 - (trade_number.i - 1) * 90.0 / 50.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 50) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,

    -- Cycle through 3 symbols: 1=EUR/USD, 2=GBP/USD, 3=GER40
    ((i - 1) % 3) + 1  AS symbol_id,

    -- pnl in cents (100 = $1.00). NULL while a trade is still open.
    CASE
        WHEN i > 45                          THEN NULL   -- IN_PROGRESS
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000   -- WIN: $80–$270
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)  -- LOSE: -$40 to -$150
        ELSE                                      0                             -- BE
    END  AS pnl,

    -- Risk amount. Cycles between 100 and 190.
    (10 + i % 10) * 10  AS risk,

    -- Commission. NULL while open; otherwise $40–$90 in cents.
    CASE
        WHEN i > 45  THEN NULL
        ELSE              400 + (i % 10) * 50
    END  AS commission,

    -- Status enum
    CASE
        WHEN i > 45                          THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS"  AS status,

    -- Alternate LONG / SHORT every row
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION"  AS direction,

    -- Cycle through 4 timeframes
    CASE i % 4
        WHEN 1 THEN 'H1'
        WHEN 2 THEN 'H4'
        WHEN 3 THEN 'D1'
        ELSE        'M15'
    END::"TIMEFRAME"  AS entry_tf,

    -- Cycle through 4 setups
    CASE i % 4
        WHEN 1 THEN 'FVG'
        WHEN 2 THEN 'SNR'
        WHEN 3 THEN 'IDM'
        ELSE        'MarketEntry'
    END::"EXECUTION_SETUP"  AS setup,

    NULL  AS notes,

    opened_at,

    -- closed_at: NULL for open trades; otherwise opened_at + a duration
    -- that matches the timeframe (M15 = short hold, D1 = long hold).
    CASE
        WHEN i > 45    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'   -- M15
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'   -- H1
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'  -- H4
        ELSE                opened_at + INTERVAL '36 hours'   -- D1
    END  AS closed_at,

    NOW(),
    NOW()

FROM trade_rows;

-- -------------------------------------------------------
-- Admin · Prop Challenge — 25 trades spread over 60 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Challenge'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(60.0 - (trade_number.i - 1) * 60.0 / 25.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 25) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 23                          THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 23 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 23                          THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'H1' WHEN 2 THEN 'H4' WHEN 3 THEN 'D1' ELSE 'M15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'FVG' WHEN 2 THEN 'SNR' WHEN 3 THEN 'IDM' ELSE 'MarketEntry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 23    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- -------------------------------------------------------
-- Admin · Demo Account — 10 trades spread over 30 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Demo Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(30.0 - (trade_number.i - 1) * 30.0 / 10.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 10) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 9                           THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 9 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 9                           THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'H1' WHEN 2 THEN 'H4' WHEN 3 THEN 'D1' ELSE 'M15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'FVG' WHEN 2 THEN 'SNR' WHEN 3 THEN 'IDM' ELSE 'MarketEntry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 9     THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- -------------------------------------------------------
-- Bob · Trading Account — 50 trades spread over 90 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Trading Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(90.0 - (trade_number.i - 1) * 90.0 / 50.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 50) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 45                          THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 45 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 45                          THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'H1' WHEN 2 THEN 'H4' WHEN 3 THEN 'D1' ELSE 'M15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'FVG' WHEN 2 THEN 'SNR' WHEN 3 THEN 'IDM' ELSE 'MarketEntry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 45    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- -------------------------------------------------------
-- Bob · Prop Firm — 25 trades spread over 60 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Firm'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(60.0 - (trade_number.i - 1) * 60.0 / 25.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 25) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 23                          THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 23 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 23                          THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'H1' WHEN 2 THEN 'H4' WHEN 3 THEN 'D1' ELSE 'M15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'FVG' WHEN 2 THEN 'SNR' WHEN 3 THEN 'IDM' ELSE 'MarketEntry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 23    THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- -------------------------------------------------------
-- Bob · Swing Account — 10 trades spread over 30 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Swing Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    ),
    trade_rows AS (
        SELECT
            target_account.id AS account_id,
            trade_number.i    AS i,
            NOW() - CAST(30.0 - (trade_number.i - 1) * 30.0 / 10.0 AS INTEGER) * INTERVAL '1 day'
                AS opened_at
        FROM  target_account
        CROSS JOIN generate_series(1, 10) AS trade_number(i)
    )

INSERT INTO trades (account_id, symbol_id, pnl, risk, commission, status, direction, entry_tf, setup, notes, opened_at, closed_at, created_at, updated_at)
SELECT
    account_id,
    ((i - 1) % 3) + 1,
    CASE
        WHEN i > 9                           THEN NULL
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN (8 + (i * 7 % 20)) * 1000
        WHEN (i % 9) IN (3, 6, 8)            THEN -((4 + i * 5 % 12) * 1000)
        ELSE                                      0
    END,
    (10 + i % 10) * 10,
    CASE WHEN i > 9 THEN NULL ELSE 400 + (i % 10) * 50 END,
    CASE
        WHEN i > 9                           THEN 'IN_PROGRESS'
        WHEN (i % 9) IN (1, 2, 4, 5, 7)     THEN 'WIN'
        WHEN (i % 9) IN (3, 6, 8)            THEN 'LOSE'
        ELSE                                      'BE'
    END::"TRADE_STATUS",
    CASE WHEN i % 2 = 1 THEN 'LONG' ELSE 'SHORT' END::"DIRECTION",
    CASE i % 4 WHEN 1 THEN 'H1' WHEN 2 THEN 'H4' WHEN 3 THEN 'D1' ELSE 'M15' END::"TIMEFRAME",
    CASE i % 4 WHEN 1 THEN 'FVG' WHEN 2 THEN 'SNR' WHEN 3 THEN 'IDM' ELSE 'MarketEntry' END::"EXECUTION_SETUP",
    NULL,
    opened_at,
    CASE
        WHEN i > 9     THEN NULL
        WHEN i % 4 = 0 THEN opened_at + INTERVAL '2 hours'
        WHEN i % 4 = 1 THEN opened_at + INTERVAL '4 hours'
        WHEN i % 4 = 2 THEN opened_at + INTERVAL '12 hours'
        ELSE                opened_at + INTERVAL '36 hours'
    END,
    NOW(), NOW()
FROM trade_rows;

-- ============================================================
-- TRANSACTIONS
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
-- Admin · Capital Account — 30 transactions over 90 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Capital Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,

    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
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

    -- Spread evenly: tx 1 = 90 days ago, tx 30 = today.
    NOW() - CAST(90.0 * (30 - tx_number.i) / 29.0 AS INTEGER) * INTERVAL '1 day'  AS occurred_at,

    NOW(), NOW()

FROM target_account
CROSS JOIN generate_series(1, 30) AS tx_number(i);

-- -------------------------------------------------------
-- Admin · Prop Challenge — 7 transactions over 60 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Challenge'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    NOW() - CAST(60.0 * (7 - tx_number.i) / 6.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 7) AS tx_number(i);

-- -------------------------------------------------------
-- Admin · Demo Account — 3 transactions over 30 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Demo Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'admin@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    -- Only 3 rows: tx 1 = 30 days ago, tx 2 = 15 days ago, tx 3 = today.
    NOW() - CAST(30.0 * (3 - tx_number.i) / 2.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 3) AS tx_number(i);

-- -------------------------------------------------------
-- Bob · Trading Account — 30 transactions over 90 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Trading Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    NOW() - CAST(90.0 * (30 - tx_number.i) / 29.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 30) AS tx_number(i);

-- -------------------------------------------------------
-- Bob · Prop Firm — 7 transactions over 60 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Prop Firm'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    NOW() - CAST(60.0 * (7 - tx_number.i) / 6.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 7) AS tx_number(i);

-- -------------------------------------------------------
-- Bob · Swing Account — 3 transactions over 30 days
-- -------------------------------------------------------
WITH
    target_account AS (
        SELECT id
        FROM   accounts
        WHERE  name    = 'Swing Account'
          AND  user_id = (SELECT id FROM users WHERE email = 'bob@tradingjournal.dev')
    )

INSERT INTO transactions (account_id, type, amount, note, occurred_at, created_at, updated_at)
SELECT
    target_account.id,
    CASE tx_number.i % 5
        WHEN 1 THEN 'DEPOSIT'
        WHEN 2 THEN 'DEPOSIT'
        WHEN 3 THEN 'WITHDRAWAL'
        WHEN 4 THEN 'ADJUSTMENT'
        ELSE        'WITHDRAWAL'
    END::"TRANSACTION_TYPE",
    CASE tx_number.i % 5
        WHEN 1 THEN  (2 + tx_number.i % 8) * 100000
        WHEN 2 THEN  (1 + tx_number.i % 5) * 100000
        WHEN 3 THEN -(2 + tx_number.i % 4) * 100000
        WHEN 4 THEN -((tx_number.i % 5) + 1) * 15000
        ELSE        -(1 + tx_number.i % 3) * 100000
    END,
    NULL,
    NOW() - CAST(30.0 * (3 - tx_number.i) / 2.0 AS INTEGER) * INTERVAL '1 day',
    NOW(), NOW()
FROM target_account
CROSS JOIN generate_series(1, 3) AS tx_number(i);

COMMIT;
