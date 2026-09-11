// Person 1 (Aditi) owns this file.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

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
