import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revokeConsent } from "@/lib/setu";

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
        const { accountId, deleteTransactions } = body;

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

        // Revoke consent with Setu (if consent ID exists)
        if (account.aaConsentId) {
            try {
                await revokeConsent(account.aaConsentId);
            } catch (revokeError) {
                console.error("Failed to revoke consent:", revokeError);
                // Continue even if revocation fails (consent may already be expired)
            }
        }

        // Optionally delete synced transactions
        if (deleteTransactions) {
            await db.transaction.deleteMany({
                where: {
                    accountId: accountId,
                    isAutoSynced: true,
                },
            });
        }

        // Update account to remove linked status
        await db.account.update({
            where: { id: accountId },
            data: {
                isLinked: false,
                aaConsentId: null,
                aaConsentStatus: 'REVOKED',
                institutionName: null,
                maskedAccNumber: null,
                syncStatus: 'NEVER',
            },
        });

        return NextResponse.json({
            success: true,
            message: "Bank account unlinked successfully",
        });
    } catch (error) {
        console.error("Revoke consent error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to unlink account" },
            { status: 500 }
        );
    }
}
