-- ============================================================
-- Trading Journal — Truncate All Tables
-- Resets all data and restarts identity sequences.
-- ============================================================

TRUNCATE TABLE
  "Transaction",
  "Trade",
  "Token",
  "Account",
  "User",
  "Symbol"
RESTART IDENTITY CASCADE;
