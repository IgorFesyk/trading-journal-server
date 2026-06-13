-- ============================================================
-- Trading Journal — Truncate All Tables
-- Resets all data and restarts identity sequences.
-- ============================================================

TRUNCATE TABLE
  transactions,
  trades,
  tokens,
  accounts,
  users,
  symbols
RESTART IDENTITY CASCADE;
