-- AlterTable: Company - add contact & banking fields for invoices
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "iban" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "bic" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "googleReviewUrl" TEXT;

-- AlterTable: Customer - make lat/lng optional (geocoding fills them later)
ALTER TABLE "Customer" ALTER COLUMN "lat" DROP NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "lng" DROP NOT NULL;

-- AlterTable: Customer - add session token for portal
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "sessionToken" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "sessionTokenExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_sessionToken_key" ON "Customer"("sessionToken");

-- AlterTable: Job - add reminder and review tracking
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "recurrenceLastDate" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "reviewSentAt" TIMESTAMP(3);
