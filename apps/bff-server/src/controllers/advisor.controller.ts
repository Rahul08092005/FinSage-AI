// Phase 3: AI Advisor streaming chat endpoint (SSE).
// Follows the same style as other controllers (requireAuth, zod, prisma).
import { Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

const chatSchema = z.object({
  message: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST /api/v1/advisor/chat
// Fetches this month's transactions, calls the AI orchestrator, then streams
// the answer back word-by-word as SSE so the frontend sees a typing effect.
// ---------------------------------------------------------------------------
export async function advisorChat(req: AuthedRequest, res: Response) {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Fetch this month's transactions — same pattern as expenses.controller.ts
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId, transactionDate: { gte: monthStart } },
    orderBy: { transactionDate: "desc" },
  });

  // Call Rahul's AI orchestrator
  let answer: string;
  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/ai/orchestrate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: req.userId,
        session_id: randomUUID(),
        message: parsed.data.message,
        transactions_json: transactions,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[advisorChat] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine returned an error", detail: errText });
    }

    const body = await aiRes.json();
    answer = String(body.answer ?? body.response ?? body.text ?? "");
  } catch (err: any) {
    console.error("[advisorChat] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Stream word-by-word with 40 ms delay between each token
  const words = answer.split(" ");
  let index = 0;

  function sendNext() {
    if (index >= words.length) {
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    // Include a trailing space between words (omit after last word)
    const token = index < words.length - 1 ? words[index] + " " : words[index];
    res.write(`data: ${token}\n\n`);
    index++;
    setTimeout(sendNext, 40);
  }

  sendNext();
}
