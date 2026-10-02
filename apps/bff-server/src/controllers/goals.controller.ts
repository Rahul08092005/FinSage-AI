// Person 1 (Aditi) owns this file.
// Phase 6: adds whatIfSimulator — proxy to Kavya's AI-engine what-if endpoint.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const AI_ENGINE_BASE = process.env.AI_ENGINE_URL || "http://localhost:8000";

const goalSchema = z.object({
  // Phase 4: title gets a max length to prevent abuse; endDate is validated as
  // a real parseable date rather than accepting any arbitrary string.
  title: z.string().min(1).max(200, { message: "Title must be 200 characters or fewer" }),
  targetAmount: z.number().positive(),
  endDate: z.string().refine((s) => !isNaN(Date.parse(s)), {
    message: "endDate must be a valid date string (e.g. ISO 8601)",
  }),
});

export async function listGoals(req: AuthedRequest, res: Response) {
  const goals = await prisma.goal.findMany({ where: { userId: req.userId }, orderBy: { endDate: "asc" } });
  res.json(goals);
}

export async function createGoal(req: AuthedRequest, res: Response) {
  const parsed = goalSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const goal = await prisma.goal.create({
    data: {
      userId: req.userId as string,
      title: parsed.data.title,
      targetAmount: parsed.data.targetAmount,
      endDate: new Date(parsed.data.endDate),
    },
  });
  res.status(201).json(goal);
}

export async function deleteGoal(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const existing = await prisma.goal.findFirst({ where: { id, userId: req.userId } });
  if (!existing) return res.status(404).json({ error: "Goal not found" });

  await prisma.goal.delete({ where: { id } });
  res.status(204).send();
}

// ---------------------------------------------------------------------------
// POST /api/v1/goals/what-if
// ---------------------------------------------------------------------------
// Accepts deltas to income / expenses / savings rate, fetches the user's
// existing goals and recent transactions from Prisma, then forwards everything
// to Kavya's AI-engine scenario-calculation endpoint.
// This handler is a pure transport layer — no math lives here.
//
// Request body:
//   {
//     incomeDelta:      number,   // monthly income change in INR (positive = increase)
//     expenseDelta:     number,   // monthly expense change in INR (positive = increase)
//     savingsRateDelta: number    // savings-rate change in percentage points (e.g. 5 = +5 %)
//   }
//
// Success response (200) — shape defined by Kavya's model:
//   { goals: [ { id, title, originalEta, revisedEta, onTrack, projectedSavings } ] }
//
// Error responses:
//   400 — invalid request body
//   502 — AI engine returned an error
//   503 — AI engine is unreachable
// ---------------------------------------------------------------------------

const whatIfSchema = z.object({
  incomeDelta:      z.number({ required_error: "incomeDelta is required" }),
  expenseDelta:     z.number({ required_error: "expenseDelta is required" }),
  savingsRateDelta: z.number({ required_error: "savingsRateDelta is required" }),
});

export async function whatIfSimulator(req: AuthedRequest, res: Response) {
  const parsed = whatIfSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { incomeDelta, expenseDelta, savingsRateDelta } = parsed.data;
  const now = new Date();
  const threeMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));

  // Fetch the user's existing financial context from Prisma
  const [goals, transactions] = await Promise.all([
    prisma.goal.findMany({ where: { userId: req.userId }, orderBy: { endDate: "asc" } }),
    prisma.transaction.findMany({
      where: { userId: req.userId, transactionDate: { gte: threeMonthsAgo } },
      orderBy: { transactionDate: "desc" },
    }),
  ]);

  try {
    const aiRes = await fetch(`${AI_ENGINE_BASE}/internal/goals/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incomeDelta,
        expenseDelta,
        savingsRateDelta,
        goals,
        transactions,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[whatIfSimulator] AI engine error:", aiRes.status, errText);
      return res.status(502).json({ error: "AI engine returned an error", detail: errText });
    }

    const body = await aiRes.json();
    return res.json(body);
  } catch (err: any) {
    console.error("[whatIfSimulator] Could not reach AI engine:", err.message);
    return res.status(503).json({ error: "AI engine unreachable", detail: err.message });
  }
}
