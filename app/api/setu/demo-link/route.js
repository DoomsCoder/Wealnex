import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Demo mode: Create a mock linked bank account with sample transactions
// This is for hackathon demo purposes when Setu sandbox OTP isn't available

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { bankName } = body;

        // Create a mock linked account
        const account = await db.account.create({
            data: {
                name: `${bankName || 'HDFC'} Bank Account`,
                type: "SAVINGS",
                balance: 125847.50,
                isDefault: false,
                userId: user.id,
                isLinked: true,
                aaConsentId: `demo-consent-${Date.now()}`,
                aaConsentStatus: "ACTIVE",
                institutionName: bankName || "HDFC Bank",
                maskedAccNumber: "XXXX" + Math.floor(1000 + Math.random() * 9000),
                lastSyncedAt: new Date(),
                syncStatus: "SYNCED",
            },
        });

        // Create sample transactions
        const sampleTransactions = [
            { type: "INCOME", amount: 75000, description: "Salary Credit - January", category: "salary", daysAgo: 2 },
            { type: "EXPENSE", amount: 12500, description: "Rent Payment - Jan", category: "housing", daysAgo: 3 },
            { type: "EXPENSE", amount: 2340, description: "Swiggy Food Orders", category: "food", daysAgo: 4 },
            { type: "EXPENSE", amount: 1500, description: "Netflix + Spotify", category: "entertainment", daysAgo: 5 },
            { type: "EXPENSE", amount: 3200, description: "Amazon Shopping", category: "shopping", daysAgo: 6 },
            { type: "EXPENSE", amount: 850, description: "Uber Rides", category: "transportation", daysAgo: 7 },
            { type: "EXPENSE", amount: 4500, description: "Electricity Bill", category: "utilities", daysAgo: 8 },
            { type: "INCOME", amount: 15000, description: "Freelance Payment", category: "salary", daysAgo: 10 },
            { type: "EXPENSE", amount: 6800, description: "Flipkart Shopping", category: "shopping", daysAgo: 12 },
            { type: "EXPENSE", amount: 2100, description: "Zomato Orders", category: "food", daysAgo: 14 },
        ];

        for (const txn of sampleTransactions) {
            const txnDate = new Date();
            txnDate.setDate(txnDate.getDate() - txn.daysAgo);

            await db.transaction.create({
                data: {
                    type: txn.type,
                    amount: txn.amount,
                    description: txn.description,
                    date: txnDate,
                    category: txn.category,
                    status: "COMPLETED",
                    userId: user.id,
                    accountId: account.id,
                    isAutoSynced: true,
                    externalId: `demo-txn-${Date.now()}-${Math.random()}`,
                },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Demo linked account created successfully!",
            account: {
                id: account.id,
                name: account.name,
                institutionName: account.institutionName,
                balance: account.balance,
            },
        });
    } catch (error) {
        console.error("Demo mode error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create demo account" },
            { status: 500 }
        );
    }
}
