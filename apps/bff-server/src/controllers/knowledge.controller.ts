// Phase 3: RAG knowledge upload endpoint.
// Follows the same style as other controllers (requireAuth, zod, prisma).
import { Response } from "express";
import { z } from "zod";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

// The 5 RAG domain names Rahul's /internal/rag/ingest accepts
const RAG_DOMAINS = [
  "financial_knowledge",
  "guru_philosophy",
  "indian_tax_finance",
  "investment_education",
  "user_documents",
] as const;

const knowledgeSchema = z.object({
  domain: z.enum(RAG_DOMAINS),
  content: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST /api/v1/knowledge/upload
// ---------------------------------------------------------------------------
export async function uploadKnowledge(req: AuthedRequest, res: Response) {
  const parsed = knowledgeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/rag/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: parsed.data.domain,
        content: parsed.data.content,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[uploadKnowledge] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine returned an error", detail: errText });
    }

    const body = await aiRes.json();
    return res.status(201).json({ chunks_stored: body.chunks_stored ?? 0 });
  } catch (err: any) {
    console.error("[uploadKnowledge] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }
}
