const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Account ID for Vedant Kakade (from Supabase)
const VEDANT_KAKADE_ACCOUNT_ID = "3ec9acbb-e4e1-4e91-97ca-32d21b177773";

// Transaction templates with realistic data
const expenseTemplates = [
    { category: "groceries", descriptions: ["Grocery shopping at DMart", "Weekly groceries", "Fresh vegetables and fruits", "Monthly grocery stock", "Supermarket shopping"], minAmount: 500, maxAmount: 5000 },
    { category: "food", descriptions: ["Lunch at restaurant", "Dinner with friends", "Coffee and snacks", "Zomato order", "Swiggy food delivery", "Street food", "Fast food"], minAmount: 100, maxAmount: 1500 },
    { category: "transportation", descriptions: ["Uber ride", "Ola cab", "Petrol refill", "Auto rickshaw", "Metro card recharge", "Bus pass"], minAmount: 50, maxAmount: 3000 },
    { category: "utilities", descriptions: ["Electricity bill", "Water bill", "Internet bill", "Mobile recharge", "Gas cylinder", "DTH recharge"], minAmount: 200, maxAmount: 2500 },
    { category: "entertainment", descriptions: ["Movie tickets", "Netflix subscription", "Amazon Prime", "Concert tickets", "Gaming purchase", "Spotify subscription"], minAmount: 150, maxAmount: 2000 },
    { category: "shopping", descriptions: ["Clothes shopping", "Amazon purchase", "Flipkart order", "Electronics accessory", "Home decor items", "Myntra order"], minAmount: 500, maxAmount: 8000 },
    { category: "healthcare", descriptions: ["Doctor consultation", "Medicine purchase", "Lab tests", "Pharmacy visit", "Health checkup"], minAmount: 200, maxAmount: 5000 },
    { category: "education", descriptions: ["Online course", "Books purchase", "Udemy course", "Study materials", "Workshop fee"], minAmount: 300, maxAmount: 3000 },
    { category: "personal", descriptions: ["Haircut and grooming", "Personal care items", "Gym membership", "Salon visit"], minAmount: 100, maxAmount: 2000 },
    { category: "travel", descriptions: ["Train ticket booking", "Flight ticket", "Hotel booking", "Weekend trip expenses", "Vacation expenses"], minAmount: 500, maxAmount: 15000 },
    { category: "bills", descriptions: ["Credit card payment", "Insurance premium", "Loan EMI", "Society maintenance"], minAmount: 1000, maxAmount: 20000 },
    { category: "other-expense", descriptions: ["Miscellaneous expense", "Emergency expense", "Unexpected cost", "Other purchase"], minAmount: 100, maxAmount: 3000 },
];

const incomeTemplates = [
    { category: "salary", descriptions: ["Monthly salary", "Salary credit"], minAmount: 50000, maxAmount: 150000 },
    { category: "freelance", descriptions: ["Freelance project payment", "Contract work payment", "Consulting fee"], minAmount: 5000, maxAmount: 50000 },
    { category: "investments", descriptions: ["Dividend received", "Mutual fund returns", "Stock sale profit", "FD maturity"], minAmount: 1000, maxAmount: 20000 },
    { category: "other-income", descriptions: ["Cashback received", "Refund received", "Gift money", "Bonus"], minAmount: 500, maxAmount: 10000 },
];

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomAmount(min, max) {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomDate(startDays, endDays) {
    const now = new Date();
    const start = new Date(now.getTime() - startDays * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - endDays * 24 * 60 * 60 * 1000);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedTransactions() {
    console.log("🌱 Starting to seed transactions for Vedant Kakade account...\n");

    // First, get the correct userId from the account
    const account = await prisma.account.findUnique({
        where: { id: VEDANT_KAKADE_ACCOUNT_ID },
    });

    if (!account) {
        console.error("❌ Account not found! Please check the account ID.");
        return;
    }

    const userId = account.userId;
    console.log(`📋 Found account: ${account.name}`);
    console.log(`👤 User ID: ${userId}\n`);

    const transactions = [];

    // Generate 100 transactions (80% expenses, 20% income for realistic data)
    for (let i = 0; i < 100; i++) {
        const isExpense = Math.random() < 0.8; // 80% chance of expense
        const templates = isExpense ? expenseTemplates : incomeTemplates;
        const template = getRandomElement(templates);

        transactions.push({
            type: isExpense ? "EXPENSE" : "INCOME",
            amount: getRandomAmount(template.minAmount, template.maxAmount),
            description: getRandomElement(template.descriptions),
            date: getRandomDate(180, 0), // Last 6 months
            category: template.category,
            isRecurring: Math.random() < 0.1, // 10% recurring
            recurringInterval: Math.random() < 0.1 ? getRandomElement(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]) : null,
            status: "COMPLETED",
            userId: userId,
            accountId: VEDANT_KAKADE_ACCOUNT_ID,
        });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => b.date - a.date);

    console.log(`📊 Generated ${transactions.length} transactions\n`);

    // Insert all transactions
    let created = 0;
    for (const tx of transactions) {
        try {
            await prisma.transaction.create({ data: tx });
            created++;
            if (created % 10 === 0) {
                console.log(`✅ Created ${created}/100 transactions...`);
            }
        } catch (error) {
            console.error(`❌ Error creating transaction: ${error.message}`);
        }
    }

    console.log(`\n🎉 Successfully created ${created} transactions!`);

    // Show summary
    const summary = transactions.reduce((acc, tx) => {
        acc[tx.type] = (acc[tx.type] || 0) + 1;
        return acc;
    }, {});

    console.log("\n📈 Summary:");
    console.log(`   - Expenses: ${summary.EXPENSE || 0}`);
    console.log(`   - Income: ${summary.INCOME || 0}`);
}

seedTransactions()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
