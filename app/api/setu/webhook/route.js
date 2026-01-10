import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

// Webhook handler for Setu notifications
// This receives real-time updates about consent and data status

export async function POST(request) {
    try {
        const body = await request.json();

        console.log("Setu webhook received:", JSON.stringify(body, null, 2));

        const { type, data, consentId } = body;

        switch (type) {
            case 'CONSENT_APPROVED':
            case 'CONSENT_ACTIVE':
                // Consent was approved - update account status
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: { aaConsentStatus: 'ACTIVE' },
                });
                break;

            case 'CONSENT_REJECTED':
                // Consent was rejected
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: { aaConsentStatus: 'REJECTED' },
                });
                break;

            case 'CONSENT_REVOKED':
                // Consent was revoked
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: {
                        aaConsentStatus: 'REVOKED',
                        isLinked: false,
                        syncStatus: 'NEVER',
                    },
                });
                break;

            case 'CONSENT_EXPIRED':
                // Consent expired
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: {
                        aaConsentStatus: 'EXPIRED',
                        isLinked: false,
                        syncStatus: 'ERROR',
                    },
                });
                break;

            case 'FI_READY':
                // Financial data is ready to fetch
                // In production, you would trigger a data fetch here
                console.log("FI data ready for consent:", consentId || data?.consentId);
                break;

            case 'SESSION_COMPLETED':
                // Data session completed
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: { syncStatus: 'SYNCED' },
                });
                break;

            case 'SESSION_FAILED':
                // Data session failed
                await db.account.updateMany({
                    where: { aaConsentId: consentId || data?.consentId },
                    data: { syncStatus: 'ERROR' },
                });
                break;

            default:
                console.log("Unhandled webhook type:", type);
        }

        return NextResponse.json({ success: true, received: type });
    } catch (error) {
        console.error("Webhook error:", error);
        // Return 200 even on error to prevent Setu from retrying
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 200 });
    }
}

// Setu may send GET requests to verify webhook endpoint
export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Setu webhook endpoint active"
    });
}
