-- Phase 4: Add composite index on (userId, transactionDate) for the Transaction table.
-- This is the exact pair of columns that listTransactions, healthScore,
-- budgetVariance, and exportReport all filter/sort by, so this index will be
-- hit by the most read-heavy queries in the application.
-- Run: npx prisma migrate deploy  (in CI / production)
--      npx prisma migrate dev     (in local dev with an interactive terminal)

CREATE INDEX IF NOT EXISTS "transactions_userId_transactionDate_idx"
    ON "transactions" ("userId", "transactionDate");
