import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";
import { redis } from "../lib/redis";

const TARGET_EMAIL = "demo@finsage.ai";

async function safeCleanup() {
  console.log(`[SAFE CLEANUP] Initiating scoped cleanup for: ${TARGET_EMAIL}`);

  // Step 1: Verify Demo User existence & ID
  const demoUser = await prisma.user.findUnique({
    where: { email: TARGET_EMAIL },
    include: {
      _count: {
        select: {
          accounts: true,
          transactions: true,
          budgets: true,
          goals: true,
          documents: true,
        },
      },
    },
  });

  if (!demoUser) {
    throw new Error(`Demo user with email ${TARGET_EMAIL} not found!`);
  }

  const userId = demoUser.id;
  console.log(`[SAFE CLEANUP] Verified Demo User ID: ${userId}`);
  console.log(`[SAFE CLEANUP] Pre-cleanup counts:`, demoUser._count);

  // Step 2: Clean up uploaded files owned exclusively by Demo User
  const userDocs = await prisma.document.findMany({
    where: { userId },
    select: { id: true, fileUrl: true },
  });

  for (const doc of userDocs) {
    if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
      try {
        fs.unlinkSync(doc.fileUrl);
        console.log(`[SAFE CLEANUP] Deleted local file: ${doc.fileUrl}`);
      } catch (e: any) {
        console.warn(`[SAFE CLEANUP] Could not remove file ${doc.fileUrl}:`, e.message);
      }
    }
  }

  // Step 3: Transactional deletion respecting Foreign Key order
  const result = await prisma.$transaction(async (tx) => {
    // 1. Transactions (depend on Account and User)
    const deletedTransactions = await tx.transaction.deleteMany({
      where: { userId },
    });

    // 2. Documents
    const deletedDocuments = await tx.document.deleteMany({
      where: { userId },
    });

    // 3. Budgets
    const deletedBudgets = await tx.budget.deleteMany({
      where: { userId },
    });

    // 4. Goals
    const deletedGoals = await tx.goal.deleteMany({
      where: { userId },
    });

    // 5. Accounts
    const deletedAccounts = await tx.account.deleteMany({
      where: { userId },
    });

    // 6. Reset User Financial Profile (keep account credentials intact)
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        monthlySalary: null,
        annualIncome: null,
        taxRegime: null,
      },
    });

    return {
      transactions: deletedTransactions.count,
      documents: deletedDocuments.count,
      budgets: deletedBudgets.count,
      goals: deletedGoals.count,
      accounts: deletedAccounts.count,
      userUpdated: updatedUser.id,
    };
  });

  console.log(`[SAFE CLEANUP] Deleted records summary:`, result);

  // Step 4: Clean up any user-specific redis keys if any
  try {
    const keys = await redis.keys(`*${userId}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[SAFE CLEANUP] Removed ${keys.length} redis keys for user.`);
    }
  } catch (e: any) {
    console.warn(`[SAFE CLEANUP] Redis key cleanup notice:`, e.message);
  }

  // Step 5: Post-cleanup verification
  const postUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          accounts: true,
          transactions: true,
          budgets: true,
          goals: true,
          documents: true,
        },
      },
    },
  });

  console.log(`[SAFE CLEANUP] Post-cleanup verification:`);
  console.log({
    id: postUser?.id,
    email: postUser?.email,
    name: postUser?.name,
    monthlySalary: postUser?.monthlySalary,
    annualIncome: postUser?.annualIncome,
    taxRegime: postUser?.taxRegime,
    counts: postUser?._count,
  });

  // Verify other users are untouched
  const otherUsers = await prisma.user.findMany({
    where: { NOT: { id: userId } },
    select: {
      email: true,
      _count: {
        select: {
          accounts: true,
          transactions: true,
          budgets: true,
          goals: true,
          documents: true,
        },
      },
    },
  });

  console.log(`[SAFE CLEANUP] Other users counts (should be untouched):`, otherUsers);
}

safeCleanup()
  .catch((e) => {
    console.error(`[SAFE CLEANUP ERROR]`, e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
