import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createDataSession, fetchSessionData, parseSetuTransactions } from "@/lib/setu";

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
        const { accountId } = body;

        if (!accountId) {
            return NextResponse.json(
                { error: "Account ID is required" },
                { status: 400 }
            );
        }

        // Get the linked account
        const account = await db.account.findFirst({
            where: {
                id: accountId,
                userId: user.id,
                isLinked: true,
            },
        });

        if (!account) {
            return NextResponse.json(
                { error: "Linked account not found" },
                { status: 404 }
            );
        }

        if (!account.aaConsentId) {
            return NextResponse.json(
                { error: "No consent ID found for this account" },
                { status: 400 }
            );
        }

        // Update sync status
        await db.account.update({
            where: { id: accountId },
            data: { syncStatus: 'SYNCING' },
        });

        try {
            // Create new data session
            const session = await createDataSession(account.aaConsentId);

            // Fetch transactions
            const financialData = await fetchSessionData(session.sessionId);

            // Parse transactions
            const transactions = parseSetuTransactions(
                financialData.data,
                account.id,
                user.id
            );

            let newTransactionCount = 0;
            let balance = parseFloat(account.balance) || 0;

            // Insert new transactions (skip duplicates)
            for (const txn of transactions) {
                const existingTxn = await db.transaction.findFirst({
                    where: { externalId: txn.externalId },
                });

                if (!existingTxn) {
                    await db.transaction.create({ data: txn });
                    newTransactionCount++;

                    // Update running balance
                    if (txn.type === 'INCOME') {
                        balance += txn.amount;
                    } else {
                        balance -= txn.amount;
                    }
                }
            }

            // Update account with new balance and sync status
            await db.account.update({
                where: { id: accountId },
                data: {
                    balance: balance,
                    lastSyncedAt: new Date(),
                    syncStatus: 'SYNCED',
                },
            });

            return NextResponse.json({
                success: true,
                message: `Synced ${newTransactionCount} new transactions`,
                transactionCount: newTransactionCount,
                newBalance: balance,
            });
        } catch (syncError) {
            // Update sync status to error
            await db.account.update({
                where: { id: accountId },
                data: { syncStatus: 'ERROR' },
            });
            throw syncError;
        }
    } catch (error) {
        console.error("Sync transactions error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync transactions" },
            { status: 500 }
        );
    }
}
