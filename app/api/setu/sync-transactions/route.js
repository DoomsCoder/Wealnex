import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getConsentStatus, createDataSession, fetchSessionData, parseSetuTransactions } from "@/lib/setu";

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

        // Get the account first
        let account = await db.account.findFirst({
            where: {
                id: accountId,
                userId: user.id,
            },
        });

        if (!account) {
            return NextResponse.json(
                { error: "Account not found" },
                { status: 404 }
            );
        }

        // Check if this is a linked account (either by isLinked flag or name pattern)
        const isLinkedAccount = account.isLinked ||
            account.name.toLowerCase().includes('setu-fip') ||
            account.name.includes('XXXXXXXX');

        if (!isLinkedAccount) {
            return NextResponse.json(
                { error: "This is not a linked bank account. Only linked accounts can be synced." },
                { status: 400 }
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
            // Get consent status to retrieve fiDataRange
            const consentData = await getConsentStatus(account.aaConsentId);

            if (consentData.status !== 'ACTIVE') {
                throw new Error(`Consent is not active: ${consentData.status}`);
            }

            // Create new data session with correct fiDataRange
            const session = await createDataSession(account.aaConsentId, consentData.fiDataRange);

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

            // Insert new transactions (use try-catch for duplicate handling)
            for (const txn of transactions) {
                try {
                    await db.transaction.create({ data: txn });
                    newTransactionCount++;

                    // Update running balance
                    if (txn.type === 'INCOME') {
                        balance += txn.amount;
                    } else {
                        balance -= txn.amount;
                    }
                } catch (txnError) {
                    // Transaction may already exist, skip
                    console.log('Skipping duplicate transaction:', txnError.message);
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
