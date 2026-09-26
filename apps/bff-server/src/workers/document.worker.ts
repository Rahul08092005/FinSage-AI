// Background worker for document OCR processing
// Consumes the "document-processing-queue" Redis list and calls the AI engine.
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const QUEUE_KEY = "document-processing-queue";
const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";
const CONFIDENCE_THRESHOLD = 0.85;
const MAX_RETRIES = 3;

redis.on("error", (err) => {
  console.error("[worker][redis] connection error:", err.message);
});

export interface DocumentJob {
  documentId: string;
  filePath: string;
  docType: string;
  retryCount?: number;
}

export async function processJob(job: DocumentJob): Promise<void> {
  const { documentId, filePath, docType } = job;
  const retryCount = job.retryCount || 0;

  console.log(`[OCR] Processing started: documentId=${documentId} docType=${docType} attempt=${retryCount + 1}`);

  // 1. Mark PROCESSING in database with start timestamp
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) {
    console.warn(`[OCR] Document ${documentId} not found in database, skipping job`);
    return;
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "PROCESSING",
      processingStartedAt: new Date(),
      ocrError: null,
    },
  });

  try {
    const absoluteFilePath = path.resolve(filePath);
    // 2. Call AI Engine OCR/extraction endpoint
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: absoluteFilePath, doc_type: docType }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI engine HTTP ${aiRes.status}: ${errText}`);
    }

    const body = await aiRes.json();
    const transactions: any[] = Array.isArray(body.transactions) ? body.transactions : [];
    const confidence: number = typeof body.confidence === "number" ? body.confidence : 0;
    const ocrText: string = typeof body.ocr_text === "string" ? body.ocr_text : "";

    console.log(`[OCR] OCR completed: documentId=${documentId}, extracted ${transactions.length} rows, confidence=${confidence}`);

    // Check if we extracted a reliable first transaction
    const firstTx = transactions[0];
    const hasValidAmount = firstTx && typeof firstTx.amount === "number" && firstTx.amount > 0;
    const hasValidDate = firstTx && Boolean(firstTx.date || firstTx.transactionDate);
    const hasValidMerchant = firstTx && Boolean(firstTx.merchant || firstTx.description);

    // High confidence: overall score >= 0.85 AND valid positive amount AND merchant/date
    const isConfident = confidence >= CONFIDENCE_THRESHOLD && hasValidAmount && hasValidDate;
    const finalStatus = isConfident ? "COMPLETED" : "NEEDS_REVIEW";

    let createdTransactionId: string | null = doc.transactionId || null;

    // 3. Idempotent Transaction Creation: only if COMPLETED and not already created
    if (isConfident && hasValidAmount && !createdTransactionId) {
      try {
        const txDate = firstTx.date || firstTx.transactionDate ? new Date(firstTx.date || firstTx.transactionDate) : new Date();
        const baseDescription = (firstTx.merchant || firstTx.description || doc.title).slice(0, 500);

        // Check if user has an account matching the payment mode
        let matchedAccountId: string | undefined = undefined;
        if (firstTx.payment_mode) {
          const pm = String(firstTx.payment_mode).toLowerCase();
          const targetType = pm.includes("upi")
            ? "upi"
            : pm.includes("cash")
            ? "cash"
            : pm.includes("card")
            ? "credit_card"
            : undefined;
          if (targetType) {
            const acc = await prisma.account.findFirst({
              where: { userId: doc.userId, accountType: targetType },
            });
            if (acc) matchedAccountId = acc.id;
          }
        }

        // Annotate description with payment mode details
        let finalDescription = baseDescription;
        if (firstTx.payment_mode && !finalDescription.toLowerCase().includes(String(firstTx.payment_mode).toLowerCase())) {
          const modeDetail = firstTx.payment_details
            ? ` (${firstTx.payment_mode}: ${firstTx.payment_details})`
            : ` (${firstTx.payment_mode})`;
          finalDescription = `${finalDescription}${modeDetail}`.slice(0, 500);
        }

        const newTx = await prisma.transaction.create({
          data: {
            userId: doc.userId,
            amount: firstTx.amount,
            category: firstTx.category || "Other",
            transactionDate: isNaN(txDate.getTime()) ? new Date() : txDate,
            description: finalDescription,
            accountId: matchedAccountId,
            source: "ocr",
          },
        });
        createdTransactionId = newTx.id;
        console.log(`[OCR] Transaction created: txId=${newTx.id} for documentId=${documentId}, amount=₹${firstTx.amount}`);
      } catch (txErr: any) {
        console.error(`[OCR] Failed to create auto-transaction for documentId=${documentId}:`, txErr.message);
      }
    }

    // 4. Update Document record in PostgreSQL
    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedJson: transactions,
        confidence,
        status: finalStatus,
        transactionId: createdTransactionId,
        processingCompletedAt: new Date(),
        ocrError: body.error || null,
      },
    });

    console.log(`[OCR] Document finalized: documentId=${documentId} → ${finalStatus} (confidence=${confidence}, txId=${createdTransactionId})`);
  } catch (err: any) {
    console.error(`[OCR] ERROR on documentId=${documentId} (attempt ${retryCount + 1}/${MAX_RETRIES}):`, err.message);

    if (retryCount + 1 < MAX_RETRIES) {
      // Exponential backoff retry: 2s, 4s, 8s
      const backoffMs = Math.pow(2, retryCount + 1) * 1000;
      console.log(`[OCR] Scheduling retry in ${backoffMs}ms for documentId=${documentId}`);
      setTimeout(async () => {
        try {
          const retryJob: DocumentJob = { ...job, retryCount: retryCount + 1 };
          await redis.lpush(QUEUE_KEY, JSON.stringify(retryJob));
        } catch (e: any) {
          console.error("[OCR] Failed to re-enqueue retry job:", e.message);
        }
      }, backoffMs);
    } else {
      // Final failure: mark NEEDS_REVIEW with meaningful error message so user can edit in UI
      console.warn(`[OCR] Max retries exhausted for documentId=${documentId}, setting NEEDS_REVIEW`);
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "NEEDS_REVIEW",
          confidence: 0.0,
          processingCompletedAt: new Date(),
          ocrError: `OCR processing failed after ${MAX_RETRIES} attempts: ${err.message}`,
        },
      });
    }
  }
}

/**
 * Recovers any documents in PostgreSQL that were left in QUEUED or stale PROCESSING states.
 */
export async function recoverPendingDocuments(): Promise<void> {
  try {
    const pendingDocs = await prisma.document.findMany({
      where: {
        OR: [
          { status: "QUEUED" },
          {
            status: "PROCESSING",
            processingStartedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) }, // stuck for > 5 min
          },
        ],
      },
      take: 20,
    });

    if (pendingDocs.length > 0) {
      console.log(`[OCR] Recovering ${pendingDocs.length} pending/stale documents...`);
      for (const d of pendingDocs) {
        const job: DocumentJob = {
          documentId: d.id,
          filePath: d.fileUrl,
          docType: d.docType,
        };
        await redis.lpush(QUEUE_KEY, JSON.stringify(job));
        console.log(`[OCR] Re-enqueued documentId=${d.id} title="${d.title}"`);
      }
    }
  } catch (err: any) {
    console.error("[OCR] Error recovering pending documents:", err.message);
  }
}

export async function workerLoop(): Promise<void> {
  console.log(`[worker] started — listening on Redis list "${QUEUE_KEY}" …`);
  await recoverPendingDocuments();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // BRPOP blocks for up to 5 s
      const result = await redis.brpop(QUEUE_KEY, 5);
      if (!result) continue;

      const [, raw] = result;
      let job: DocumentJob;
      try {
        job = JSON.parse(raw);
      } catch {
        console.error("[worker] Could not parse job payload:", raw);
        continue;
      }

      await processJob(job);
    } catch (err: any) {
      console.error("[worker] Unexpected error in loop:", err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// Run loop if invoked directly from CLI
if (require.main === module) {
  workerLoop().catch((err) => {
    console.error("[worker] Fatal error:", err);
    process.exit(1);
  });
}
