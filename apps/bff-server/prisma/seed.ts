import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding FinSage AI ledger data...");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  // 1. Upsert Demo User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@finsage.ai" },
    update: {
      password: passwordHash,
      monthlySalary: 100000,
    },
    create: {
      name: "Demo User",
      email: "demo@finsage.ai",
      password: passwordHash,
      monthlySalary: 100000,
    },
  });

  // Find all existing users so everyone gets rich seeded demo data
  const allUsers = await prisma.user.findMany();
  console.log(`Found ${allUsers.length} user(s) to populate with sample ledger data.`);

  for (const user of allUsers) {
    console.log(`\nPopulating data for user: ${user.name} (${user.email})...`);

    // Ensure user has monthly salary
    if (!user.monthlySalary) {
      await prisma.user.update({
        where: { id: user.id },
        data: { monthlySalary: 95000 },
      });
    }

    // 2. Accounts
    const hdfc = await prisma.account.create({
      data: {
        userId: user.id,
        name: "HDFC Premium Salary Account",
        accountType: "bank",
        provider: "HDFC Bank",
      },
    });

    const amex = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Amex Reserve Credit Card",
        accountType: "credit_card",
        provider: "American Express",
      },
    });

    const upi = await prisma.account.create({
      data: {
        userId: user.id,
        name: "Paytm Instant UPI",
        accountType: "upi",
        provider: "Paytm Payments",
      },
    });

    // 3. Budgets
    const budgetData = [
      { category: "Food & Dining", monthlyLimit: 12000 },
      { category: "Groceries", monthlyLimit: 10000 },
      { category: "Shopping", monthlyLimit: 8000 },
      { category: "Utilities", monthlyLimit: 6000 },
      { category: "Entertainment", monthlyLimit: 5000 },
      { category: "Travel", monthlyLimit: 6000 },
      { category: "Healthcare", monthlyLimit: 4000 },
    ];

    for (const b of budgetData) {
      await prisma.budget.upsert({
        where: {
          userId_category: {
            userId: user.id,
            category: b.category,
          },
        },
        update: { monthlyLimit: b.monthlyLimit },
        create: {
          userId: user.id,
          category: b.category,
          monthlyLimit: b.monthlyLimit,
          currency: "INR",
        },
      });
    }

    // 4. Goals
    const existingGoals = await prisma.goal.findMany({ where: { userId: user.id } });
    if (existingGoals.length === 0) {
      await prisma.goal.createMany({
        data: [
          {
            userId: user.id,
            title: "Emergency Reserve Fund (6 Mo)",
            targetAmount: 180000,
            startDate: new Date("2026-06-01T00:00:00.000Z"),
            endDate: new Date("2026-12-31T23:59:59.000Z"),
          },
          {
            userId: user.id,
            title: "Kyoto & Tokyo Autumn Expedition",
            targetAmount: 220000,
            startDate: new Date("2026-07-01T00:00:00.000Z"),
            endDate: new Date("2027-04-30T23:59:59.000Z"),
          },
          {
            userId: user.id,
            title: "Workstation M4 Max Upgrade",
            targetAmount: 95000,
            startDate: new Date("2026-08-01T00:00:00.000Z"),
            endDate: new Date("2026-11-30T23:59:59.000Z"),
          },
        ],
      });
    }

    // 5. Transactions across July, August, September 2026
    const sampleTransactions = [
      // September 2026 (Current Month)
      {
        amount: 1450,
        category: "Food & Dining",
        description: "Dinner at Olive Bistro & Bar",
        transactionDate: new Date("2026-09-05T20:30:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 3280,
        category: "Groceries",
        description: "Nature's Basket Organic Provisions",
        transactionDate: new Date("2026-09-04T15:15:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },
      {
        amount: 450,
        category: "Food & Dining",
        description: "Blue Tokai Coffee Roasters",
        transactionDate: new Date("2026-09-03T11:00:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 1299,
        category: "Entertainment",
        description: "BookMyShow IMAX Oppenheimer Special",
        transactionDate: new Date("2026-09-03T19:00:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 5400,
        category: "Utilities",
        description: "Tata Power Electricity Ledger Transfer",
        transactionDate: new Date("2026-09-02T10:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },
      {
        amount: 680,
        category: "Travel",
        description: "Uber Premier Airport Transfer",
        transactionDate: new Date("2026-09-02T08:30:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 2499,
        category: "Shopping",
        description: "Uniqlo Autumn Linen Collection",
        transactionDate: new Date("2026-09-01T17:45:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 850,
        category: "Healthcare",
        description: "Apollo Pharmacy Monthly Vitamins",
        transactionDate: new Date("2026-09-01T12:20:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 20000,
        category: "Rent",
        description: "Monthly Apartment Lease Ledger Transfer",
        transactionDate: new Date("2026-09-01T09:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },

      // August 2026
      {
        amount: 2100,
        category: "Food & Dining",
        description: "Social Cyberhub Weekend Brunch",
        transactionDate: new Date("2026-08-28T14:00:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 4650,
        category: "Groceries",
        description: "Blinkit Weekly Grocery Restock",
        transactionDate: new Date("2026-08-25T18:30:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 7890,
        category: "Shopping",
        description: "Amazon Peripherals & Mechanical Keyboard",
        transactionDate: new Date("2026-08-22T16:00:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 1199,
        category: "Entertainment",
        description: "Netflix & Spotify Family Subscriptions",
        transactionDate: new Date("2026-08-19T10:00:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 5100,
        category: "Utilities",
        description: "Airtel Fiber Gigabit & Mobile Postpaid",
        transactionDate: new Date("2026-08-15T11:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },
      {
        amount: 3400,
        category: "Travel",
        description: "MakeMyTrip Weekend Getaway Express",
        transactionDate: new Date("2026-08-12T09:30:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 1800,
        category: "Healthcare",
        description: "Cult.fit Annual Wellness Assessment",
        transactionDate: new Date("2026-08-08T18:00:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 3200,
        category: "Food & Dining",
        description: "Toit Microbrewery Craft Gathering",
        transactionDate: new Date("2026-08-05T21:00:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 20000,
        category: "Rent",
        description: "Monthly Apartment Lease Ledger Transfer",
        transactionDate: new Date("2026-08-01T09:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },

      // July 2026
      {
        amount: 2800,
        category: "Food & Dining",
        description: "Farzi Cafe Modern Indian Dinner",
        transactionDate: new Date("2026-07-29T20:30:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 5120,
        category: "Groceries",
        description: "Zepto Supermarket Gourmet Supplies",
        transactionDate: new Date("2026-07-24T17:00:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 6500,
        category: "Shopping",
        description: "Zara Summer Formal Wardrobe",
        transactionDate: new Date("2026-07-20T19:30:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 1499,
        category: "Entertainment",
        description: "Steam Summer Festival Gaming Library",
        transactionDate: new Date("2026-07-16T22:00:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 4800,
        category: "Utilities",
        description: "Water Supply & Maintenance Dues",
        transactionDate: new Date("2026-07-12T10:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },
      {
        amount: 4200,
        category: "Travel",
        description: "IndiGo Domestic Travel Reservation",
        transactionDate: new Date("2026-07-08T07:15:00.000Z"),
        source: "credit_card",
        accountId: amex.id,
      },
      {
        amount: 1650,
        category: "Food & Dining",
        description: "Smoke House Deli Business Lunch",
        transactionDate: new Date("2026-07-04T13:30:00.000Z"),
        source: "upi",
        accountId: upi.id,
      },
      {
        amount: 20000,
        category: "Rent",
        description: "Monthly Apartment Lease Ledger Transfer",
        transactionDate: new Date("2026-07-01T09:00:00.000Z"),
        source: "bank",
        accountId: hdfc.id,
      },
    ];

    for (const t of sampleTransactions) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          amount: t.amount,
          category: t.category,
          description: t.description,
          transactionDate: t.transactionDate,
          source: t.source,
          accountId: t.accountId,
        },
      });
    }

    // 6. Documents (Vouchers / Invoices)
    const existingDocs = await prisma.document.findMany({ where: { userId: user.id } });
    if (existingDocs.length === 0) {
      await prisma.document.createMany({
        data: [
          {
            userId: user.id,
            title: "HDFC_Salary_Statement_Aug2026.pdf",
            docType: "bank_statement",
            fileUrl: "uploads/sample-hdfc-aug2026.pdf",
            status: "COMPLETED",
            confidence: 0.98,
            uploadedAt: new Date("2026-09-01T10:00:00.000Z"),
          },
          {
            userId: user.id,
            title: "Starbucks_Coffee_Receipt_Sep03.pdf",
            docType: "receipt",
            fileUrl: "uploads/sample-starbucks.pdf",
            status: "COMPLETED",
            confidence: 0.95,
            uploadedAt: new Date("2026-09-03T11:05:00.000Z"),
          },
          {
            userId: user.id,
            title: "Apollo_Pharmacy_Invoice_Sep01.jpg",
            docType: "receipt",
            fileUrl: "uploads/sample-apollo.jpg",
            status: "NEEDS_REVIEW",
            confidence: 0.68,
            uploadedAt: new Date("2026-09-01T12:25:00.000Z"),
            extractedJson: {
              date: "2026-09-01",
              amount: 850,
              merchant: "Apollo Pharmacy Koramangala",
              category: "Healthcare",
              confidence: 0.68,
              items: [
                { name: "Multivitamin Daily Capsules 60s", amount: 420 },
                { name: "Omega 3 Deep Sea Fish Oil 1000mg", amount: 430 },
              ],
            },
          },
        ],
      });
    }

    console.log(`✓ Completed seeding for ${user.name}`);
  }

  console.log("\nSeeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
