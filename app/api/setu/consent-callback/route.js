import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getConsentStatus, createDataSession, fetchSessionData, parseSetuTransactions } from "@/lib/setu";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const consentId = searchParams.get('id') || searchParams.get('consent_id');
        const status = searchParams.get('status');

        if (!consentId) {
            // Redirect to dashboard with error
            return NextResponse.redirect(new URL('/dashboard?error=missing_consent_id', request.url));
        }

        // Get user from session
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.redirect(new URL('/sign-in', request.url));
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.redirect(new URL('/dashboard?error=user_not_found', request.url));
        }

        // Check consent status with Setu
        const consentData = await getConsentStatus(consentId);

        if (consentData.status !== 'ACTIVE') {
            // Consent was rejected or expired
            return NextResponse.redirect(
                new URL(`/dashboard?error=consent_${consentData.status.toLowerCase()}`, request.url)
            );
        }

        // Consent approved! Create linked account
        const linkedAccounts = consentData.accounts || [];

        if (linkedAccounts.length === 0) {
            return NextResponse.redirect(new URL('/dashboard?error=no_accounts_linked', request.url));
        }

        // Create data session to fetch transactions
        const session = await createDataSession(consentId);

        // Fetch the data
        const financialData = await fetchSessionData(session.sessionId);

        // Create account for each linked bank account
        for (const bankAccount of linkedAccounts) {
            // Check if account already exists
            const existingAccount = await db.account.findFirst({
                where: {
                    userId: user.id,
                    aaConsentId: consentId,
                },
            });

            if (existingAccount) {
                // Update existing account
                await db.account.update({
                    where: { id: existingAccount.id },
                    data: {
                        aaConsentStatus: 'ACTIVE',
                        lastSyncedAt: new Date(),
                        syncStatus: 'SYNCED',
                    },
                });
                continue;
            }

            // Create new linked account
            const account = await db.account.create({
                data: {
                    name: bankAccount.maskedAccNumber || 'Linked Bank Account',
                    type: bankAccount.type === 'CURRENT' ? 'CURRENT' : 'SAVINGS',
                    balance: 0,
                    isDefault: false,
                    userId: user.id,
                    isLinked: true,
                    aaConsentId: consentId,
                    aaConsentStatus: 'ACTIVE',
                    institutionName: bankAccount.fiName || bankAccount.fipName || 'Bank',
                    maskedAccNumber: bankAccount.maskedAccNumber || 'XXXX',
                    lastSyncedAt: new Date(),
                    syncStatus: 'SYNCED',
                },
            });

            // Parse and create transactions
            const transactions = parseSetuTransactions(
                financialData.data,
                account.id,
                user.id
            );

            if (transactions.length > 0) {
                // Calculate balance from transactions
                let balance = 0;
                for (const txn of transactions) {
                    if (txn.type === 'INCOME') {
                        balance += txn.amount;
                    } else {
                        balance -= txn.amount;
                    }
                }

                // Insert transactions (skip duplicates by externalId)
                for (const txn of transactions) {
                    const existingTxn = await db.transaction.findFirst({
                        where: { externalId: txn.externalId },
                    });

                    if (!existingTxn) {
                        await db.transaction.create({ data: txn });
                    }
                }

                // Update account balance
                await db.account.update({
                    where: { id: account.id },
                    data: { balance: balance },
                });
            }
        }

        // Redirect to dashboard with success
        return NextResponse.redirect(new URL('/dashboard?success=bank_linked', request.url));
    } catch (error) {
        console.error("Consent callback error:", error);
        return NextResponse.redirect(
            new URL(`/dashboard?error=${encodeURIComponent(error.message)}`, request.url)
        );
    }
}
