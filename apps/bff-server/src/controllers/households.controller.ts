import { Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth.middleware";

const createHouseholdSchema = z.object({
  name: z.string().min(1, "Household name is required"),
});

const inviteMemberSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
});

const createSharedExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().optional().default("General"),
  expenseDate: z.string().optional(),
  payerMemberId: z.string().min(1, "Payer member ID is required"),
  splitMethod: z.enum(["EQUAL", "CUSTOM"]).optional().default("EQUAL"),
  participatingMemberIds: z.array(z.string()).optional(),
  splits: z
    .array(
      z.object({
        memberId: z.string(),
        allocatedAmount: z.number().nonnegative(),
      })
    )
    .optional(),
});

/**
 * Helper: Find household for user (either as owner or as member)
 */
async function findUserHousehold(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return null;

  // Check if member of a household
  const memberRecord = await prisma.householdMember.findFirst({
    where: {
      OR: [{ userId: user.id }, { email: user.email }],
    },
    include: {
      household: true,
    },
  });

  if (memberRecord) {
    return memberRecord.household;
  }

  // Check if owner of a household
  const ownedHousehold = await prisma.household.findFirst({
    where: { ownerId: user.id },
  });

  return ownedHousehold;
}

/**
 * GET /api/v1/households/summary
 * Returns genuine household summary, members, and real shared expenses
 */
export async function getHouseholdSummary(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const household = await findUserHousehold(userId);
    if (!household) {
      return res.json(null);
    }

    // Fetch members
    const members = await prisma.householdMember.findMany({
      where: { householdId: household.id },
      orderBy: { joinedAt: "asc" },
    });

    // Fetch expenses with payer and splits
    const expenses = await prisma.householdExpense.findMany({
      where: { householdId: household.id },
      include: {
        payerMember: true,
        splits: {
          include: {
            member: true,
          },
        },
      },
      orderBy: { expenseDate: "desc" },
    });

    // Calculate total spend: Each recorded expense is counted exactly ONCE!
    let totalSpend = 0;
    const memberAllocations: Record<
      string,
      { spend: number; paid: number; count: number }
    > = {};

    members.forEach((m) => {
      memberAllocations[m.id] = { spend: 0, paid: 0, count: 0 };
    });

    for (const exp of expenses) {
      const expAmount = Number(exp.amount) || 0;
      totalSpend += expAmount;

      if (memberAllocations[exp.payerMemberId]) {
        memberAllocations[exp.payerMemberId].paid += expAmount;
        memberAllocations[exp.payerMemberId].count += 1;
      }

      for (const split of exp.splits) {
        const splitAmount = Number(split.allocatedAmount) || 0;
        if (memberAllocations[split.memberId]) {
          memberAllocations[split.memberId].spend += splitAmount;
        }
      }
    }

    const memberBreakdown = members.map((m) => {
      const alloc = memberAllocations[m.id] || { spend: 0, paid: 0, count: 0 };
      return {
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        spend: alloc.spend, // their allocated share of expenses
        paid: alloc.paid,   // how much they actually paid out of pocket
        netBalance: alloc.paid - alloc.spend, // positive = owed money, negative = owes money
        transactionCount: alloc.count,
        joinedAt: m.joinedAt.toISOString(),
      };
    });

    return res.json({
      householdId: household.id,
      name: household.name,
      totalSpend,
      memberBreakdown,
      expenses: expenses.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        category: exp.category,
        expenseDate: exp.expenseDate.toISOString(),
        splitMethod: exp.splitMethod,
        payerMemberId: exp.payerMemberId,
        payerMemberName: exp.payerMember.name,
        splits: exp.splits.map((s) => ({
          memberId: s.memberId,
          memberName: s.member.name,
          allocatedAmount: Number(s.allocatedAmount),
        })),
        createdAt: exp.createdAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error("[getHouseholdSummary] Error:", err);
    return res.status(500).json({ error: "Failed to load household summary" });
  }
}

/**
 * POST /api/v1/households
 * Create a new household with current user as Owner
 */
export async function createHousehold(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = createHouseholdSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already owns or belongs to a household
    const existing = await findUserHousehold(userId);
    if (existing) {
      return res.status(400).json({
        error: `You already belong to household "${existing.name}".`,
      });
    }

    // Create household and owner member
    const newHousehold = await prisma.$transaction(async (tx) => {
      const hh = await tx.household.create({
        data: {
          name: parsed.data.name.trim(),
          ownerId: user.id,
        },
      });

      await tx.householdMember.create({
        data: {
          householdId: hh.id,
          userId: user.id,
          name: user.name,
          email: user.email,
          role: "OWNER",
          status: "ACCEPTED",
        },
      });

      return hh;
    });

    return res.status(201).json(newHousehold);
  } catch (err: any) {
    console.error("[createHousehold] Error:", err);
    return res.status(500).json({ error: "Failed to create household" });
  }
}

/**
 * POST /api/v1/households/:id/invite
 * Invite a member to the household
 */
