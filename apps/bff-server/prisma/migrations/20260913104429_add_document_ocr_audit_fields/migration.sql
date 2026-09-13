-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "ocrError" TEXT,
ADD COLUMN     "processingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "processingStartedAt" TIMESTAMP(3),
ADD COLUMN     "transactionId" TEXT;
