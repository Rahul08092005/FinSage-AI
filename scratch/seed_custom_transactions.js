const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const transactionsToSeed = [
  { date: "2026-09-02T10:00:00.000Z", category: "Food & Dining", description: "Cafe Coffee Day", amount: 420 },
  { date: "2026-09-03T11:30:00.000Z", category: "Groceries", description: "D-Mart", amount: 1850 },
  { date: "2026-09-04T09:15:00.000Z", category: "Utilities", description: "BESCOM Electricity Bill", amount: 1240 },
  { date: "2026-09-05T14:20:00.000Z", category: "Shopping", description: "Amazon", amount: 1299 },
  { date: "2026-09-06T19:45:00.000Z", category: "Food & Dining", description: "Zomato", amount: 580 },
  { date: "2026-09-08T18:00:00.000Z", category: "Entertainment", description: "BookMyShow", amount: 850 },
  { date: "2026-09-09T16:10:00.000Z", category: "Groceries", description: "Reliance Smart", amount: 1420 },
  { date: "2026-09-10T08:30:00.000Z", category: "Travel", description: "Uber", amount: 340 },
  { date: "2026-09-11T12:00:00.000Z", category: "Healthcare", description: "Apollo Pharmacy", amount: 720 },
  { date: "2026-09-12T20:30:00.000Z", category: "Food & Dining", description: "Swiggy", amount: 640 },
  { date: "2026-09-13T15:45:00.000Z", category: "Shopping", description: "Myntra", amount: 1799 },
  { date: "2026-09-14T09:00:00.000Z", category: "Travel", description: "Uber", amount: 460 },
  { date: "2026-09-15T11:00:00.000Z", category: "Groceries", description: "BigBasket", amount: 1180 },
  { date: "2026-09-16T10:15:00.000Z", category: "Utilities", description: "Mobile Recharge", amount: 699 },
  { date: "2026-09-17T21:00:00.000Z", category: "Food & Dining", description: "Restaurant", amount: 920 },
  { date: "2026-09-18T07:30:00.000Z", category: "Entertainment", description: "Netflix", amount: 649 },
  { date: "2026-09-19T17:20:00.000Z", category: "Shopping", description: "Flipkart", amount: 999 },
  { date: "2026-09-20T08:45:00.000Z", category: "Travel", description: "Ola", amount: 380 },
];

async function run() {
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users:`, users.map((u) => ({ id: u.id, email: u.email, name: u.name })));

  for (const user of users) {
    console.log(`Seeding ${transactionsToSeed.length} transactions for ${user.email} (${user.id})...`);
    for (const t of transactionsToSeed) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: t.amount,
          category: t.category,
          transactionDate: new Date(t.date),
          description: t.description,
          source: "manual",
        },
      });
    }
  }

  const count = await prisma.transaction.count();
  console.log(`Successfully seeded transactions. Total transactions now in DB: ${count}`);
}

run()
  .catch((e) => {
    console.error("Error seeding transactions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
