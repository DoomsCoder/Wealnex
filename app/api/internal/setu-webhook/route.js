import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

/**
 * Internal Webhook Handler
 * Receives forwarded webhooks from AWS Setu Service
 * 
 * This endpoint is called by the AWS Setu microservice when it receives
 * webhooks from Setu. This keeps Setu credentials isolated on AWS.
 */
export async function POST(request) {
    try {
        // Verify internal API key
        const apiKey = request.headers.get('x-internal-api-key');
        const expectedKey = process.env.INTERNAL_API_KEY;

        if (!expectedKey) {
            console.error("[Internal Webhook] INTERNAL_API_KEY not configured");
            return NextResponse.json(
                { error: "Server misconfiguration" },
                { status: 500 }
            );
        }

        if (apiKey !== expectedKey) {
            console.error("[Internal Webhook] Invalid API key");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { type, consentId, data } = await request.json();

        console.log("[Internal Webhook] Received:", {
            type,
            consentId,
            data: JSON.stringify(data).substring(0, 200),
        });

        if (!type) {
            return NextResponse.json(
                { error: "Missing webhook type" },
                { status: 400 }
            );
        }

        // Process webhook based on type
        switch (type) {
            case 'CONSENT_APPROVED':
            case 'CONSENT_ACTIVE':
                // Consent was approved - update account status
                console.log("[Internal Webhook] Processing consent approval:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: { aaConsentStatus: 'ACTIVE' },
                });
                break;

            case 'CONSENT_REJECTED':
                // Consent was rejected
                console.log("[Internal Webhook] Processing consent rejection:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: { aaConsentStatus: 'REJECTED' },
                });
                break;

            case 'CONSENT_REVOKED':
                // Consent was revoked
                console.log("[Internal Webhook] Processing consent revocation:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: {
                        aaConsentStatus: 'REVOKED',
                        isLinked: false,
                        syncStatus: 'NEVER',
                    },
                });
                break;

            case 'CONSENT_EXPIRED':
                // Consent expired
                console.log("[Internal Webhook] Processing consent expiry:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: {
                        aaConsentStatus: 'EXPIRED',
                        isLinked: false,
                        syncStatus: 'ERROR',
                    },
                });
                break;

            case 'FI_READY':
                // Financial data is ready to fetch
                console.log("[Internal Webhook] FI data ready for consent:", consentId);
                // In production, you might trigger an automatic data fetch here
                break;

            case 'SESSION_COMPLETED':
                // Data session completed
                console.log("[Internal Webhook] Session completed for consent:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: { syncStatus: 'SYNCED' },
                });
                break;

            case 'SESSION_FAILED':
                // Data session failed
                console.log("[Internal Webhook] Session failed for consent:", consentId);
                await db.account.updateMany({
                    where: { aaConsentId: consentId },
                    data: { syncStatus: 'ERROR' },
                });
                break;

            default:
                console.log("[Internal Webhook] Unhandled webhook type:", type);
        }

        return NextResponse.json({
            success: true,
            received: type,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Internal Webhook] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: "ok",
        message: "Internal Setu webhook endpoint active",
        timestamp: new Date().toISOString(),
    });
}
