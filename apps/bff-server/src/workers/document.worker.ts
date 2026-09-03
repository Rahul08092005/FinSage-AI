// Standalone background worker — run with: npm run worker
// Never imported by the Express app; runs as a separate process.
// Consumes the "document-processing-queue" Redis list and calls Kavya's
// AI engine to process each uploaded document.
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

redis.on("error", (err) => {
  console.error("[worker][redis] connection error:", err.message);
});

interface DocumentJob {
  documentId: string;
  filePath: string;
  docType: string;
}

async function processJob(job: DocumentJob): Promise<void> {
  const { documentId, filePath, docType } = job;
  console.log(`[worker] processing documentId=${documentId} docType=${docType}`);

  // Mark PROCESSING
  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    // Call Kavya's OCR/extraction endpoint
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/documents/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_path: filePath, doc_type: docType }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI engine responded ${aiRes.status}: ${errText}`);
    }

    const body = await aiRes.json();
    const transactions = body.transactions ?? [];
    const confidence: number = typeof body.confidence === "number" ? body.confidence : 0;

    const status = confidence >= CONFIDENCE_THRESHOLD ? "COMPLETED" : "NEEDS_REVIEW";

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedJson: transactions,
        confidence,
        status,
      },
    });

    console.log(`[worker] documentId=${documentId} → ${status} (confidence=${confidence})`);
  } catch (err: any) {
    // Log clearly but do NOT crash the worker loop
    console.error(
      `[worker] FAILED documentId=${documentId}:`,
      err.message
    );
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    });
  }
}

async function workerLoop(): Promise<void> {
  console.log(`[worker] started — listening on Redis list "${QUEUE_KEY}" …`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // BRPOP blocks for up to 5 s, then returns null so we can loop
      const result = await redis.brpop(QUEUE_KEY, 5);
      if (!result) continue; // timeout — loop again

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
      // Redis connection errors etc. — log and keep looping
      console.error("[worker] Unexpected error in loop:", err.message);
      // Small back-off so we don't spin-loop if Redis is down
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

workerLoop().catch((err) => {
  console.error("[worker] Fatal error:", err);
  process.exit(1);
});
