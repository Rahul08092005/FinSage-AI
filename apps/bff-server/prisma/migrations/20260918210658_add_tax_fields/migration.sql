-- Phase 5: add taxRegime and annualIncome to the users table.
-- Both columns are nullable (no backfill needed for existing rows).
-- taxRegime values are enforced at the API layer ('old' | 'new') not here.
ALTER TABLE "users" ADD COLUMN "taxRegime" TEXT;
ALTER TABLE "users" ADD COLUMN "annualIncome" DECIMAL(65,30);
