const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateRecurringIntervals() {
    console.log("\n========================================");
    console.log("    UPDATING RECURRING INTERVALS");
    console.log("========================================\n");

    // Define the correct intervals for each transaction type
    const intervalMapping = {
        // MONTHLY transactions (regular recurring expenses)
        "Petrol refill": "MONTHLY",
        "Grocery shopping at DMart": "MONTHLY",
        "Buy fresh fruits and vegetables": "MONTHLY",
        "Pharmacy visit": "MONTHLY",
        "Society maintenance": "MONTHLY",

        // YEARLY transactions (annual or rare expenses)
        "Concert tickets": "YEARLY",
        "Refund received": "YEARLY",
        "Insurance premium": "YEARLY",
        "Amazon Prime": "YEARLY",
        "Unexpected cost": "YEARLY",
        "Electronics accessory": "YEARLY",
        "Health checkup": "YEARLY",
    };

    // Get all recurring transactions
    const recurringTransactions = await prisma.transaction.findMany({
        where: {
            isRecurring: true,
        },
    });

    console.log(`Found ${recurringTransactions.length} recurring transaction templates.\n`);

    let updatedCount = 0;

    for (const transaction of recurringTransactions) {
        // Find the matching interval
        let newInterval = null;
        for (const [keyword, interval] of Object.entries(intervalMapping)) {
            if (transaction.description && transaction.description.includes(keyword)) {
                newInterval = interval;
                break;
            }
        }

        if (newInterval && transaction.recurringInterval !== newInterval) {
            // Calculate new next recurring date based on new interval
            const nextDate = calculateNextRecurringDate(new Date(), newInterval);

            await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    recurringInterval: newInterval,
                    nextRecurringDate: nextDate,
                },
            });

            console.log(`✅ Updated: "${transaction.description}"`);
            console.log(`   Old Interval: ${transaction.recurringInterval} → New Interval: ${newInterval}`);
            console.log(`   Next Recurring Date: ${nextDate.toDateString()}\n`);
            updatedCount++;
        } else if (newInterval) {
            console.log(`⏭️  Skipped: "${transaction.description}" (already ${newInterval})\n`);
        } else {
            console.log(`⚠️  No mapping found for: "${transaction.description}"\n`);
        }
    }

    console.log("========================================");
    console.log(`Updated ${updatedCount} recurring transactions.`);
    console.log("========================================\n");
}

function calculateNextRecurringDate(date, interval) {
    const next = new Date(date);
    switch (interval) {
        case "DAILY":
            next.setDate(next.getDate() + 1);
            break;
        case "WEEKLY":
            next.setDate(next.getDate() + 7);
            break;
        case "MONTHLY":
            next.setMonth(next.getMonth() + 1);
            break;
        case "YEARLY":
            next.setFullYear(next.getFullYear() + 1);
            break;
    }
    return next;
}

updateRecurringIntervals()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
