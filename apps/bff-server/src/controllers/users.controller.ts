import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const salarySchema = z.object({
  monthlySalary: z.number().positive(),
});

export async function getMe(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, monthlySalary: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary !== null ? Number(user.monthlySalary) : null,
  });
}

export async function updateSalary(req: AuthedRequest, res: Response) {
  const parsed = salarySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { monthlySalary: parsed.data.monthlySalary },
    select: { id: true, name: true, email: true, monthlySalary: true },
  });

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    monthlySalary: updated.monthlySalary !== null ? Number(updated.monthlySalary) : null,
  });
}
