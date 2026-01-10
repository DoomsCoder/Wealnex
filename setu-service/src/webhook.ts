// Webhook Handler - Receives notifications from Setu
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { WebhookPayload, WebhookType, InternalWebhookPayload } from './types';

// Get configuration from environment
const getRenderConfig = () => {
    const renderBackendUrl = process.env.RENDER_BACKEND_URL;
    const internalApiKey = process.env.INTERNAL_API_KEY;

    if (!renderBackendUrl) {
        console.warn('[Webhook] RENDER_BACKEND_URL not configured');
    }

    if (!internalApiKey) {
        console.warn('[Webhook] INTERNAL_API_KEY not configured');
    }

    return { renderBackendUrl, internalApiKey };
};

/**
 * Handle incoming webhooks from Setu
 * POST /api/webhook
 * 
 * Setu sends webhooks for:
 * - CONSENT_APPROVED / CONSENT_ACTIVE - User approved the consent
 * - CONSENT_REJECTED - User rejected the consent
 * - CONSENT_REVOKED - Consent was revoked
 * - CONSENT_EXPIRED - Consent expired
 * - FI_READY - Financial data is ready to fetch
 * - SESSION_COMPLETED - Data session completed successfully
 * - SESSION_FAILED - Data session failed
 */
export async function webhookHandler(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body as WebhookPayload;

        console.log('[Webhook] Received:', JSON.stringify(body, null, 2));

        const { type, data, consentId } = body;
        const effectiveConsentId = consentId || data?.consentId;

        if (!type) {
            console.warn('[Webhook] Missing webhook type');
            res.json({ success: false, error: 'Missing webhook type' });
            return;
        }

        console.log('[Webhook] Type:', type, 'ConsentId:', effectiveConsentId);

        // Forward webhook to Render backend
        const { renderBackendUrl, internalApiKey } = getRenderConfig();

        if (renderBackendUrl && internalApiKey) {
            try {
                const internalPayload: InternalWebhookPayload = {
                    type: type as WebhookType,
                    consentId: effectiveConsentId || '',
                    data,
                };

                console.log('[Webhook] Forwarding to Render:', renderBackendUrl);

                const forwardResponse = await fetch(`${renderBackendUrl}/api/internal/setu-webhook`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-api-key': internalApiKey,
                    },
                    body: JSON.stringify(internalPayload),
                });

                const forwardResult = await forwardResponse.text();
                console.log('[Webhook] Forward response:', forwardResponse.status, forwardResult.substring(0, 200));

                if (!forwardResponse.ok) {
                    console.error('[Webhook] Forward failed:', forwardResponse.status);
                }
            } catch (forwardError: any) {
                console.error('[Webhook] Forward error:', forwardError.message);
                // Don't fail the webhook - Setu expects 200
            }
        } else {
            console.warn('[Webhook] Skipping forward - missing configuration');
        }

        // Log specific webhook types for debugging
        switch (type) {
            case 'CONSENT_APPROVED':
            case 'CONSENT_ACTIVE':
                console.log('[Webhook] ✅ Consent approved:', effectiveConsentId);
                break;

            case 'CONSENT_REJECTED':
                console.log('[Webhook] ❌ Consent rejected:', effectiveConsentId);
                break;

            case 'CONSENT_REVOKED':
                console.log('[Webhook] 🔄 Consent revoked:', effectiveConsentId);
                break;

            case 'CONSENT_EXPIRED':
                console.log('[Webhook] ⏰ Consent expired:', effectiveConsentId);
                break;

            case 'FI_READY':
                console.log('[Webhook] 📊 Financial data ready:', effectiveConsentId);
                break;

            case 'SESSION_COMPLETED':
                console.log('[Webhook] ✅ Session completed:', data?.sessionId);
                break;

            case 'SESSION_FAILED':
                console.log('[Webhook] ❌ Session failed:', data?.sessionId);
                break;

            default:
                console.log('[Webhook] Unhandled type:', type);
        }

        // Always return 200 to acknowledge receipt
        // (Setu retries on non-200 responses)
        res.json({
            success: true,
            received: type,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('[Webhook] Error:', error.message);

        // Return 200 even on error to prevent Setu from retrying
        // (We don't want duplicate webhook processing)
        res.json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
}

/**
 * Health check for webhook endpoint
 * GET /api/webhook
 * 
 * Setu may send GET requests to verify the webhook endpoint is active
 */
export function webhookHealthHandler(req: Request, res: Response): void {
    res.json({
        status: 'ok',
        message: 'Setu webhook endpoint active',
        timestamp: new Date().toISOString(),
        region: 'ap-south-1', // Mumbai
    });
}
