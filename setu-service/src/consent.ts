// Consent Creation and Management
import { Request, Response } from 'express';
import { setuFetch } from './auth';
import { ConsentRequest, ConsentResponse, ConsentStatusResponse, DataRange } from './types';

/**
 * Create a new consent request with Setu
 * POST /api/consent/create
 */
export async function createConsentHandler(req: Request, res: Response): Promise<void> {
    try {
        const { mobileNumber, redirectUrl } = req.body as ConsentRequest;

        // Validate required fields
        if (!mobileNumber) {
            res.status(400).json({ error: 'mobileNumber is required' });
            return;
        }

        if (!redirectUrl) {
            res.status(400).json({ error: 'redirectUrl is required' });
            return;
        }

        // Validate mobile number format (10 digits for India)
        const cleanMobile = mobileNumber.replace(/\D/g, '');
        if (cleanMobile.length !== 10) {
            res.status(400).json({ error: 'Invalid mobile number format. Must be 10 digits.' });
            return;
        }

        console.log('[Create Consent] Starting for mobile:', cleanMobile.substring(0, 4) + '******');

        // Build consent request payload
        const consentRequest = {
            consentDuration: {
                unit: 'MONTH',
                value: 1,
            },
            // VUA format: mobile@aa-handle (force OneMoney AA)
            vua: `${cleanMobile}@onemoney`,
            // Request data for the past year
            dataRange: {
                from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString(),
            },
            // In sandbox, specify Setu's mock FIP for testing with static OTP 123456
            context: process.env.SETU_ENV === 'production' ? [] : [
                { key: 'fipId', value: 'setu-fip-2' }
            ],
            redirectUrl,
        };

        console.log('[Create Consent] Request payload:', JSON.stringify(consentRequest, null, 2));

        // Call Setu API
        const response = await setuFetch('/v2/consents', {
            method: 'POST',
            body: JSON.stringify(consentRequest),
        });

        console.log('[Create Consent] Success:', response.id);

        // Return consent details to caller
        const result: ConsentResponse = {
            success: true,
            consentId: response.id,
            redirectUrl: response.url,
            status: response.status,
        };

        res.json(result);
    } catch (error: any) {
        console.error('[Create Consent] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to create consent',
            code: 'CONSENT_CREATION_FAILED',
        });
    }
}

/**
 * Get consent status from Setu
 * GET /api/consent/:consentId
 */
export async function getConsentStatusHandler(req: Request, res: Response): Promise<void> {
    try {
        const { consentId } = req.params;

        if (!consentId) {
            res.status(400).json({ error: 'consentId is required' });
            return;
        }

        console.log('[Get Consent Status] Fetching:', consentId);

        // Get consent with expanded details
        const response = await setuFetch(`/v2/consents/${consentId}?expanded=true`);

        console.log('[Get Consent Status] Raw response:', JSON.stringify(response, null, 2).substring(0, 1000));

        // Extract FI Data Range from response
        let fiDataRange: DataRange | null = null;

        if (response.detail?.dataRange) {
            // From expanded response detail
            fiDataRange = response.detail.dataRange;
            console.log('[Get Consent Status] Using dataRange from detail:', fiDataRange);
        } else if (response.fiDataRange) {
            // Direct field
            fiDataRange = response.fiDataRange;
        } else if (response.dataRange) {
            // Alternative field
            fiDataRange = response.dataRange;
        } else if (response.detail?.consentStart) {
            // Calculate from consent start time
            const creationDate = new Date(response.detail.consentStart);
            const oneYearBefore = new Date(creationDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            fiDataRange = {
                from: oneYearBefore.toISOString(),
                to: creationDate.toISOString(),
            };
            console.log('[Get Consent Status] Calculated fiDataRange from consentStart:', fiDataRange);
        }

        // Build response
        const result: ConsentStatusResponse = {
            id: response.id,
            status: response.status,
            accounts: response.accountsLinked || response.accounts || [],
            detail: response.detail || {},
            fiDataRange: fiDataRange || { from: '', to: '' },
        };

        console.log('[Get Consent Status] Returning status:', result.status, 'accounts:', result.accounts.length);

        res.json(result);
    } catch (error: any) {
        console.error('[Get Consent Status] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to get consent status',
            code: 'CONSENT_STATUS_FAILED',
        });
    }
}

/**
 * Revoke an existing consent
 * DELETE /api/consent/:consentId
 */
export async function revokeConsentHandler(req: Request, res: Response): Promise<void> {
    try {
        const { consentId } = req.params;

        if (!consentId) {
            res.status(400).json({ error: 'consentId is required' });
            return;
        }

        console.log('[Revoke Consent] Revoking:', consentId);

        const response = await setuFetch(`/v2/consents/${consentId}`, {
            method: 'DELETE',
        });

        console.log('[Revoke Consent] Success');

        res.json({
            success: true,
            status: response.status || 'REVOKED',
        });
    } catch (error: any) {
        console.error('[Revoke Consent] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to revoke consent',
            code: 'CONSENT_REVOKE_FAILED',
        });
    }
}