export async function inviteMember(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    const householdId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = inviteMemberSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, name } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Verify user belongs to household
    const userHousehold = await findUserHousehold(userId);
    if (!userHousehold || userHousehold.id !== householdId) {
      return res.status(403).json({ error: "Not authorized for this household" });
    }

    // Check if already a member
    const existingMember = await prisma.householdMember.findUnique({
      where: {
        householdId_email: {
          householdId,
          email: normalizedEmail,
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: `${email} is already a member of this household` });
    }

    // Check if an existing registered user matches this email
    const registeredUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const memberName =
      name?.trim() || registeredUser?.name || normalizedEmail.split("@")[0];

    const member = await prisma.householdMember.create({
      data: {
        householdId,
        userId: registeredUser ? registeredUser.id : null,
        name: memberName,
        email: normalizedEmail,
        role: "MEMBER",
        status: registeredUser ? "ACCEPTED" : "PENDING",
      },
    });

    return res.status(201).json({ success: true, member });
  } catch (err: any) {
    console.error("[inviteMember] Error:", err);
    return res.status(500).json({ error: "Failed to invite member" });
  }
}

/**
 * POST /api/v1/households/:id/expenses
 * Record a shared expense and calculate member allocations
 */
export async function addSharedExpense(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    const householdId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parsed = createSharedExpenseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Verify user belongs to household
    const userHousehold = await findUserHousehold(userId);
    if (!userHousehold || userHousehold.id !== householdId) {
      return res.status(403).json({ error: "Not authorized for this household" });
    }

    const {
      description,
      amount,
      category,
      expenseDate,
      payerMemberId,
      splitMethod,
      participatingMemberIds,
      splits,
    } = parsed.data;

    // Verify payer member exists in household
    const payer = await prisma.householdMember.findUnique({
      where: { id: payerMemberId },
    });
    if (!payer || payer.householdId !== householdId) {
      return res.status(400).json({ error: "Invalid payer member for this household" });
    }

    // Fetch all members of household
    const allMembers = await prisma.householdMember.findMany({
      where: { householdId },
    });

    let splitAllocations: Array<{ memberId: string; allocatedAmount: number }> = [];

    if (splitMethod === "CUSTOM" && splits && splits.length > 0) {
      const sumAllocated = splits.reduce((acc, s) => acc + s.allocatedAmount, 0);
      if (Math.abs(sumAllocated - amount) > 0.05) {
        return res.status(400).json({
          error: `Custom split allocations (₹${sumAllocated.toFixed(2)}) must sum up to total expense amount (₹${amount.toFixed(2)})`,
        });
      }
      splitAllocations = splits;
    } else {
      // EQUAL SPLIT
      const participants =
        participatingMemberIds && participatingMemberIds.length > 0
          ? allMembers.filter((m) => participatingMemberIds.includes(m.id))
          : allMembers;

      if (participants.length === 0) {
        return res.status(400).json({ error: "At least one member must participate in expense" });
      }

      const rawPerPerson = amount / participants.length;
      const roundedPerPerson = Math.floor(rawPerPerson * 100) / 100;
      let remainder = Math.round((amount - roundedPerPerson * participants.length) * 100) / 100;

      splitAllocations = participants.map((m, idx) => {
        let alloc = roundedPerPerson;
        if (idx === 0 && remainder > 0) {
          alloc += remainder;
          remainder = 0;
        }
        return {
          memberId: m.id,
          allocatedAmount: alloc,
        };
      });
    }

    const expenseRecord = await prisma.$transaction(async (tx) => {
      const exp = await tx.householdExpense.create({
        data: {
          householdId,
          payerMemberId,
          description: description.trim(),
          amount,
          category: category || "General",
          expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
          splitMethod: splitMethod || "EQUAL",
        },
      });

      await tx.householdExpenseSplit.createMany({
        data: splitAllocations.map((s) => ({
          expenseId: exp.id,
          memberId: s.memberId,
          allocatedAmount: s.allocatedAmount,
        })),
      });

      return exp;
    });

    return res.status(201).json(expenseRecord);
  } catch (err: any) {
    console.error("[addSharedExpense] Error:", err);
    return res.status(500).json({ error: "Failed to add shared expense" });
  }
}

/**
 * DELETE /api/v1/households/:id/expenses/:expenseId
 * Delete a shared expense
 */
export async function deleteSharedExpense(req: AuthedRequest, res: Response) {
  try {
    const userId = req.userId;
    const { id: householdId, expenseId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userHousehold = await findUserHousehold(userId);
    if (!userHousehold || userHousehold.id !== householdId) {
      return res.status(403).json({ error: "Not authorized for this household" });
    }

    await prisma.householdExpense.delete({
      where: { id: expenseId },
    });

    return res.json({ success: true });
  } catch (err: any) {
    console.error("[deleteSharedExpense] Error:", err);
    return res.status(500).json({ error: "Failed to delete shared expense" });
  }
}
