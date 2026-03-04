-- Run this script if the EF migration could not be applied (e.g. while API was running).
-- Adds FeePaymentStartMonth column and records the migration in EF history.

ALTER TABLE "StudentEnrollments" ADD COLUMN IF NOT EXISTS "FeePaymentStartMonth" integer NULL;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260303150000_AddFeePaymentStartMonth', '10.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
