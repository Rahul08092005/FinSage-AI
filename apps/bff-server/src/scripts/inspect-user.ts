import { prisma } from "../lib/prisma";

async function inspect() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      monthlySalary: true,
      annualIncome: true,
      taxRegime: true,
      createdAt: true,
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

  console.log("=== ALL USERS IN DATABASE ===");
  for (const u of users) {
    console.log(
      JSON.stringify(
        {
          id: u.id,
          email: u.email,
          name: u.name,
          monthlySalary: u.monthlySalary,
          annualIncome: u.annualIncome,
          taxRegime: u.taxRegime,
          createdAt: u.createdAt,
          counts: u._count,
        },
        null,
        2
      )
    );
  }

  // Also query total counts across tables
  const totalUsers = await prisma.user.count();
  const totalAccounts = await prisma.account.count();
  const totalTransactions = await prisma.transaction.count();
  const totalBudgets = await prisma.budget.count();
  const totalGoals = await prisma.goal.count();
  const totalDocuments = await prisma.document.count();

  console.log(
    "=== TOTAL TABLE COUNTS ===",
    JSON.stringify(
      {
        totalUsers,
        totalAccounts,
        totalTransactions,
        totalBudgets,
        totalGoals,
        totalDocuments,
      },
      null,
      2
    )
  );
}

inspect()
  .catch((e) => console.error("Error inspecting:", e))
  .finally(() => prisma.$disconnect());
