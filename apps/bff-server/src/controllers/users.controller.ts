// Phase 2: salary PATCH. Phase 5: adds tax-profile PATCH and extends getMe.
// Controller for PATCH /api/v1/users/me/salary (existing, unchanged)
// and the new PATCH /api/v1/users/me/tax-profile.
import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const salarySchema = z.object({
  monthlySalary: z.number().positive(),
});

// Phase 5: tax profile schema — at least one field required; taxRegime is
// constrained to 'old' | 'new' at the API layer (DB stores it as plain String).
const taxProfileSchema = z
  .object({
    taxRegime: z.enum(["old", "new"]).optional(),
    annualIncome: z.number().positive({ message: "annualIncome must be a positive number" }).optional(),
  })
  .refine((d) => d.taxRegime !== undefined || d.annualIncome !== undefined, {
    message: "Provide at least one of taxRegime or annualIncome",
  });

// ---------------------------------------------------------------------------
// GET /api/v1/users/me
// Phase 5: now also returns taxRegime and annualIncome.
// ---------------------------------------------------------------------------
export async function getMe(req: AuthedRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
      // Phase 5: tax profile fields
      taxRegime: true,
      annualIncome: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary !== null ? Number(user.monthlySalary) : null,
    // Phase 5
    taxRegime: user.taxRegime ?? null,
    annualIncome: user.annualIncome !== null ? Number(user.annualIncome) : null,
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/me/salary   (existing — shape unchanged)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/me/tax-profile   (Phase 5 — new endpoint)
// Accepts { taxRegime?: "old"|"new", annualIncome?: number } and persists both.
// At least one field must be provided; missing fields are left unchanged (PATCH
// semantics — we use Prisma's undefined-is-skip behaviour).
// ---------------------------------------------------------------------------
export async function updateTaxProfile(req: AuthedRequest, res: Response) {
  const parsed = taxProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: {
      // undefined fields are ignored by Prisma — true PATCH behaviour
      taxRegime: parsed.data.taxRegime,
      annualIncome: parsed.data.annualIncome,
    },
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
      taxRegime: true,
      annualIncome: true,
    },
  });

  // Audit log
  console.log(
    `[AUDIT] userId=${req.userId} action=user.updateTaxProfile taxRegime=${updated.taxRegime ?? "unchanged"} timestamp=${new Date().toISOString()}`
  );

  res.json({
    id: updated.id,
    name: updated.name,
    email: updated.email,
    monthlySalary: updated.monthlySalary !== null ? Number(updated.monthlySalary) : null,
    taxRegime: updated.taxRegime ?? null,
    annualIncome: updated.annualIncome !== null ? Number(updated.annualIncome) : null,
  });
}
