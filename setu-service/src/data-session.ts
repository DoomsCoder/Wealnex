// Data Session Creation and Financial Data Fetching
import { Request, Response } from 'express';
import { setuFetch } from './auth';
import { DataSessionRequest, DataSessionResponse, FetchDataResponse, AccountData } from './types';

/**
 * Create a data session to fetch financial data
 * POST /api/session/create
 */
export async function createDataSessionHandler(req: Request, res: Response): Promise<void> {
    try {
        const { consentId, fiDataRange } = req.body as DataSessionRequest;

        // Validate required fields
        if (!consentId) {
            res.status(400).json({ error: 'consentId is required' });
            return;
        }

        if (!fiDataRange?.from || !fiDataRange?.to) {
            res.status(400).json({
                error: 'fiDataRange with from and to dates is required',
                hint: 'Get fiDataRange from the consent status response'
            });
            return;
        }

        console.log('[Create Data Session] Starting for consent:', consentId);
        console.log('[Create Data Session] Data range:', fiDataRange);

        // Build session request - MUST use exact dataRange from consent
        const sessionRequest = {
            consentId,
            format: 'json',
            dataRange: {
                from: fiDataRange.from,
                to: fiDataRange.to,
            },
        };

        console.log('[Create Data Session] Request:', JSON.stringify(sessionRequest, null, 2));

        // Call Setu API
        const response = await setuFetch('/v2/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionRequest),
        });

        console.log('[Create Data Session] Success:', response.id, 'status:', response.status);

        const result: DataSessionResponse = {
            sessionId: response.id,
            status: response.status,
        };

        res.json(result);
    } catch (error: any) {
        console.error('[Create Data Session] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to create data session',
            code: 'SESSION_CREATION_FAILED',
        });
    }
}

/**
 * Fetch financial data from a session
 * GET /api/session/:sessionId
 */
export async function fetchDataHandler(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId } = req.params;

        if (!sessionId) {
            res.status(400).json({ error: 'sessionId is required' });
            return;
        }

        console.log('[Fetch Data] Fetching session:', sessionId);

        // Get session data from Setu
        const response = await setuFetch(`/v2/sessions/${sessionId}`);

        console.log('[Fetch Data] Session status:', response.status);

        // Extract account data from Setu's FIP structure
        // Structure: response.fips[].accounts[].data.account
        const allAccountsData: AccountData[] = [];

        if (response.fips && Array.isArray(response.fips)) {
            for (const fip of response.fips) {
                console.log('[Fetch Data] Processing FIP:', fip.fipID);

                if (fip.accounts && Array.isArray(fip.accounts)) {
                    for (const account of fip.accounts) {
                        console.log('[Fetch Data] Account status:', account.FIstatus, 'masked:', account.maskedAccNumber);

                        if (account.data && account.FIstatus === 'READY') {
                            allAccountsData.push({
                                fipId: fip.fipID,
                                account: account.data.account,
                                maskedAccNumber: account.maskedAccNumber,
                                linkRefNumber: account.linkRefNumber,
                            });
                        }
                    }
                }
            }
        }

        console.log('[Fetch Data] Extracted accounts:', allAccountsData.length);

        const result: FetchDataResponse = {
            status: response.status,
            data: allAccountsData,
            fips: response.fips || [],
        };

        res.json(result);
    } catch (error: any) {
        console.error('[Fetch Data] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to fetch session data',
            code: 'DATA_FETCH_FAILED',
        });
    }
}

/**
 * Poll for data readiness (with automatic retries)
 * GET /api/session/:sessionId/poll
 */
export async function pollDataHandler(req: Request, res: Response): Promise<void> {
    try {
        const { sessionId } = req.params;
        const maxAttempts = parseInt(req.query.maxAttempts as string) || 10;
        const delayMs = parseInt(req.query.delayMs as string) || 2000;

        if (!sessionId) {
            res.status(400).json({ error: 'sessionId is required' });
            return;
        }

        console.log('[Poll Data] Starting poll for session:', sessionId, 'max attempts:', maxAttempts);

        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await setuFetch(`/v2/sessions/${sessionId}`);

            console.log('[Poll Data] Attempt', attempts + 1, 'status:', response.status);

            // COMPLETED or PARTIAL means data is available
            if (response.status === 'COMPLETED' || response.status === 'PARTIAL') {
                // Extract data
                const allAccountsData: AccountData[] = [];

                if (response.fips && Array.isArray(response.fips)) {
                    for (const fip of response.fips) {
                        if (fip.accounts && Array.isArray(fip.accounts)) {
                            for (const account of fip.accounts) {
                                if (account.data && account.FIstatus === 'READY') {
                                    allAccountsData.push({
                                        fipId: fip.fipID,
                                        account: account.data.account,
                                        maskedAccNumber: account.maskedAccNumber,
                                        linkRefNumber: account.linkRefNumber,
                                    });
                                }
                            }
                        }
                    }
                }

                console.log('[Poll Data] Data ready! Accounts:', allAccountsData.length);

                res.json({
                    status: response.status,
                    data: allAccountsData,
                    fips: response.fips || [],
                    attempts: attempts + 1,
                });
                return;
            }

            // Check for terminal failure states
            if (response.status === 'FAILED' || response.status === 'EXPIRED') {
                res.status(400).json({
                    error: `Data fetch session ${response.status.toLowerCase()}`,
                    code: `SESSION_${response.status}`,
                    attempts: attempts + 1,
                });
                return;
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, delayMs));
            attempts++;
        }

        // Timeout reached
        res.status(408).json({
            error: 'Data fetch timeout - session still pending',
            code: 'SESSION_TIMEOUT',
            attempts: maxAttempts,
        });
    } catch (error: any) {
        console.error('[Poll Data] Error:', error.message);
        res.status(500).json({
            error: error.message || 'Failed to poll session data',
            code: 'POLL_FAILED',
        });
    }
}
